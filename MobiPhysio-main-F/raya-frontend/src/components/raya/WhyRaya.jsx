import { Home, Sparkles, Cpu, UserCheck } from "lucide-react";

const BENEFITS = [
  { icon: Home, title: "من منزلك", desc: "تجربة تأهيل سهلة من المنزل." },
  { icon: Sparkles, title: "بسيطة وواضحة", desc: "ملاحظات مفهومة دون تعقيد." },
  { icon: Cpu, title: "دقيقة وموثوقة", desc: "تحليل مدروس لأداء تمرينك." },
  { icon: UserCheck, title: "مصممة لتناسبك", desc: "واجهة بسيطة ومريحة وسهلة الاستخدام." },
];

export default function WhyRaya() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">لماذا رعاية</p>
          <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A]">
            لماذا رعاية؟
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {BENEFITS.map((b, i) => (
            <div key={b.title} data-testid={`benefit-${i}`} className="raaya-card rounded-3xl p-7">
              <div className="mb-5 h-14 w-14 rounded-2xl bg-white border border-sky-100 flex items-center justify-center shadow-sm">
                <b.icon size={24} className="text-[#0284C7]" strokeWidth={2.2} />
              </div>
              <h3 className="ar-heading text-xl font-bold text-[#0F172A] mb-2">{b.title}</h3>
              <p className="text-slate-600">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
