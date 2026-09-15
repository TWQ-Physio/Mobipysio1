import { Linkedin } from "lucide-react";

const MEMBERS = [
  {
    ar: "وسن الجهني",
    en: "Wasan Aljohani",
    initial: "و",
    linkedin:
      "https://www.linkedin.com/in/wasan-aljohani-333049245?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
  },
  {
    ar: "غلا الأحمري",
    en: "Ghala Alahmari",
    initial: "غ",
    linkedin:
      "https://www.linkedin.com/in/ghala-alahmari?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app",
  },
  {
    ar: "نوره الدخيل",
    en: "Noura Aldakhil",
    initial: "ن",
    linkedin: "https://transcendent-hotteok-0d4f0a.netlify.app/",
  },
];

export default function Team() {
  return (
    <section id="team" className="py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold tracking-widest text-sky-600 uppercase mb-3">فريق العمل</p>
          <h2 className="ar-heading text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#0F172A]">
            فريق رعاية
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {MEMBERS.map((m, i) => (
            <div key={m.ar} data-testid={`team-${i}`} className="raaya-card rounded-3xl p-8 text-center">
              <div className="mx-auto mb-5 h-24 w-24 rounded-full bg-gradient-to-br from-[#0F4C81] to-[#0EA5E9] flex items-center justify-center shadow-lg shadow-sky-200/60">
                <span className="ar-heading text-4xl font-extrabold text-white">{m.initial}</span>
              </div>
              <h3 className="ar-heading text-2xl font-extrabold text-[#0F172A] mb-1">{m.ar}</h3>
              <p className="text-sm text-slate-500 tracking-wide">{m.en}</p>

              <a
                href={m.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                data-testid={`team-${i}-linkedin`}
                aria-label={`ملف ${m.ar} على LinkedIn`}
                className="mt-4 inline-flex items-center justify-center h-10 w-10 rounded-full bg-white border border-sky-100 text-[#0A66C2] hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-colors shadow-sm"
              >
                <Linkedin size={18} strokeWidth={2.2} />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
