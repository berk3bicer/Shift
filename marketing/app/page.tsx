import Hero from "@/components/Hero";
import ProblemSolution from "@/components/ProblemSolution";
import Modules from "@/components/Modules";
import WhyShift from "@/components/WhyShift";
import Pricing from "@/components/Pricing";
import PilotCTA from "@/components/PilotCTA";
import Footer from "@/components/Footer";

// Tek sayfa landing — 7shifts www karşılığı. Oturumsuz, statik/SSG, herkese açık.
export default function Home() {
  return (
    <main>
      <Hero />
      <ProblemSolution />
      <Modules />
      <WhyShift />
      <Pricing />
      <PilotCTA />
      <Footer />
    </main>
  );
}
