import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import ProblemSolution from "@/components/ProblemSolution";
import Modules from "@/components/Modules";
import FlipShowcase from "@/components/FlipShowcase";
import WhyShift from "@/components/WhyShift";
import Pricing from "@/components/Pricing";
import PilotCTA from "@/components/PilotCTA";

// Ana sayfa landing — klasik SaaS www düzeni. Oturumsuz, statik/SSG.
// Tur 7: Nav + Footer layout'a taşındı; derin sayfalara (moduller/, neden-shift…) nav'dan gidilir.
// Bölüm ritmi (Tur "Sıcak Kahve"): hero(paper) → social(ESPRESSO — erken koyu çapa)
// → problem(paper) → modüller(paper-deep) → KANIT/flip(surface, Tur 17: gerçek panel
// ekranları) → neden(paper) → fiyat(paper) → kapanış CTA + footer koyu.
// Yani sayfada İKİ koyu bölge var: hero altındaki kompakt şerit ve kapanış bandı —
// aradaki açık bölümler kahve tonlu kart gradyanlarıyla (card-warm) ısıtılır.
export default function Home() {
  return (
    <main>
      <Hero />
      <SocialProof />
      <ProblemSolution />
      <Modules />
      <FlipShowcase />
      <WhyShift />
      <Pricing />
      <PilotCTA />
    </main>
  );
}
