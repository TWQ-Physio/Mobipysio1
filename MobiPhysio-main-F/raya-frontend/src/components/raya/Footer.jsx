import { ShieldAlert } from "lucide-react";

const NAV = [
  { label: "الرئيسية", href: "#hero" },
  { label: "كيف تعمل رعاية", href: "#how" },
  { label: "التقييم", href: "#upload" },
  { label: "عن رعاية", href: "#about" },
];

const TEAM = ["وسن الجهني", "غلا الأحمري", "نوره الدخيل"];

export default function Footer() {
  const scrollTo = (href) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="border-t border-[#DCE7F1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src="/logo.png" alt="رعاية" className="h-14 w-14 object-contain" />
              <div>
                <p className="ar-heading text-2xl font-extrabold text-[#0F4C81]">رعاية</p>
                <p className="text-xs tracking-widest text-sky-600 uppercase">Ra&apos;aya</p>
              </div>
            </div>
            <p className="text-slate-600 leading-loose max-w-md">
              مدربك الذكي للتأهيل الحركي — تجربة عربية بسيطة لدعم التمارين في المنزل بذكاء ودفء.
            </p>
          </div>

          {/* Nav */}
          <div>
            <p className="ar-heading text-sm font-bold text-[#0F172A] mb-4">روابط</p>
            <ul className="space-y-2">
              {NAV.map((n) => (
                <li key={n.href}>
                  <button
                    onClick={() => scrollTo(n.href)}
                    className="text-slate-600 hover:text-[#0F4C81] transition"
                  >
                    {n.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Team */}
          <div>
            <p className="ar-heading text-sm font-bold text-[#0F172A] mb-4">فريق رعاية</p>
            <ul className="space-y-2 text-slate-600">
              {TEAM.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 rounded-2xl bg-white border border-sky-100 p-5 flex items-start gap-3 shadow-sm">
          <div className="shrink-0 h-9 w-9 rounded-lg bg-sky-50 flex items-center justify-center">
            <ShieldAlert size={18} className="text-[#0284C7]" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            رعاية مصمم لدعم التمارين والتأهيل الحركي، ولا يُعد تشخيصًا طبيًا أو بديلًا عن توجيهات أخصائي العلاج الطبيعي.
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-sky-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <p>© {new Date().getFullYear()} رعاية — جميع الحقوق محفوظة.</p>
          <p className="tracking-widest">RA&apos;AYA · PHYSICAL THERAPY</p>
        </div>
      </div>
    </footer>
  );
}
