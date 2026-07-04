import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import ProblemSolution from "@/components/ProblemSolution";
import Modules from "@/components/Modules";
import WhyShift from "@/components/WhyShift";
import Pricing from "@/components/Pricing";
import PilotCTA from "@/components/PilotCTA";

// Ana sayfa landing — klasik SaaS www düzeni. Oturumsuz, statik/SSG.
// Tur 7: Nav + Footer layout'a taşındı; derin sayfalara (moduller/, neden-shift…) nav'dan gidilir.
// Bölüm ritmi KORUNDU: hero(paper) → social(surface) → problem(paper) → modüller(paper-deep)
// → neden(paper) → fiyat(paper) → SADECE kapanış CTA + footer koyu (tek sıcak vurgu bölgesi).
export default function Home() {
  return (
    <main>
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <Modules />
      <WhyShift />
      <Pricing />
      <PilotCTA />
    </main>
  );
}
