import { Upload, ScanSearch, ClipboardList } from "lucide-react";

const STEPS = [
  { n: "01", icon: Upload, title: "ارفع الفيديو", desc: "صوّر تمرينك وارفع الفيديو من جهازك ببساطة." },
  { n: "02", icon: ScanSearch, title: "تحلّل رعاية الحركة", desc: "نُحلّل الفيديو لتحديد نوع التمرين وتقييم جودة أدائك." },
  { n: "03", icon: ClipboardList, title: "تحصل على تقييم ونصائح", desc: "تعرّض النتيجة مع ملاحظات واضحة لتحسين تمرينك القادم." },
];

export default function HowItWorks() {
  return (
    <section id="how" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">رحلة رعاية</p>
          <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A]">
            كيف تعمل رعاية؟
          </h2>
          <p className="mt-4 text-lg text-slate-600">ثلاث خطوات بسيطة، من الفيديو إلى ملاحظاتك.</p>
        </div>

        {/* Desktop timeline */}
        <div className="hidden md:block relative">
          <div className="absolute top-[74px] right-[14%] left-[14%] h-1 rounded-full raaya-step-line opacity-70" />
          <div className="grid grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <div key={s.n} data-testid={`step-${i}`} className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="h-[148px] w-[148px] rounded-full bg-white border-2 border-sky-100 shadow-lg flex items-center justify-center">
                    <div className="h-[110px] w-[110px] rounded-full bg-gradient-to-br from-[#0F4C81] to-[#0EA5E9] flex items-center justify-center">
                      <s.icon size={38} className="text-white" strokeWidth={2.1} />
                    </div>
                  </div>
                  <span className="absolute -bottom-2 right-1/2 translate-x-1/2 bg-white border-2 border-[#0284C7] rounded-full px-3 py-0.5 text-sm font-extrabold text-[#0F4C81]">
                    {s.n}
                  </span>
                </div>
                <h3 className="ar-heading text-xl font-bold text-[#0F172A] mb-2">{s.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-xs">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile timeline */}
        <div className="md:hidden relative">
          <div className="absolute top-0 bottom-0 right-8 w-1 rounded-full raaya-step-line opacity-70" />
          <div className="space-y-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative pr-20">
                <div className="absolute right-0 top-0 h-16 w-16 rounded-full bg-white border-2 border-sky-100 shadow-md flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0F4C81] to-[#0EA5E9] flex items-center justify-center">
                    <s.icon size={20} className="text-white" />
                  </div>
                </div>
                <div className="raaya-card rounded-2xl p-5">
                  <p className="text-xs font-bold text-sky-600 mb-1">الخطوة {s.n}</p>
                  <h3 className="ar-heading text-lg font-bold text-[#0F172A] mb-1">{s.title}</h3>
                  <p className="text-slate-600 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
