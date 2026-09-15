import os
import json
import tempfile
import time
from typing import Any, Dict, List, Optional

import cv2
import joblib
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# YOLO is loaded lazily, so /health can work even before the first prediction.
_yolo_model = None

APP_TITLE = "Riayah Backend API"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

CLASS_MODEL_PATH = os.path.join(MODELS_DIR, "final_classification_model.joblib")
REG_MODEL_PATH = os.path.join(MODELS_DIR, "final_regression_model_gru.pt")

# Exercise mapping used during training.
IDX_TO_EXERCISE = {
    0: "E01 - Abduction",
    1: "E02 - Adduction",
    2: "E03 - Lateral Rotation",
    3: "E04 - Medial Rotation",
    4: "E05 - Circumduction",
    5: "E06 - Wrist Extension",
    6: "E07 - Hip Joint Flexion",
    7: "E08 - Lumbar Flexion",
    8: "E09 - Back Extension",
}

# COCO-17 keypoint indices
NOSE = 0
L_SHOULDER, R_SHOULDER = 5, 6
L_ELBOW, R_ELBOW = 7, 8
L_WRIST, R_WRIST = 9, 10
L_HIP, R_HIP = 11, 12
L_KNEE, R_KNEE = 13, 14
L_ANKLE, R_ANKLE = 15, 16

MIN_CONF_FOR_REFERENCE = 0.10

ANGLE_TRIPLETS = {
    "left_elbow": (L_SHOULDER, L_ELBOW, L_WRIST),
    "right_elbow": (R_SHOULDER, R_ELBOW, R_WRIST),
    "left_shoulder": (L_ELBOW, L_SHOULDER, L_HIP),
    "right_shoulder": (R_ELBOW, R_SHOULDER, R_HIP),
    "left_hip": (L_SHOULDER, L_HIP, L_KNEE),
    "right_hip": (R_SHOULDER, R_HIP, R_KNEE),
    "left_knee": (L_HIP, L_KNEE, L_ANKLE),
    "right_knee": (R_HIP, R_KNEE, R_ANKLE),
}

SYMMETRY_PAIRS = [
    ("left_elbow", "right_elbow"),
    ("left_shoulder", "right_shoulder"),
    ("left_hip", "right_hip"),
    ("left_knee", "right_knee"),
]

DISCLAIMER = (
    "هذا التقييم مخصص لدعم التمارين فقط، ولا يُعد تشخيصًا طبيًا ولا بديلًا عن "
    "توجيهات أخصائي العلاج الطبيعي المؤهل."
)

app = FastAPI(title=APP_TITLE)
print("[startup] Riayah backend: YOLO imgsz=320, batch up to 16, 45 frames preserved", flush=True)

