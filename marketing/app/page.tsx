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
// Tur 4 ritmi AYDINLIK: hero(paper) → social(surface) → problem(paper) → modüller(paper-deep)
// → neden(paper) → fiyat(paper) → SADECE kapanış CTA + footer koyu (tek sıcak vurgu bölgesi).
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
