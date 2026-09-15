import { Brain, MessageCircleHeart, Home } from "lucide-react";

const POINTS = [
  { icon: Brain, title: "تحليل ذكي للحركة", desc: "نفهم حركتك ونقيّم أداءك بدقة." },
  { icon: MessageCircleHeart, title: "ملاحظات واضحة", desc: "لغة بسيطة وودّية بدون تعقيد." },
  { icon: Home, title: "تجربة سهلة من المنزل", desc: "كل ما تحتاج هو فيديو قصير للتمرين." },
];

export default function TrustIntro() {
  return (
    <section className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">مقدمة رعاية</p>
          <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A] mb-5">
            رعاية... لأن الحركة جزء من حياتك
          </h2>
          <p className="text-lg text-slate-600 leading-loose">
            نقدم تجربة بسيطة لدعم التأهيل الحركي في المنزل، تجمع بين تحليل دقيق لحركتك وملاحظات واضحة تساعدك على فهم أدائك بشكل أوضح.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {POINTS.map((p, i) => (
            <div
              key={p.title}
              data-testid={`trust-point-${i}`}
              className="raaya-card rounded-3xl p-8 text-center"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] flex items-center justify-center">
                <p.icon size={28} className="text-[#0F4C81]" strokeWidth={2.2} />
              </div>
              <h3 className="ar-heading text-xl font-bold text-[#0F172A] mb-2">{p.title}</h3>
              <p className="text-slate-600">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
