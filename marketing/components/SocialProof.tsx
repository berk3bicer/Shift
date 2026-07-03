import { Scale, ShieldCheck, MessagesSquare, Clock } from "lucide-react";
import { STATS } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Sosyal kanıt şeridi — hero'nun HEMEN altında, GÖRÜNÜR. Metin tabanlı (SAHTE logo YOK).
// Üstte uyum rozetleri (İş Kanunu · KVKK · Türkçe · 10 dk), altında spec istatistikleri.
const TRUST_CHIPS = [
  { icon: Scale, label: "İş Kanunu uyumlu" },
  { icon: ShieldCheck, label: "KVKK uyumlu" },
  { icon: MessagesSquare, label: "Türkçe destek" },
  { icon: Clock, label: "10 dakikada kurulum" },
];

export default function SocialProof() {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)] py-14">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-4">
          {TRUST_CHIPS.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-cream)]/60 px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
            >
              <Icon size={16} className="text-[var(--color-signal-deep)]" />
              {label}
            </span>
          ))}
        </Reveal>

        <RevealStagger className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-[var(--color-signal-deep)] sm:text-[2.75rem]">
                {s.value}
              </div>
              <div className="mt-1.5 text-sm font-medium text-[var(--color-muted)]">{s.label}</div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
