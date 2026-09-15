import { HeartHandshake, Home as HomeIcon, ShieldCheck, Sparkles } from "lucide-react";

const PILLARS = [
  { icon: HomeIcon, title: "من منزلك", desc: "تجربة تأهيل هادئة تناسب روتينك اليومي." },
  { icon: HeartHandshake, title: "بلغة عربية دافئة", desc: "ملاحظات مبسّطة وسهلة الفهم." },
  { icon: ShieldCheck, title: "بخصوصية تامة", desc: "بياناتك لك، ولا نشاركها مع أي جهة." },
  { icon: Sparkles, title: "تجربة بسيطة", desc: "ارفع الفيديو واحصل على ملاحظاتك في دقائق." },
];

export default function About() {
  return (
    <section id="about" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">عن رعاية</p>
            <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A] mb-6 leading-tight">
              رفيقك الهادئ في <span className="raaya-gradient-text">رحلة التأهيل</span>
            </h2>
            <p className="text-lg text-slate-600 leading-loose mb-4">
              رعاية هو تطبيق يدعم التأهيل الحركي في المنزل، يساعدك على متابعة تمارينك اليومية ويقدّم لك ملاحظات مبسّطة تشجّعك على الاستمرار بثقة.
            </p>
            <p className="text-base text-slate-600 leading-loose">
              هدفنا أن تكون التجربة سهلة وواضحة لك ولعائلتك، بلغة عربية دافئة تُبعد التعقيد وتُقرّب الفائدة.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {PILLARS.map((p) => (
              <div key={p.title} className="raaya-card rounded-3xl p-6">
                <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] flex items-center justify-center">
                  <p.icon size={22} className="text-[#0F4C81]" />
                </div>
                <h3 className="ar-heading text-lg font-bold text-[#0F172A] mb-1">{p.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
