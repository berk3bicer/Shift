import { CalendarDays, KanbanSquare, Clock, ArrowRightLeft, Megaphone, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CORE_MODULES, MORE_MODULES } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Modüller — çekirdek 5 (spec 12.1 "derinlik > genişlik"). AYDINLIK zemin, beyaz kartlar.
// Her kart: renkli lucide ikon + başlık + fayda + mini nokta listesi. Hover'da amber border + kalkış.
const ICONS: Record<string, LucideIcon> = {
  CalendarDays,
  KanbanSquare,
  Clock,
  ArrowRightLeft,
  Megaphone,
};
const ACCENT: Record<string, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};

export default function Modules() {
  return (
    <section id="moduller" className="bg-[var(--color-paper-deep)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">
            Çekirdek modüller
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Genişlik değil, derinlik.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            Önce çekirdeği kusursuz yapıyoruz: vardiya, görev, giriş-çıkış, checklist ve iletişim.
            Kafeye ilk günden değer katan beş modül.
          </p>
        </Reveal>

        <RevealStagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_MODULES.map((m) => {
            const Icon = ICONS[m.icon] ?? CalendarDays;
            return (
              <RevealItem key={m.key}>
                <article
                  className="group relative flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/60"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${ACCENT[m.accent]} 14%, white)`, color: ACCENT[m.accent] }}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">{m.title}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-[var(--color-muted)]">{m.benefit}</p>

                  <ul className="mt-4 space-y-2 border-t border-[var(--color-line)] pt-4">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ACCENT[m.accent] }} />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <ArrowUpRight
                    size={18}
                    className="absolute right-5 top-6 text-[var(--color-line-strong)] transition-colors group-hover:text-[var(--color-signal)]"
                    aria-hidden="true"
                  />
                </article>
              </RevealItem>
            );
          })}

          {/* "ve dahası" kartı */}
          <RevealItem>
            <article className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]/40 p-6">
              <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">ve dahası…</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {MORE_MODULES.map((m) => (
                  <li key={m} className="rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[var(--color-muted)]">Stok, tedarik ve hijyen sonraki fazlarda.</p>
            </article>
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}
