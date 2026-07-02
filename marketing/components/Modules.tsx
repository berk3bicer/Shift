import { CalendarDays, KanbanSquare, Clock, ListChecks, Megaphone, ArrowUpRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CORE_MODULES, MORE_MODULES } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Modüller — çekirdek 5 (spec 12.1 "derinlik > genişlik"). Her kart: lucide ikon + başlık +
// fayda + mini nokta listesi. Hover'da border amber'a döner, kart hafif kalkar.
const ICONS: Record<string, LucideIcon> = {
  CalendarDays,
  KanbanSquare,
  Clock,
  ListChecks,
  Megaphone,
};
const ACCENT: Record<string, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};

export default function Modules() {
  return (
    <section id="moduller" className="relative overflow-hidden bg-[var(--color-ink)] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-signal)]">
            Çekirdek modüller
          </span>
          <h2 className="font-display mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            Genişlik değil, derinlik.
          </h2>
          <p className="mt-4 text-lg text-white/60">
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
                  className="group relative flex h-full flex-col rounded-2xl border border-[var(--color-ink-line)] bg-[var(--color-ink-soft)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/50 hover:bg-[var(--color-ink-softer)]"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${ACCENT[m.accent]} 18%, transparent)`, color: ACCENT[m.accent] }}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="font-display text-lg font-semibold text-white">{m.title}</h3>
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-white/70">{m.benefit}</p>

                  <ul className="mt-4 space-y-2 border-t border-white/5 pt-4">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-white/55">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ACCENT[m.accent] }} />
                        {p}
                      </li>
                    ))}
                  </ul>

                  <ArrowUpRight
                    size={18}
                    className="absolute right-5 top-6 text-white/0 transition-colors group-hover:text-[var(--color-signal)]"
                    aria-hidden="true"
                  />
                </article>
              </RevealItem>
            );
          })}

          {/* "ve dahası" kartı */}
          <RevealItem>
            <article className="flex h-full flex-col justify-center rounded-2xl border border-dashed border-[var(--color-ink-line)] p-6">
              <h3 className="font-display text-lg font-semibold text-white/80">ve dahası…</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {MORE_MODULES.map((m) => (
                  <li key={m} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
                    {m}
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-mono text-xs text-white/35">Stok, tedarik ve hijyen sonraki fazlarda.</p>
            </article>
          </RevealItem>
        </RevealStagger>
      </div>
    </section>
  );
}
