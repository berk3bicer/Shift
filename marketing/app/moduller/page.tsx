import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  Clock,
  KanbanSquare,
  Package,
  SprayCan,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MODULE_PAGES, ROADMAP_MODULES } from "@/lib/modules";
import Reveal, { RevealStagger, RevealItem } from "@/components/Reveal";
import CtaBand from "@/components/CtaBand";

// /moduller — tüm modüllerin özeti (Tur 7). Detay sayfası olan 6 modül büyük kart + link;
// geri kalanı (spec Modül 7–11) "yol haritası" şeridinde faz etiketiyle, LİNKSİZ (dürüstlük:
// sayfası olmayan modüle link verilmez, olmayan modül "var" gibi sunulmaz).

export const metadata: Metadata = {
  title: "Modüller — Shift",
  description:
    "Vardiya, görev, giriş-çıkış, vardiya havuzu bugün; stok, tedarik ve hijyen yol haritasında. Shift'in tüm modülleri tek sayfada.",
};

const ICONS: Record<string, LucideIcon> = {
  CalendarDays,
  KanbanSquare,
  Clock,
  ArrowRightLeft,
  Package,
  SprayCan,
};

const ACCENT: Record<string, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};

export default function ModulesIndexPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--color-paper)] pb-14 pt-28 lg:pt-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-8%] h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <span className="anim-rise inline-block text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]" style={{ animationDelay: "40ms" }}>
            Modüller
          </span>
          <h1 className="anim-rise font-display mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink)] sm:text-5xl" style={{ animationDelay: "120ms" }}>
            Operasyonun her parçası için bir modül.
          </h1>
          <p className="anim-rise mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]" style={{ animationDelay: "200ms" }}>
            Önce çekirdek: vardiya, görev, giriş-çıkış ve havuz bugün hazır. Stok, tedarik ve hijyen
            yol haritasında — hangi modülün ne zaman geleceğini açıkça söylüyoruz.
          </p>
        </div>
      </section>

      {/* Detay sayfalı 6 modül */}
      <section className="bg-[var(--color-paper)] pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <RevealStagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger={0.08}>
            {MODULE_PAGES.map((m) => {
              const Icon = ICONS[m.icon] ?? CalendarDays;
              const accent = ACCENT[m.accent];
              return (
                <RevealItem key={m.slug}>
                  <Link
                    href={`/moduller/${m.slug}`}
                    className="group flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/60"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, white)`, color: accent }}
                      >
                        <Icon size={20} />
                      </span>
                      {m.phase && (
                        <span className="rounded-full bg-[var(--color-signal)]/15 px-2.5 py-1 text-[10px] font-bold text-[var(--color-signal-deep)]">
                          {m.phase}
                        </span>
                      )}
                    </div>
                    <h2 className="font-display mt-4 text-lg font-bold text-[var(--color-ink)]">{m.name}</h2>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-[var(--color-muted)]">{m.headline} {m.short}.</p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-signal-deep)] transition-colors group-hover:text-[var(--color-ink)]">
                      İncele <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </RevealItem>
              );
            })}
          </RevealStagger>

          {/* Yol haritası şeridi — sayfası olmayan modüller, faz etiketiyle */}
          <Reveal className="mt-16">
            <h2 className="font-display text-xl font-extrabold text-[var(--color-ink)]">…ve yol haritasındakiler</h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
              Spesifikasyonda 11 modül var; hepsini aynı anda değil, fazlara yayarak inşa ediyoruz —
              derinlik genişlikten önce gelir.
            </p>
          </Reveal>
          <RevealStagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {ROADMAP_MODULES.map((m) => (
              <RevealItem key={m.name}>
                <article className="flex h-full flex-col rounded-2xl border border-dashed border-[var(--color-line-strong)] bg-[var(--color-cream)]/40 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)]">{m.name}</h3>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                        m.tag === "Çekirdekte"
                          ? "bg-[var(--color-barista)]/12 text-[var(--color-barista)]"
                          : "bg-[var(--color-signal)]/15 text-[var(--color-signal-deep)]"
                      }`}
                    >
                      {m.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{m.desc}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <CtaBand />
    </main>
  );
}
