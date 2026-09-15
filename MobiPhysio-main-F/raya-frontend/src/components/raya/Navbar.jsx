import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const NAV = [
  { label: "الرئيسية", href: "#hero" },
  { label: "عن رعاية", href: "#about" },
  { label: "كيف تعمل؟", href: "#how" },
  { label: "مميزاتنا", href: "#features" },
  { label: "فريقنا", href: "#team" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (href) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header
      data-testid="site-navbar"
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#F1F5FA]/95 backdrop-blur-md shadow-sm border-b border-[#DCE7F1]"
          : "bg-[#F1F5FA]/80 backdrop-blur"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-3 items-center h-24 md:h-28">
          {/* Logo — right in RTL */}
          <a href="#hero" data-testid="nav-logo" className="flex items-center gap-3 shrink-0 justify-self-start">
            <img
              src="/logo.png"
              alt="رعاية"
              className="h-20 md:h-24 w-auto object-contain drop-shadow-sm"
            />
          </a>

          {/* Desktop nav — centered */}
          <nav className="hidden md:flex items-center gap-8 justify-self-center">
            {NAV.map((n) => (
              <button
                key={n.href}
                onClick={() => scrollTo(n.href)}
                data-testid={`nav-${n.href.replace("#", "")}`}
                className="text-slate-700 hover:text-[#0F4C81] font-semibold text-[15px] transition-colors relative group whitespace-nowrap"
              >
                {n.label}
                <span className="absolute -bottom-1 right-0 h-0.5 w-0 bg-[#0EA5E9] group-hover:w-full transition-all" />
              </button>
            ))}
          </nav>

          {/* Mobile toggle only — no CTA */}
          <div className="flex items-center justify-end gap-3 justify-self-end">
            <button
              onClick={() => setOpen((v) => !v)}
              data-testid="nav-mobile-toggle"
              className="md:hidden p-2 rounded-lg text-[#0F4C81] hover:bg-white/60"
              aria-label="menu"
            >
              {open ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-[#DCE7F1] raaya-fade-in">
            <div className="flex flex-col gap-1 pt-3">
              {NAV.map((n) => (
                <button
                  key={n.href}
                  onClick={() => scrollTo(n.href)}
                  className="text-right px-3 py-3 rounded-lg text-slate-700 hover:bg-white hover:text-[#0F4C81] font-semibold"
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
