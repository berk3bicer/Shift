import { Scale, ShieldCheck, Zap, MessagesSquare, Check, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WHY_CARDS, COMPARISON } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";
import Scribble from "./Scribble";

// Neden Shift — spec 1.5 / 2.4. Tur 8 kuralı: rakip/marka ismi YOK; Shift'in çözümü pozitif
// ve kendinden emin anlatılır, matris kavramsal kategorilerle. Script vurgu: "bütününü".
const ICONS: Record<string, LucideIcon> = { Scale, ShieldCheck, MessagesSquare, Zap };

// Rozet renkleri — zengin sıcak palet: toprak / adaçayı / amber (tek-amber monotonluğu kırılır)
export const BADGE_STYLE: Record<string, string> = {
  "Türkiye'ye göre": "bg-[var(--color-terra-soft)] text-[var(--color-terra)]",
  "Tek çatı": "bg-[var(--color-sage-soft)] text-[var(--color-sage-deep)]",
  "Yerel kazanç": "bg-[var(--color-sage-soft)] text-[var(--color-sage-deep)]",
  default: "bg-[var(--color-signal)]/15 text-[var(--color-signal-deep)]",
};

function Cell({ value, isShift }: { value: string; isShift: boolean }) {
  if (value === "full") {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
          isShift ? "bg-[var(--color-barista)]/20 text-[var(--color-barista)]" : "bg-[var(--color-muted)]/15 text-[var(--color-ink)]"
        }`}
        title="Tam"
      >
        <Check size={14} strokeWidth={3} aria-label="Tam" />
      </span>
    );
  }
  if (value === "none") {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center text-[var(--color-muted)]/40" title="Yok">
        <Minus size={14} aria-label="Yok" />
      </span>
    );
  }
  // Serbest metin hücre: "kısmi", "temel", "Faz 2" gibi — Shift sütunundaki faz etiketi
  // amber tonda (yol haritası vurgusu), diğerleri nötr.
  if (value === "partial") {
    return <span className="text-xs font-medium text-[var(--color-muted)]" title="Kısmi">kısmi</span>;
  }
  return (
    <span
      className={`text-xs font-medium ${
        isShift ? "rounded-full bg-[var(--color-signal)]/15 px-2 py-0.5 font-bold text-[var(--color-signal-deep)]" : "text-[var(--color-muted)]"
      }`}
    >
      {value}
    </span>
  );
}

// Karşılaştırma matrisi — landing (sade COMPARISON) ve /neden-shift (COMPARISON_FULL)
// aynı bileşeni kullanır (Tur 7 yeniden kullanımı).
export function ComparisonTable({
  data,
}: {
  data: { competitors: string[]; rows: { feature: string; values: string[] }[]; footnote: string };
}) {
  return (
    <>
      <Reveal className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
          <thead>
            <tr>
              <th className="bg-[var(--color-paper)] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Özellik
              </th>
              {data.competitors.map((c, i) => (
                <th
                  key={c}
                  className={`px-4 py-4 text-center font-display text-sm font-semibold ${
                    i === 0 ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper)] text-[var(--color-muted)]"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.feature}>
                <td className="border-t border-[var(--color-line)] px-5 py-3 text-sm font-medium">{row.feature}</td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className={`border-t border-[var(--color-line)] px-4 py-3 text-center ${i === 0 ? "bg-[var(--color-ink)]/[0.03]" : ""}`}
                  >
                    <Cell value={v} isShift={i === 0} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      <p className="mt-3 text-xs text-[var(--color-muted)]">{data.footnote}</p>
    </>
  );
}

export default function WhyShift() {
  return (
    <section id="neden" className="bg-[var(--color-paper)] py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-sage-deep)]">
            Neden Shift
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Çoğu araç bir parçayı çözer.{" "}
            <span className="relative inline-block whitespace-nowrap">
              Shift, <span className="font-script font-bold text-[var(--color-signal-deep)]">bütününü</span>
              <Scribble shape="underline" className="absolute -bottom-1.5 left-0 w-full" delay={0.4} />
            </span>
            .
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-muted)]">
            Ya sadece vardiya, ya sadece satış. Shift ikisinin arasında kalan her şeyi tek çatıda
            toplar: vardiyadan stoğa, mesaiden hijyene — ve bunu Türkiye&apos;ye göre yapar. İş Kanunu,
            KVKK, kafe dili. Sonradan çeviri değil, baştan böyle kurgulandı.
          </p>
        </Reveal>

        {/* Farklılaştırıcı kartlar */}
        <RevealStagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CARDS.map((c) => {
            const Icon = ICONS[c.icon] ?? Scale;
            return (
              <RevealItem key={c.title}>
                <div className="group flex h-full flex-col rounded-3xl border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-paper)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/50">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-signal-deep)]">
                      <Icon size={20} />
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLE[c.badge] ?? BADGE_STYLE.default}`}>
                      {c.badge}
                    </span>
                  </div>
                  <h3 className="font-display mt-4 text-base font-bold text-[var(--color-ink)]">{c.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{c.detail}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealStagger>

        {/* Karşılaştırma matrisi — /neden-shift'te genişletilmiş hali (COMPARISON_FULL) kullanılır */}
        <div className="mt-10">
          <ComparisonTable data={COMPARISON} />
        </div>
      </div>
    </section>
  );
}