# Allow Emergent/Lovable/any frontend during MVP.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GRUQualityRegressor(nn.Module):
    """Same GRU architecture used in the final notebook.

    The saved file final_regression_model_gru.pt contains a state_dict plus
    feature_mean, feature_std, and score_stats. This class is required to load
    that state_dict correctly on Render.
    """
    def __init__(self, input_size: int, hidden_size: int = 128, num_layers: int = 2, dropout: float = 0.25):
        super().__init__()
        self.gru = nn.GRU(
            input_size=input_size,
            hidden_size=hidden_size,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0.0,
            bidirectional=True,
        )
        self.head = nn.Sequential(
            nn.LayerNorm(hidden_size * 2),
            nn.Linear(hidden_size * 2, 64),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(64, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        sequence_output, _ = self.gru(x)
        pooled = sequence_output.mean(dim=1)
        return self.head(pooled).squeeze(1)


classification_model = joblib.load(CLASS_MODEL_PATH)

# Load final GRU regression model (.pt), not joblib.
REGRESSION_DEVICE = torch.device("cpu")
try:
    regression_checkpoint = torch.load(REG_MODEL_PATH, map_location=REGRESSION_DEVICE, weights_only=False)
except TypeError:
    regression_checkpoint = torch.load(REG_MODEL_PATH, map_location=REGRESSION_DEVICE)

regression_feature_mean = np.asarray(regression_checkpoint["feature_mean"], dtype=np.float32)
regression_feature_std = np.asarray(regression_checkpoint["feature_std"], dtype=np.float32)
regression_feature_std[regression_feature_std < 1e-6] = 1.0
regression_score_stats = regression_checkpoint["score_stats"]

regression_model = GRUQualityRegressor(
    input_size=int(regression_checkpoint.get("input_size", regression_feature_mean.shape[0])),
    hidden_size=128,
    num_layers=2,
    dropout=0.25,
).to(REGRESSION_DEVICE)
regression_model.load_state_dict(regression_checkpoint["model_state_dict"])
regression_model.eval()


def get_yolo_model():
    global _yolo_model
    if _yolo_model is None:
        from ultralytics import YOLO
        _yolo_model = YOLO("yolov8n-pose.pt")
    return _yolo_model


def sample_45_frames(video_path: str) -> List[np.ndarray]:
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open uploaded video.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    if total_frames <= 0:
        cap.release()
        raise ValueError("Uploaded video has no readable frames.")

    sampled_indices = np.linspace(0, total_frames - 1, 45).astype(int)
    frames = []

    for frame_idx in sampled_indices:
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(frame_idx))
        ok, frame = cap.read()
        if ok and frame is not None:
            frames.append(frame)
        else:
            frames.append(None)

    cap.release()
    return frames


def extract_pose_from_video(video_path: str) -> np.ndarray:
    """Return raw YOLO pose array with shape (45, 17, 3).

    The 45 sampled frames are sent to YOLO in one batched call instead of
    calling model.predict() once per frame. This keeps the model input the
    same as training while reducing request overhead on Render.
    """
    model = get_yolo_model()
    frames = sample_45_frames(video_path)

    output = [np.zeros((17, 3), dtype=np.float32) for _ in range(45)]

    valid_indices = [i for i, frame in enumerate(frames) if frame is not None]
    valid_frames = [frames[i] for i in valid_indices]

    if not valid_frames:
        return np.asarray(output, dtype=np.float32)

    # Speed-focused inference for Render CPU:
    # - keep all 45 sampled frames so the GRU input matches training
    # - reduce YOLO inference resolution
    # - process more frames per batch
    # - keep only one person because the exercise videos contain one subject
    results = model.predict(
        source=valid_frames,
        verbose=False,
        imgsz=320,
        batch=min(16, len(valid_frames)),
        max_det=1,
        device="cpu",
    )

    for original_idx, result in zip(valid_indices, results):
        if result.keypoints is None or len(result.keypoints.xy) == 0:
            continue

        xy = result.keypoints.xy[0].cpu().numpy()
        conf = result.keypoints.conf[0].cpu().numpy()

        if xy.shape[0] >= 17 and conf.shape[0] >= 17:
            output[original_idx] = np.c_[xy[:17], conf[:17]].astype(np.float32)

    return np.asarray(output, dtype=np.float32)


def _valid_point(frame: np.ndarray, idx: int) -> Optional[np.ndarray]:
    point = frame[idx]
    if point[2] >= MIN_CONF_FOR_REFERENCE and np.isfinite(point[:2]).all():
        return point[:2].astype(np.float32)
    return None


def _hip_center(frame: np.ndarray) -> Optional[np.ndarray]:
    left = _valid_point(frame, L_HIP)
    right = _valid_point(frame, R_HIP)

    if left is not None and right is not None:
        return (left + right) / 2.0
    if left is not None:
        return left
    if right is not None:
        return right
    return None


def _torso_length(frame: np.ndarray) -> Optional[float]:
    left_sh = _valid_point(frame, L_SHOULDER)
    right_sh = _valid_point(frame, R_SHOULDER)
    left_hip = _valid_point(frame, L_HIP)
    right_hip = _valid_point(frame, R_HIP)

    if left_sh is None or right_sh is None or left_hip is None or right_hip is None:
        return None

    shoulder_mid = (left_sh + right_sh) / 2.0
    hip_mid = (left_hip + right_hip) / 2.0
    length = float(np.linalg.norm(shoulder_mid - hip_mid))

    if not np.isfinite(length) or length <= 1e-6:
        return None

    return length


def normalize_pose_sequence(raw_pose: np.ndarray) -> np.ndarray:
    """Normalize a single raw pose sequence to shape (45, 17, 3)."""
    raw_pose = np.asarray(raw_pose, dtype=np.float32)
    if raw_pose.shape != (45, 17, 3):
        raise ValueError(f"Expected pose shape (45, 17, 3), got {raw_pose.shape}")

    scales = []
    for frame in raw_pose:
        length = _torso_length(frame)
        if length is not None:
            scales.append(length)

    scale = float(np.median(scales)) if scales else 1.0
    if not np.isfinite(scale) or scale <= 1e-6:
        scale = 1.0

    normalized = raw_pose.copy()

    for i, frame in enumerate(raw_pose):
        center = _hip_center(frame)

        if center is None:
            # Keep confidence, but zero spatial coordinates for invalid reference frames.
            normalized[i, :, :2] = 0.0
            normalized[i, :, 2] = frame[:, 2]
        else:
            normalized[i, :, :2] = (frame[:, :2] - center) / scale
            normalized[i, :, 2] = frame[:, 2]

    normalized = np.nan_to_num(normalized, nan=0.0, posinf=0.0, neginf=0.0)
    return normalized.astype(np.float32)


def flatten_pose(X: np.ndarray) -> np.ndarray:
    return X.reshape(X.shape[0], -1).astype(np.float32)


def extract_engineered_features(X: np.ndarray) -> np.ndarray:
    features = []

    for sample in X:
        xy = sample[:, :, :2]
        conf = sample[:, :, 2]

        sample_features = []
        sample_features.extend(np.mean(xy, axis=0).flatten())
        sample_features.extend(np.std(xy, axis=0).flatten())
        sample_features.extend(np.min(xy, axis=0).flatten())
        sample_features.extend(np.max(xy, axis=0).flatten())

        movement = np.diff(xy, axis=0)
        movement_mag = np.sqrt(np.sum(movement ** 2, axis=-1))
        sample_features.extend(np.mean(movement_mag, axis=0).flatten())

        sample_features.extend(np.mean(conf, axis=0).flatten())
        features.append(sample_features)

    return np.asarray(features, dtype=np.float32)


def _safe_stats(x: np.ndarray) -> List[float]:
    x = np.asarray(x, dtype=np.float32)
    x = x[np.isfinite(x)]
    if len(x) == 0:
        return [0.0] * 8
    return [
        float(np.mean(x)),
        float(np.std(x)),
        float(np.min(x)),
        float(np.percentile(x, 25)),
        float(np.median(x)),
        float(np.percentile(x, 75)),
        float(np.max(x)),
        float(np.max(x) - np.min(x)),
    ]


def _angle_series(xy: np.ndarray, a: int, b: int, c: int) -> np.ndarray:
    ba = xy[:, a] - xy[:, b]
    bc = xy[:, c] - xy[:, b]

    ba_norm = np.linalg.norm(ba, axis=1)
    bc_norm = np.linalg.norm(bc, axis=1)
    denom = np.maximum(ba_norm * bc_norm, 1e-8)

    cosine = np.sum(ba * bc, axis=1) / denom
    cosine = np.clip(cosine, -1.0, 1.0)
    return np.degrees(np.arccos(cosine)).astype(np.float32)


def extract_kinematic_quality_features(X: np.ndarray) -> np.ndarray:
    output = []

    for sample in X:
        xy = sample[:, :, :2].astype(np.float32)
        conf = sample[:, :, 2].astype(np.float32)

        f = []

        for kp in range(xy.shape[1]):
            f.extend(_safe_stats(xy[:, kp, 0]))
            f.extend(_safe_stats(xy[:, kp, 1]))

        velocity = np.diff(xy, axis=0)
        speed = np.linalg.norm(velocity, axis=-1)

        acceleration = np.diff(velocity, axis=0)
        accel_mag = np.linalg.norm(acceleration, axis=-1)

        for kp in range(xy.shape[1]):
            f.extend(_safe_stats(speed[:, kp]))
            f.extend(_safe_stats(accel_mag[:, kp]))

        angle_cache = {}
        for name, (a, b, c) in ANGLE_TRIPLETS.items():
            angles = _angle_series(xy, a, b, c)
            angle_cache[name] = angles

            f.extend(_safe_stats(angles))
            angular_velocity = np.diff(angles)
            f.extend(_safe_stats(np.abs(angular_velocity)))

        for left_name, right_name in SYMMETRY_PAIRS:
            symmetry_error = np.abs(angle_cache[left_name] - angle_cache[right_name])
            f.extend(_safe_stats(symmetry_error))

        shoulder_mid = (xy[:, L_SHOULDER] + xy[:, R_SHOULDER]) / 2.0
        hip_mid = (xy[:, L_HIP] + xy[:, R_HIP]) / 2.0
        torso_vec = shoulder_mid - hip_mid

        torso_angle = np.degrees(np.arctan2(torso_vec[:, 0], -torso_vec[:, 1] + 1e-8))
        f.extend(_safe_stats(torso_angle))

        hip_motion = np.linalg.norm(np.diff(hip_mid, axis=0), axis=1)
        shoulder_motion = np.linalg.norm(np.diff(shoulder_mid, axis=0), axis=1)
        f.extend(_safe_stats(hip_motion))
        f.extend(_safe_stats(shoulder_motion))

        global_speed = np.mean(speed, axis=1)
        global_accel = np.mean(accel_mag, axis=1)
        f.extend(_safe_stats(global_speed))
        f.extend(_safe_stats(global_accel))

        f.extend(_safe_stats(conf.flatten()))
        f.extend(np.mean(conf, axis=0).tolist())

        output.append(f)

    return np.asarray(output, dtype=np.float32)


def exercise_one_hot(labels: np.ndarray, n_classes: int = 9) -> np.ndarray:
    labels = np.asarray(labels, dtype=np.int64)
    out = np.zeros((len(labels), n_classes), dtype=np.float32)
    out[np.arange(len(labels)), labels] = 1.0
    return out


def build_quality_feature_matrix(X: np.ndarray, X_basic_eng: np.ndarray, exercise_labels: np.ndarray) -> np.ndarray:
    kin = extract_kinematic_quality_features(X)
    ex = exercise_one_hot(exercise_labels, 9)
    return np.hstack([X_basic_eng, kin, ex]).astype(np.float32)



def angle_3_points(a: np.ndarray, b: np.ndarray, c: np.ndarray) -> np.ndarray:
    ba = a - b
    bc = c - b
    dot = np.sum(ba * bc, axis=-1)
    norm = np.linalg.norm(ba, axis=-1) * np.linalg.norm(bc, axis=-1)
    cos_angle = dot / (norm + 1e-6)
    cos_angle = np.clip(cos_angle, -1.0, 1.0)
    return (np.degrees(np.arccos(cos_angle)) / 180.0).astype(np.float32)


def line_angle(p1: np.ndarray, p2: np.ndarray) -> np.ndarray:
    v = p2 - p1
    return (np.arctan2(v[..., 1], v[..., 0] + 1e-6) / np.pi).astype(np.float32)


def build_temporal_kinematic_features(X: np.ndarray, exercise_labels: np.ndarray) -> np.ndarray:
    """Build the same 88-feature temporal sequence used by the GRU notebook."""
    X = np.asarray(X, dtype=np.float32)
    exercise_labels = np.asarray(exercise_labels, dtype=np.int64)

    N, T, K, C = X.shape
    xy = X[:, :, :, 0:2]
    conf = X[:, :, :, 2]

    speed = np.zeros((N, T, K), dtype=np.float32)
    speed[:, 1:, :] = np.linalg.norm(xy[:, 1:, :, :] - xy[:, :-1, :, :], axis=-1)

    angle_specs = [
        (5, 7, 9),
        (6, 8, 10),
        (7, 5, 11),
        (8, 6, 12),
        (5, 11, 13),
        (6, 12, 14),
        (11, 13, 15),
        (12, 14, 16),
    ]

    angle_features = []
    for a, b, c in angle_specs:
        angle_features.append(angle_3_points(xy[:, :, a, :], xy[:, :, b, :], xy[:, :, c, :])[..., None])
    angle_features = np.concatenate(angle_features, axis=-1).astype(np.float32)

    mid_shoulder = (xy[:, :, 5, :] + xy[:, :, 6, :]) / 2.0
    mid_hip = (xy[:, :, 11, :] + xy[:, :, 12, :]) / 2.0

    trunk_line = line_angle(mid_hip, mid_shoulder)[..., None]
    shoulder_tilt = line_angle(xy[:, :, 5, :], xy[:, :, 6, :])[..., None]
    hip_tilt = line_angle(xy[:, :, 11, :], xy[:, :, 12, :])[..., None]

    n_exercises = len(IDX_TO_EXERCISE)
    exercise_onehot = np.eye(n_exercises, dtype=np.float32)[exercise_labels]
    exercise_repeated = np.repeat(exercise_onehot[:, None, :], T, axis=1)

    seq_features = np.concatenate(
        [
            xy.reshape(N, T, K * 2),
            conf.reshape(N, T, K),
            speed.reshape(N, T, K),
            angle_features,
            trunk_line,
            shoulder_tilt,
            hip_tilt,
            exercise_repeated,
        ],
        axis=-1,
    ).astype(np.float32)

    return np.nan_to_num(seq_features, nan=0.0, posinf=0.0, neginf=0.0)


def _get_score_stats(exercise_id: int) -> Dict[str, float]:
    """Read per-exercise mean/std from checkpoint with int or string keys."""
    if exercise_id in regression_score_stats:
        stats = regression_score_stats[exercise_id]
    elif str(exercise_id) in regression_score_stats:
        stats = regression_score_stats[str(exercise_id)]
    else:
        # Some checkpoints may store pandas-style indexes like "0" or numpy ints.
        stats = list(regression_score_stats.values())[exercise_id]

    return {
        "mean": float(stats["mean"]),
        "std": float(stats["std"] if float(stats["std"]) >= 1e-6 else 1.0),
    }


def z_to_score_single(z_value: float, exercise_id: int) -> float:
    stats = _get_score_stats(int(exercise_id))
    score = float(z_value) * stats["std"] + stats["mean"]
    return float(np.clip(score, 0.0, 100.0))


def predict_gru_quality_score(normalized_pose_batch: np.ndarray, exercise_labels: np.ndarray) -> float:
    """Predict quality score using final_regression_model_gru.pt."""
    seq = build_temporal_kinematic_features(normalized_pose_batch, exercise_labels)
    seq_scaled = ((seq - regression_feature_mean) / regression_feature_std).astype(np.float32)
    seq_scaled = np.nan_to_num(seq_scaled, nan=0.0, posinf=0.0, neginf=0.0)

    with torch.no_grad():
        xb = torch.tensor(seq_scaled, dtype=torch.float32, device=REGRESSION_DEVICE)
        pred_z = regression_model(xb).detach().cpu().numpy()

    return z_to_score_single(float(pred_z[0]), int(exercise_labels[0]))


def deterministic_feedback(payload: Dict[str, Any]) -> str:
    exercise = payload["exercise"]
    score = payload["ai_estimated_quality_score"]
    confidence = payload["classification_confidence"]

    parts = [
        f"التمرين المكتشف: {exercise} (نسبة الثقة {confidence:.0%}).",
        f"درجة جودة الحركة المقدّرة بالذكاء الاصطناعي: {score:.1f}/100.",
    ]

    observations = payload.get("observations") or []
    if observations:
        parts.append("ملاحظات الحركة: " + "; ".join(observations[:3]) + ".")

    parts.append(DISCLAIMER)
    return " ".join(parts)


def build_llm_payload(
    exercise: str,
    classification_confidence: float,
    ai_estimated_quality_score: float,
    observations: Optional[List[str]] = None,
) -> Dict[str, Any]:
    return {
        "exercise": str(exercise),
        "classification_confidence": float(np.clip(classification_confidence, 0.0, 1.0)),
        "ai_estimated_quality_score": float(np.clip(ai_estimated_quality_score, 0.0, 100.0)),
        "observations": list(observations or []),
    }


def feedback_is_safe(text: str) -> bool:
    unsafe_patterns = [
        r"\byou have (?:an? )?[a-z]",
        r"\byou suffer from\b",
        r"\byour diagnosis is\b",
        r"\byou are diagnosed with\b",
        r"\bthis indicates (?:an? )?(?:injury|disease|disorder)\b",
        r"\byou need (?:medical )?treatment\b",
        r"\bi prescribe\b",
        r"\byou should take (?:medication|medicine|drugs?)\b",
    ]
    lowered = text.lower()
    return not any(__import__("re").search(pattern, lowered) for pattern in unsafe_patterns)


def ensure_safe_feedback(text: str, payload: Dict[str, Any]) -> str:
    if not text or not feedback_is_safe(text):
        return deterministic_feedback(payload)

    safety_markers = ["not a medical diagnosis", "لا يُعد تشخيصًا طبيًا", "ليس تشخيصًا طبيًا"]
    if not any(marker in text.lower() for marker in safety_markers):
        text = text.rstrip() + " " + DISCLAIMER

    return text


PROMPT_V1 = """
You are the feedback-writing layer of Riayah, a home physiotherapy exercise-support prototype.

Use only the validated structured values supplied by the application.
- Do not diagnose injuries, diseases, or medical conditions.
- Do not invent exercise labels, measurements, repetitions, observations, or scores.
- Call the score an AI-estimated movement-quality score.
- Only mention observations supplied in the structured input.
- Keep the response concise, supportive, and easy to understand.
- Always state that the feedback is not a medical diagnosis and does not replace guidance from a qualified physiotherapist.

Return:
Movement Score: <score>/100
What You Did Well:
- <grounded point>
What to Improve:
- <grounded point or safe general coaching point>
Next Session Tip:
- <short tip>
Coach's Note:
<one encouraging sentence>
""".strip()


PROMPT_V2 = """
You are Riayah's AI exercise-coach feedback layer.

Your job is to convert validated computer-vision and machine-learning results
into clear, supportive Arabic feedback for a person performing a home
physiotherapy exercise.

The application has already identified the exercise and estimated the movement
quality score. You are NOT responsible for classification or scoring.

STRICT GROUNDING RULES:
1. Use ONLY the values and observations provided in the JSON input.
2. Never change or recalculate the supplied score. Display it rounded to exactly one decimal place.
3. Never invent repetitions, joint angles, measurements, symptoms, movement
   errors, injuries, diseases, or diagnoses.
4. Only describe a specific movement problem if it appears explicitly in
   "observations".
5. If "observations" is empty, do NOT claim that a specific fault was detected.
   Instead, provide safe general coaching about controlled, steady, and
   consistent movement.
6. If classification confidence is low, you may mention that the exercise
   identification is less certain, but do not guess another exercise.
7. Do not recommend medication, medical treatment, or clinical decisions.
8. Do not claim that Riayah replaces a qualified physiotherapist.
9. Keep the feedback concise, practical, supportive, and easy to understand.

LANGUAGE REQUIREMENT:
- Write the ENTIRE user-facing response in clear, natural Arabic.
- Do not use English headings or English explanatory sentences.
- Exercise names may remain in English only when the exercise name supplied
  in the JSON is in English and no Arabic label is provided.
- Keep all validated numerical values exactly grounded in the JSON.
- Use a warm and professional tone suitable for Riayah users.

OUTPUT FORMAT — follow this structure exactly:

درجة جودة الحركة: <ai_estimated_quality_score rounded to exactly one decimal place>/100

ما الذي أديته بشكل جيد:
- <نقطة إيجابية واحدة مبنية على البيانات المتاحة، أو تشجيع عام آمن إذا لم توجد ملاحظة إيجابية محددة>

ما الذي يمكنك تحسينه:
- <ملاحظة تحسين مبنية فقط على observations، أو نصيحة عامة آمنة إذا لم توجد ملاحظة محددة>

نصيحة للجلسة القادمة:
- <نصيحة عملية قصيرة وآمنة>

ملاحظة رعاية:
<جملة تشجيعية قصيرة>

تنبيه: هذا التقييم مخصص لدعم التمارين فقط، ولا يُعد تشخيصًا طبيًا ولا بديلًا عن توجيهات أخصائي العلاج الطبيعي المؤهل.
""".strip()


def generate_with_prompt(
    client,
    model_name: str,
    system_prompt: str,
    payload: Dict[str, Any],
) -> str:
    user_prompt = (
        "اكتب ملاحظات رعاية اعتمادًا فقط على نتيجة تحليل الحركة التالية. "
        "لا تستخدم أي معلومات غير موجودة في JSON، ولا تخترع أي قياسات أو ملاحظات.\n\n"
        + json.dumps(payload, ensure_ascii=False, indent=2)
    )

    response = client.responses.create(
        model=model_name,
        instructions=system_prompt,
        input=user_prompt,
        max_output_tokens=300,
    )

    return response.output_text.strip()


def llm_feedback(payload: Dict[str, Any]) -> str:
    """
    Generate Riayah Arabic feedback using the selected Prompt V2.

    Prompt V1 is preserved for the experiment/report comparison.
    The deployed MVP uses Prompt V2 only.
    """

    api_key = os.getenv("OPENAI_API_KEY")
    model_name = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")

    if not api_key:
        return deterministic_feedback(payload)

    try:
        from openai import OpenAI

        client = OpenAI(
            api_key=api_key,
            timeout=20.0,
        )

        feedback = generate_with_prompt(
            client=client,
            model_name=model_name,
            system_prompt=PROMPT_V2,
            payload=payload,
        )

        return ensure_safe_feedback(feedback, payload)

    except Exception as exc:
        print(
            f"[LLM fallback] {type(exc).__name__}: {exc}",
            flush=True,
        )
        return deterministic_feedback(payload)


def predict_from_pose(normalized_pose: np.ndarray) -> Dict[str, Any]:
    X = normalized_pose[None, :, :, :].astype(np.float32)

    X_eng = extract_engineered_features(X)
    cls_pred = int(classification_model.predict(X_eng)[0])

    if hasattr(classification_model, "predict_proba"):
        proba = classification_model.predict_proba(X_eng)[0]
        confidence = float(np.max(proba))
    else:
        confidence = 0.0

    exercise_name = IDX_TO_EXERCISE.get(cls_pred, str(cls_pred))

    # Regression uses the final GRU PyTorch model saved as final_regression_model_gru.pt.
    quality_score = predict_gru_quality_score(
        X,
        np.array([cls_pred], dtype=np.int64),
    )
    quality_score = float(np.clip(quality_score, 0.0, 100.0))

    observations = []
    if confidence < 0.60:
        observations.append("classification confidence is low")
    if quality_score < 60:
        observations.append("the estimated quality score is low")

    payload = build_llm_payload(
        exercise=exercise_name,
        classification_confidence=confidence,
        ai_estimated_quality_score=quality_score,
        observations=observations,
    )
    feedback = llm_feedback(payload)

    return {
        "exercise": exercise_name,
        "exercise_index": cls_pred,
        "confidence": confidence,
        "quality_score": quality_score,
        "feedback": feedback,
        "payload": payload,
    }


@app.get("/")
def root():
    return {"message": "Riayah backend is running. Open /docs to test the API."}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "classification_model_features": int(getattr(classification_model, "n_features_in_", -1)),
        "regression_model_features": int(getattr(regression_model, "n_features_in_", -1)),
        "openai_key_configured": bool(os.getenv("OPENAI_API_KEY")),
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    allowed_extensions = (".mp4", ".mov", ".avi", ".mkv")
    filename = file.filename or "uploaded_video.mp4"

    if not filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Please upload a video file such as MP4, MOV, AVI, or MKV."
        )

    suffix = os.path.splitext(filename)[1] or ".mp4"

    temp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            temp_path = tmp.name
            tmp.write(await file.read())

        request_start = time.perf_counter()

        pose_start = time.perf_counter()
        raw_pose = extract_pose_from_video(temp_path)
        print(f"[timing] YOLO pose extraction: {time.perf_counter() - pose_start:.2f}s", flush=True)

        normalized_pose = normalize_pose_sequence(raw_pose)

        model_start = time.perf_counter()
        result = predict_from_pose(normalized_pose)
        print(f"[timing] ML + LLM pipeline: {time.perf_counter() - model_start:.2f}s", flush=True)
        print(f"[timing] Total /predict: {time.perf_counter() - request_start:.2f}s", flush=True)

        return {
            "success": True,
            "filename": filename,
            **result,
            "disclaimer": DISCLAIMER,
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {type(exc).__name__}: {exc}")

    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)

# -----------------------------------------------------------------------------
# Frontend compatibility routes
# The React MVP calls /api/health, /api/wake, and /api/analyze.
# Keep the canonical /health and /predict routes above while exposing these
# aliases so the frontend can connect directly to this Render service.
# -----------------------------------------------------------------------------
@app.get("/api/health")
def api_health():
    data = health()
    return {"backend": "ok", **data}


@app.post("/api/wake")
def api_wake():
    # Lightweight endpoint used by the frontend to wake a sleeping Render service.
    return {"backend": "ok", "status": "awake"}


@app.post("/api/analyze")
async def api_analyze(file: UploadFile = File(...)):
    return await predict(file)

