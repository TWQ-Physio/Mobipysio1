import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  UploadCloud,
  Film,
  X,
  Play,
  Loader2,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ACCEPTED = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi", "video/mov"];
const ACCEPT_ATTR = ".mp4,.mov,.avi,video/*";
const MAX_SIZE_MB = 100;

const PROCESSING_MESSAGES = [
  "جاري تحضير الفيديو...",
  "نحلّل الحركة ووضعية الجسم...",
  "نستخرج زوايا المفاصل وتقييم الأداء...",
  "نُعدّ ملاحظاتك النهائية...",
];

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} كيلوبايت`;
  return `${mb.toFixed(1)} ميجابايت`;
}

export default function UploadFlow() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState("idle"); // idle | processing | result | error
  const [msgIdx, setMsgIdx] = useState(0);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [backendReady, setBackendReady] = useState(true);
  const inputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    axios
      .get(`${API}/health`, { timeout: 8000 })
      .then((r) => { if (!cancelled) setBackendReady(r.data?.backend === "ok"); })
      .catch(() => { if (!cancelled) setBackendReady(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (phase !== "processing") return;
    const id = setInterval(() => setMsgIdx((i) => (i + 1) % PROCESSING_MESSAGES.length), 2200);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const pickFile = (f) => {
    if (!f) return;
    const okType = ACCEPTED.includes(f.type) || /\.(mp4|mov|avi)$/i.test(f.name);
    if (!okType) {
      toast.error("صيغة غير مدعومة", { description: "الصيغ المدعومة: MP4, MOV, AVI" });
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error("حجم الملف كبير", { description: `الحد الأقصى ${MAX_SIZE_MB} ميجابايت.` });
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setPhase("idle");
    // Warm the inference backend so cold-start finishes while the user reviews the video.
    axios.post(`${API}/wake`, null, { timeout: 10000 }).catch(() => {});
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    pickFile(f);
  };

  const removeFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!file) return;
    setPhase("processing");
    setMsgIdx(0);
    setErrorMsg("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await axios.post(`${API}/analyze`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });
      setResult(res.data);
      setPhase("result");
      setTimeout(() => {
        const el = document.querySelector("#results");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (e) {
      const detail = e?.response?.data?.detail;
      const genericMsg = "تعذر الاتصال بالخدمة حالياً. يرجى المحاولة مرة أخرى.";
      const friendly = typeof detail === "string" && detail.length < 200 ? detail : genericMsg;
      setErrorMsg(friendly);
      setPhase("error");
      toast.error("تعذّر إتمام التقييم", { description: friendly });
    }
  };

  const restart = () => {
    removeFile();
    const el = document.querySelector("#upload");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="upload" className="py-20 md:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">التقييم</p>
          <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A]">
            ابدأ التقييم
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            ارفع فيديو التمرين وستحصل على تقييم واضح وملاحظات تساعدك.
          </p>
        </div>

        {!backendReady && (
          <div className="max-w-2xl mx-auto mb-8 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <div className="shrink-0 h-9 w-9 rounded-lg bg-white flex items-center justify-center border border-amber-200">
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <p className="text-sm text-amber-800 leading-relaxed">
              الخدمة في وضع الاستعداد. قد يستغرق أول تقييم وقتاً أطول قليلاً.
            </p>
          </div>
        )}

        {/* Upload square */}
        {phase !== "result" && (
          <div className="raaya-fade-in">
            {!file ? (
              <div
                data-testid="upload-dropzone"
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`raaya-upload-zone ${drag ? "is-drag" : ""} rounded-[2rem] cursor-pointer text-center px-6 py-16 md:py-24 mx-auto max-w-2xl aspect-square flex flex-col items-center justify-center`}
              >
                <input
                  ref={inputRef}
                  data-testid="upload-input"
                  type="file"
                  accept={ACCEPT_ATTR}
                  className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])}
                />
                <div className="mb-6 h-24 w-24 md:h-28 md:w-28 rounded-full bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] flex items-center justify-center shadow-inner">
                  <UploadCloud size={44} className="text-[#0F4C81]" strokeWidth={2} />
                </div>
                <h3 className="ar-heading text-2xl md:text-3xl font-extrabold text-[#0F172A] mb-2">
                  ارفع فيديو التمرين
                </h3>
                <p className="text-slate-600 mb-1">اختر فيديو التمرين من جهازك</p>
                <p className="text-sm text-slate-500 mb-8">
                  الصيغ المدعومة: MP4, MOV, AVI
                </p>
                <button
                  data-testid="upload-choose-btn"
                  className="raaya-btn-primary rounded-full px-8 py-4 text-base font-bold inline-flex items-center gap-2"
                  onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                >
                  <UploadCloud size={18} /> اختيار الفيديو
                </button>
                <p className="mt-8 text-xs text-slate-500">أو اسحب الملف وأفلته هنا</p>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto raaya-card rounded-[2rem] p-6 md:p-8" data-testid="upload-preview">
                <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-video relative">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-5 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <Film size={20} className="text-[#0284C7]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#0F172A] truncate max-w-[240px] md:max-w-md" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    data-testid="upload-remove-btn"
                    disabled={phase === "processing"}
                    className="inline-flex items-center gap-2 text-slate-600 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                  >
                    <X size={18} /> إزالة
                  </button>
                </div>

                {phase === "idle" && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={analyze}
                      data-testid="analyze-btn"
                      className="raaya-btn-primary rounded-full px-10 py-4 text-lg font-bold inline-flex items-center gap-3"
                    >
                      <Play size={20} /> ابدأ التقييم
                    </button>
                  </div>
                )}

                {phase === "processing" && <ProcessingState msg={PROCESSING_MESSAGES[msgIdx]} />}

                {phase === "error" && (
                  <div className="mt-6 rounded-2xl bg-red-50 border border-red-200 p-5 text-center">
                    <p className="font-bold text-red-700 mb-1">تعذّر إتمام التحليل</p>
                    <p className="text-sm text-red-600 mb-4">{errorMsg}</p>
                    <button
                      onClick={analyze}
                      className="raaya-btn-primary rounded-full px-6 py-2.5 font-bold text-sm inline-flex items-center gap-2"
                    >
                      <RotateCcw size={16} /> أعد المحاولة
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {phase === "result" && result && (
          <Results result={result} onRestart={restart} />
        )}

        {phase !== "result" && <Disclaimer />}
      </div>
    </section>
  );
}

function ProcessingState({ msg }) {
  return (
    <div className="mt-8 text-center" data-testid="processing-state">
      <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-sky-50 flex items-center justify-center">
        <Loader2 size={30} className="text-[#0284C7] animate-spin" />
      </div>
      <p className="ar-heading text-xl font-bold text-[#0F4C81] mb-1">جاري تحليل التمرين...</p>
      <p className="text-slate-600" key={msg}>{msg}</p>
      <div className="mx-auto mt-6 h-2 max-w-md rounded-full bg-sky-100 overflow-hidden">
        <div className="h-full w-1/2 raaya-step-line animate-pulse" />
      </div>
    </div>
  );
}
function Disclaimer() {
  return (
    <div className="mt-10 max-w-3xl mx-auto rounded-2xl bg-white border border-sky-100 p-5 flex items-start gap-3 shadow-sm">
      <div className="shrink-0 h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
        <ShieldAlert size={18} className="text-[#0284C7]" />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">
        رعاية مصمم لدعم التمارين والتأهيل الحركي، ولا يُعد تشخيصًا طبيًا أو بديلًا عن توجيهات أخصائي العلاج الطبيعي.
      </p>
    </div>
  );
}

// ============= Results =============
function Results({ result, onRestart }) {
  const score = typeof result.quality_score === "number" ? Math.round(result.quality_score) : null;

  return (
    <div id="results" className="raaya-fade-in" data-testid="results-section">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-200 px-4 py-1.5 text-xs font-semibold text-[#0F4C81] mb-4 shadow-sm">
          <CheckCircle2 size={14} className="text-emerald-500" />
          تم إتمام التقييم
        </div>
        <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A]">
          نتيجة تمرينك
        </h2>
      </div>

      {/* Quality score — the main visual, alone */}
      <div className="max-w-xl mx-auto raaya-card rounded-3xl p-10 md:p-12 flex flex-col items-center justify-center text-center">
        <p className="ar-heading text-sm md:text-base font-bold tracking-widest text-sky-600 uppercase mb-8">
          جودة الحركة
        </p>
        <ScoreRing value={score ?? 0} available={score !== null} />
      </div>

      {/* Dynamic AI feedback from backend — single paragraph */}
      {result.feedback && <FeedbackCard text={result.feedback} />}

      {/* Subtle disclaimer */}
      <div className="mt-10 max-w-3xl mx-auto rounded-2xl bg-white border border-sky-100 p-4 flex items-start gap-3 shadow-sm">
        <div className="shrink-0 h-8 w-8 rounded-lg bg-sky-50 flex items-center justify-center">
          <ShieldAlert size={16} className="text-[#0284C7]" />
        </div>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
          رعاية مصمم لدعم التمارين والتأهيل الحركي، ولا يُعد تشخيصًا طبيًا أو بديلًا عن توجيهات أخصائي العلاج الطبيعي.
        </p>
      </div>

      <div className="mt-10 flex justify-center">
        <button
          onClick={onRestart}
          data-testid="restart-btn"
          className="raaya-btn-ghost rounded-full px-8 py-3 font-bold text-sm inline-flex items-center gap-2"
        >
          <RotateCcw size={16} /> ابدأ تقييماً جديداً
        </button>
      </div>
    </div>
  );
}

function ScoreRing({ value, available }) {
  const p = Math.max(0, Math.min(100, value));
  return (
    <div className="relative">
      <div
        className="raaya-score-ring h-56 w-56 md:h-72 md:w-72 rounded-full flex items-center justify-center"
        style={{ "--p": `${p}%` }}
      >
        <div className="h-[82%] w-[82%] rounded-full bg-white flex flex-col items-center justify-center shadow-inner">
          <span className="ar-heading text-6xl md:text-7xl font-extrabold text-[#0F4C81]" data-testid="score-value">
            {available ? p : "—"}
          </span>
          <span className="text-sm md:text-base text-slate-500 mt-1">من 100</span>
        </div>
      </div>
    </div>
  );
}

// ============= Dynamic feedback card (single paragraph from backend) =============
function FeedbackCard({ text }) {
  return (
    <section className="mt-14" id="coach">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-white border border-sky-200 px-4 py-1.5 text-xs font-semibold text-[#0F4C81] mb-3 shadow-sm">
          <Sparkles size={14} className="text-[#0EA5E9]" />
          ملاحظات مخصّصة لهذا التمرين
        </div>
        <h2 className="ar-heading text-2xl md:text-3xl font-extrabold text-[#0F172A]">ملاحظات رعاية</h2>
      </div>

      <div
        data-testid="feedback-card"
        className="max-w-3xl mx-auto raaya-card rounded-3xl overflow-hidden"
      >
        <div aria-hidden="true" className="h-1.5 w-full raaya-step-line opacity-80" />
        <div className="p-6 md:p-8 flex items-start gap-4">
          <div className="shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-br from-[#0F4C81] to-[#0EA5E9] flex items-center justify-center shadow-md">
            <Sparkles size={22} className="text-white" strokeWidth={2.2} />
          </div>
          <p className="text-slate-800 leading-loose text-base md:text-lg whitespace-pre-line ar-body">
            {text}
          </p>
        </div>
      </div>
    </section>
  );
}
