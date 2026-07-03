import { Scale, ShieldCheck, Boxes, MessagesSquare, Check, Minus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WHY_CARDS, COMPARISON } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Neden Shift — spec 1.5 / 2.4. TR kazanan kartları öne çıkan görsel kartlar (düz tablo DEĞİL),
// altında sadeleştirilmiş rakip matrisi. "7shifts'te yok" vurgusu.
const ICONS: Record<string, LucideIcon> = { Scale, ShieldCheck, Boxes, MessagesSquare };

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
  if (value === "partial") {
    return <span className="text-xs font-medium text-[var(--color-muted)]" title="Kısmi">kısmi</span>;
  }
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center text-[var(--color-muted)]/40" title="Yok">
      <Minus size={14} aria-label="Yok" />
    </span>
  );
}

export default function WhyShift() {
  return (
    <section id="neden" className="bg-[var(--color-paper)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">
            Neden Shift
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
            7shifts&apos;in bıraktığı yerde, Türkiye&apos;ye göre.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            7shifts vardiyada güçlü ama stok, tedarik ve hijyene hiç girmez; İş Kanunu ve KVKK&apos;yı
            bilmez. Yerli POS sistemleri ise yalnız satışı çözer.
          </p>
        </Reveal>

        {/* Farklılaştırıcı kartlar */}
        <RevealStagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_CARDS.map((c) => {
            const Icon = ICONS[c.icon] ?? Scale;
            return (
              <RevealItem key={c.title}>
                <div className="group flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/50">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[var(--color-signal)]">
                      <Icon size={20} />
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        c.badge === "Yerel kazanç"
                          ? "bg-[var(--color-barista)]/15 text-[var(--color-barista)]"
                          : "bg-[var(--color-signal)]/15 text-[var(--color-signal-deep)]"
                      }`}
                    >
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

        {/* Karşılaştırma matrisi */}
        <Reveal className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
            <thead>
              <tr>
                <th className="bg-[var(--color-paper)] px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
                  Özellik
                </th>
                {COMPARISON.competitors.map((c, i) => (
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
              {COMPARISON.rows.map((row) => (
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
        <p className="mt-3 text-xs text-[var(--color-muted)]">{COMPARISON.footnote}</p>
      </div>
    </section>
  );
}
