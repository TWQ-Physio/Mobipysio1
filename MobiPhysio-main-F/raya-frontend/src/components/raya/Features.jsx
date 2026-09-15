import { Video, Target, Gauge, Sparkles } from "lucide-react";

const FEATURES = [
  {
    icon: Video,
    title: "تحليل التمرين",
    desc: "نحلل فيديو التمرين بدقة لفهم حركتك.",
  },
  {
    icon: Target,
    title: "تحديد التمرين",
    desc: "نتعرّف على نوع التمرين الذي تم أداؤه.",
  },
  {
    icon: Gauge,
    title: "تقييم جودة الحركة",
    desc: "نقدم درجة تقديرية لجودة أدائك في التمرين.",
  },
  {
    icon: Sparkles,
    title: "ملاحظات ذكية",
    desc: "نحوّل نتائج التحليل إلى ملاحظات واضحة وسهلة الفهم.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">ماذا نقدم</p>
          <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A]">
            ماذا تقدم رعاية؟
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              data-testid={`feature-${i}`}
              className="raaya-card rounded-3xl p-7 group"
            >
              <div className="mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0F4C81] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-sky-200/50 group-hover:scale-105 transition-transform">
                <f.icon size={26} className="text-white" strokeWidth={2.2} />
              </div>
              <h3 className="ar-heading text-xl font-bold text-[#0F172A] mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
