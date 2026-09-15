import Navbar from "@/components/raya/Navbar";
import Hero from "@/components/raya/Hero";
import Features from "@/components/raya/Features";
import HowItWorks from "@/components/raya/HowItWorks";
import UploadFlow from "@/components/raya/UploadFlow";
import About from "@/components/raya/About";
import Team from "@/components/raya/Team";
import Footer from "@/components/raya/Footer";

export default function Landing() {
  return (
    <main dir="rtl" className="min-h-screen text-slate-900 ar-body">
      <Navbar />
      <Hero />
      <About />
      <Features />
      <HowItWorks />
      <UploadFlow />
      <Team />
      <Footer />
    </main>
  );
}
