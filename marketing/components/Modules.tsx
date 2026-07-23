import { CalendarDays, KanbanSquare, Clock, ArrowRightLeft, Megaphone, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { CORE_MODULES, MORE_MODULES } from "@/lib/content";
import Reveal, { RevealX, RevealStagger, RevealItem } from "./Reveal";
import Scribble from "./Scribble";
import ShiftGrid from "./ShiftGrid";
import { KanbanMock, TimeclockMock, PoolMock } from "./FeatureMocks";

// Modüller — Tur 6: düz kart ızgarası yerine ZİKZAK feature blokları.
// Her çekirdek modül kendi sahnesinde: bir yanda ürün mockup'ı (gerçek DOM, sıcak palet),
// diğer yanda başlık + fayda + madde listesi. Sıra her blokta ters döner (görsel sol↔sağ);
// scroll'da görsel ve metin iki yandan kayarak belirir (RevealX). Mobilde tek kolon:
// görsel üstte, metin altta. Duyuru + "ve dahası" altta kompakt şerit olarak kalır.
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

// key → mockup görseli. ShiftGrid hero'daki canlı çizelgenin aynısı (yeniden kullanım).
const VISUALS: Record<string, ReactNode> = {
  vardiya: <ShiftGrid className="w-full" />,
  gorev: <KanbanMock />,
  puantaj: <TimeclockMock />,
  havuz: <PoolMock />,
};

const SHOWCASE = CORE_MODULES.filter((m) => m.key in VISUALS);
const STRIP = CORE_MODULES.filter((m) => !(m.key in VISUALS));

export default function Modules() {
  return (
    <section id="moduller" className="overflow-hidden bg-[var(--color-paper-deep)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-terra)]">
            Çekirdek modüller
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Genişlik değil,{" "}
            <span className="relative inline-block">
              <span className="font-script font-bold text-[var(--color-signal-deep)]">derinlik</span>
              <Scribble shape="underline" className="absolute -bottom-1.5 left-0 w-full" delay={0.4} />
            </span>
            .
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-muted)]">
            Önce çekirdeği kusursuz yapıyoruz: vardiya, görev, giriş-çıkış ve vardiya havuzu.
            Kafeye ilk günden değer katan modüller — aşağıda her biri iş başında.
          </p>
        </Reveal>

        {/* Zikzak feature blokları — cömert dikey boşluk, dikey ortalı iki kolon.
            Görsel zeminleri sıcak ara tonlarda döner: krem → şeftali → adaçayı (palet zenginliği). */}
        <div className="mt-14 space-y-16 sm:mt-16 sm:space-y-24">
          {SHOWCASE.map((m, i) => {
            const Icon = ICONS[m.icon] ?? CalendarDays;
            const visualLeft = i % 2 === 0; // lg'de: çift blok görsel-sol, tek blok görsel-sağ
            const accent = ACCENT[m.accent];
            const tints = ["bg-[var(--color-cream)]/70", "bg-[var(--color-sage-soft)]/60", "bg-[var(--color-cream-2)]/70", "bg-[var(--color-terra-soft)]/50"];
            return (
              <div key={m.key} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
                {/* Görsel — mobilde her zaman üstte (DOM sırası), lg'de zikzak */}
                <RevealX from={visualLeft ? "left" : "right"} className={visualLeft ? "" : "lg:order-2"}>
                  <div className={`relative rounded-[2.5rem] p-3 sm:p-5 ${tints[i % tints.length]}`}>
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-[2.5rem] opacity-50"
                      style={{ background: "radial-gradient(circle at 30% 20%, var(--color-warm-soft), transparent 60%)" }}
                    />
                    <div className="relative">{VISUALS[m.key]}</div>
                  </div>
                </RevealX>

                {/* Metin */}
                <RevealX from={visualLeft ? "right" : "left"} delay={0.1}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${accent} 14%, white)`, color: accent }}
                    >
                      <Icon size={20} />
                    </span>
                    <span className="font-mono text-xs font-semibold tracking-widest text-[var(--color-muted)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="font-display mt-4 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
                    {m.title}
                  </h3>
                  <p className="mt-3 max-w-lg text-lg leading-relaxed text-[var(--color-muted)]">{m.benefit}</p>
                  <ul className="mt-6 space-y-3">
                    {m.points.map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-[15px] text-[var(--color-ink)]">
                        <span
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: `color-mix(in srgb, ${accent} 15%, white)`, color: accent }}
                        >
                          <Check size={12} strokeWidth={3} />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                </RevealX>
              </div>
            );
          })}
        </div>

        {/* Duyuru + "ve dahası" — kompakt kapanış şeridi */}
        <RevealStagger className="mt-16 grid gap-4 sm:mt-20 sm:grid-cols-2">
          {STRIP.map((m) => {
            const Icon = ICONS[m.icon] ?? Megaphone;
            return (
              <RevealItem key={m.key}>
                <article className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/60">
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
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {m.points.map((p) => (
                      <li key={p} className="rounded-full border border-[var(--color-line-strong)] bg-[var(--color-paper)] px-3 py-1 text-xs font-medium text-[var(--color-muted)]">
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              </RevealItem>
            );
          })}

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
