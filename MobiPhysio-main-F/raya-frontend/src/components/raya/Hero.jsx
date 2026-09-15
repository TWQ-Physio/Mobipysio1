import { ShieldCheck, HeartPulse, CheckCircle2, ArrowLeft } from "lucide-react";

// Real physiotherapy scene — male therapist actively guiding a male patient.
const PHYSIO_PHOTO =
  "https://images.pexels.com/photos/20860594/pexels-photo-20860594.jpeg?auto=compress&cs=tinysrgb&w=1600";

const TRUST_POINTS = [
  "من داخل المنزل",
  "بلغة عربية دافئة",
  "دون تخزين للفيديو",
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-[#F1F5FA]"
    >
      {/* Soft depth — no floating shapes */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 55% at 25% 35%, rgba(255,255,255,0.85) 0%, rgba(241,245,250,0) 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
        style={{
          background:
            "linear-gradient(180deg, rgba(241,245,250,0) 0%, #F1F5FA 100%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24 md:pt-24 md:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text — RIGHT (first in RTL) */}
          <div className="lg:col-span-7 raaya-fade-in text-center lg:text-right">
            {/* Elegant eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#DCE7F1] px-4 py-1.5 text-xs md:text-sm font-semibold text-[#0F4C81] mb-7 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9]" />
              رعاية · للتأهيل الحركي
            </div>

            {/* Big headline */}
            <h1 className="ar-heading text-[2.5rem] leading-[1.1] sm:text-5xl lg:text-[5.25rem] lg:leading-[1.05] font-extrabold text-[#0A2540] mb-6 tracking-tight">
              حركتك تبدأ
              <span className="block raaya-gradient-text">من هنا</span>
            </h1>

            {/* Sub-identity */}
            <p className="ar-heading text-lg md:text-xl font-semibold text-[#1A609E] mb-5">
              مدربك الذكي للتأهيل الحركي
            </p>

            {/* Elegant divider (single, intentional) */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-7" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9]" />
              <span className="h-px w-24 bg-[#0F4C81]/40" />
            </div>

            <p className="text-lg md:text-xl text-slate-700 leading-loose max-w-2xl mx-auto lg:mx-0 mb-9">
              رعاية يساعدك على متابعة تمارين التأهيل الحركي من منزلك، من خلال تحليل فيديو التمرين وتقديم ملاحظات واضحة تساعدك على أداء التمرين بثقة.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mb-10">
              <button
                data-testid="hero-cta-start"
                onClick={() => {
                  const el = document.querySelector("#upload");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="raaya-btn-primary rounded-full px-9 py-4 text-base md:text-lg font-bold inline-flex items-center gap-3"
              >
                ابدأ الآن
                <ArrowLeft size={18} />
              </button>
              <button
                data-testid="hero-cta-about"
                onClick={() => {
                  const el = document.querySelector("#about");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="raaya-btn-ghost rounded-full px-9 py-4 text-base md:text-lg font-bold inline-flex items-center gap-2"
              >
                عن رعاية
              </button>
            </div>

            {/* Trust bar */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-sm text-slate-600">
              {TRUST_POINTS.map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#0284C7]" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Visual — LEFT */}
          <div
            className="lg:col-span-5 raaya-fade-in"
            style={{ animationDelay: "120ms" }}
          >
            <PhysioVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function PhysioVisual() {
  return (
    <div className="relative w-full max-w-xl mx-auto">
      {/* Subtle blue back-panel */}
      <div
        aria-hidden="true"
        className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-[#DDEBF6] to-[#EAF3FA]"
        style={{ transform: "rotate(-2deg)" }}
      />
      {/* Photo card */}
      <div className="relative rounded-[2rem] overflow-hidden bg-white shadow-[0_30px_70px_-24px_rgba(10,37,64,0.35)] border border-[#DCE7F1]">
        <div className="aspect-[4/5] w-full">
          <img
            src={PHYSIO_PHOTO}
            alt="جلسة علاج طبيعي — أخصائي يوجّه المريض خلال تمرين تأهيل"
            className="w-full h-full object-cover"
            draggable="false"
          />
        </div>
        {/* Bottom soft fade */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 100%)",
          }}
        />
      </div>

      {/* One tasteful stat pill anchored at the bottom-right corner of the image */}
      <div
        className="absolute -bottom-5 right-4 md:right-6 rounded-2xl bg-white/95 backdrop-blur border border-[#DCE7F1] shadow-lg px-4 py-3 flex items-center gap-3"
        data-testid="hero-stat"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#0F4C81] to-[#0EA5E9] flex items-center justify-center">
          <HeartPulse size={18} className="text-white" strokeWidth={2.3} />
        </div>
        <div className="text-right leading-tight">
          <p className="ar-heading text-xs font-bold text-slate-500 mb-0.5">تجربة داعمة</p>
          <p className="ar-heading text-sm font-extrabold text-[#0A2540]">تأهيل حركي من المنزل</p>
        </div>
      </div>

      {/* One tasteful trust pill anchored at top-left */}
      <div
        className="absolute -top-4 left-4 md:left-6 rounded-full bg-white/95 backdrop-blur border border-[#DCE7F1] shadow-md px-4 py-2 inline-flex items-center gap-2"
        data-testid="hero-privacy-pill"
      >
        <ShieldCheck size={14} className="text-[#0284C7]" />
        <span className="ar-heading text-xs font-bold text-[#0A2540]">خصوصية كاملة</span>
      </div>
    </div>
  );
}
