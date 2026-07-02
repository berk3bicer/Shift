import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import ProblemSolution from "@/components/ProblemSolution";
import Modules from "@/components/Modules";
import WhyShift from "@/components/WhyShift";
import Pricing from "@/components/Pricing";
import PilotCTA from "@/components/PilotCTA";
import Footer from "@/components/Footer";

// Tek sayfa landing — 7shifts www düzeni. Oturumsuz, statik/SSG.
// Bölüm ritmi: ink(hero) → paper(social+problem) → ink(modüller) → paper(neden) →
// ink(fiyat+pilot) → ink(footer) — koyu/açık alternasyon göz yormasın.
export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <SocialProof />
        <ProblemSolution />
        <Modules />
        <WhyShift />
        <Pricing />
        <PilotCTA />
        <Footer />
      </main>
    </>
  );
}
