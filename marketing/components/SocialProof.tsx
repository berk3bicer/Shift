import { STATS } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Sosyal kanıt şeridi — metin tabanlı (SAHTE müşteri logosu YOK; gerçek müşteri henüz yok).
// İstatistikler spec'ten (8.2 / 1.2 / 1.4 / 0).
export default function SocialProof() {
  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)] py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal>
          <p className="text-center font-mono text-xs uppercase tracking-wider text-[var(--color-muted)]">
            Bağımsız kafelerin operasyon platformu
          </p>
        </Reveal>

        <RevealStagger className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <div className="font-display text-3xl font-bold text-[var(--color-ink)] sm:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">{s.label}</div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
