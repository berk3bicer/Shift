import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowRightLeft,
  CalendarDays,
  Clock,
  KanbanSquare,
  Package,
  Scale,
  SprayCan,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { MODULE_PAGES, getModule } from "@/lib/modules";
import { REGISTER_URL } from "@/lib/config";
import Reveal, { RevealX, RevealStagger, RevealItem } from "@/components/Reveal";
import Scribble from "@/components/Scribble";
import CtaBand from "@/components/CtaBand";
import ShiftGrid from "@/components/ShiftGrid";
import { KanbanMock, TimeclockMock, PoolMock, StockMock, HygieneMock } from "@/components/FeatureMocks";

// Modül detay sayfaları — ORTAK ŞABLON (Tur 7): hero (fayda başlığı + mock) → özellikler
// (spec'ten, MVP/Faz/TR etiketli) → nasıl çalışır (3 adım) → TR farkı → CTA bandı.
// İçerik lib/modules.ts'te (spec'ten birebir); tüm slug'lar SSG ile statik prerender edilir.

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

const VISUALS: Record<string, ReactNode> = {
  shiftgrid: <ShiftGrid className="w-full" />,
  kanban: <KanbanMock />,
  timeclock: <TimeclockMock />,
  pool: <PoolMock />,
  stock: <StockMock />,
  hygiene: <HygieneMock />,
};

// Özellik etiketi renkleri — dürüst faz iletişimi: MVP yeşil (çekirdek), Faz amber (yol
// haritası), TR mavi (Türkiye'ye özgü).
const TAG_STYLE: Record<string, string> = {
  MVP: "bg-[var(--color-barista)]/12 text-[var(--color-barista)]",
  "Faz 2": "bg-[var(--color-signal)]/15 text-[var(--color-signal-deep)]",
  "Faz 3": "bg-[var(--color-signal)]/15 text-[var(--color-signal-deep)]",
  TR: "bg-[var(--color-kasiyer)]/12 text-[var(--color-kasiyer)]",
};

export function generateStaticParams() {
  return MODULE_PAGES.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) return {};
  return {
    title: `${mod.name} — Shiftle`,
    description: `${mod.headline} ${mod.sub}`,
  };
}

export default async function ModuleDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mod = getModule(slug);
  if (!mod) notFound();

  const Icon = ICONS[mod.icon] ?? CalendarDays;
  const accent = ACCENT[mod.accent];

  return (
    <main>
      {/* ── Hero: fayda başlığı + ürün mock'u ── */}
      <section className="relative overflow-hidden bg-[var(--color-paper)] pb-16 pt-28 sm:pb-20 lg:pt-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-10%] h-[26rem] w-[26rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <div className="anim-rise flex flex-wrap items-center gap-2.5" style={{ animationDelay: "40ms" }}>
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] shadow-sm"
              >
                <Icon size={14} style={{ color: accent }} />
                {mod.name}
              </span>
              {mod.phase && (
                <span className="rounded-full bg-[var(--color-signal)]/15 px-3.5 py-1.5 text-xs font-bold text-[var(--color-signal-deep)]">
                  {mod.phase}
                </span>
              )}
            </div>
            <h1
              className="anim-rise font-display mt-5 text-4xl font-extrabold leading-[1.08] text-[var(--color-ink)] sm:text-5xl"
              style={{ animationDelay: "120ms" }}
            >
              {mod.headline}
            </h1>
            <p className="anim-rise mt-5 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]" style={{ animationDelay: "200ms" }}>
              {mod.sub}
            </p>
            <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "280ms" }}>
              <a
                href={REGISTER_URL}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-signal)] px-6 py-3.5 text-base font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
              >
                Ücretsiz Başla
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/moduller"
                className="inline-flex items-center justify-center rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-6 py-3.5 text-base font-semibold text-[var(--color-ink)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--color-signal)]"
              >
                Tüm modüller
              </Link>
            </div>
          </div>

          {/* Mock — above-fold: CSS keyframe (framer whileInView DEĞİL — arka plan sekme dersi) */}
          <div className="anim-float relative" style={{ animationDelay: "160ms" }}>
            <div className="relative rounded-[2rem] bg-[var(--color-cream)]/70 p-4 sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-50"
                style={{ background: "radial-gradient(circle at 30% 20%, var(--color-warm-soft), transparent 60%)" }}
              />
              <div className="relative">{VISUALS[mod.visual]}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Özellikler (spec'ten, etiketli) ── */}
      <section className="bg-[var(--color-paper-deep)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">Özellikler</span>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              Neler var{mod.phase ? ", neler geliyor" : ""}?
            </h2>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
            {mod.features.map((f) => (
              <RevealItem key={f.title}>
                <article className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/50">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-base font-bold text-[var(--color-ink)]">{f.title}</h3>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${TAG_STYLE[f.tag]}`}>
                      {f.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{f.desc}</p>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
          <p className="mt-5 text-xs text-[var(--color-muted)]">
            Etiketler ürün spesifikasyonundan: <strong>MVP</strong>{" "}= çekirdek sürümde, <strong>Faz 2/3</strong>{" "}= yol
            haritasında (henüz yayında değil), <strong>TR</strong>{" "}= Türkiye&apos;ye özgü gereksinim.
          </p>
        </div>
      </section>

      {/* ── Nasıl çalışır: 3 adım ── */}
      <section className="bg-[var(--color-paper)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-sage-deep)]">Nasıl çalışır</span>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              <span className="relative inline-block whitespace-nowrap">
                <span className="font-script font-bold text-[var(--color-signal-deep)]">Üç adımda</span>
                <Scribble shape="underline" className="absolute -bottom-1.5 left-0 w-full" delay={0.35} />
              </span>{" "}
              iş başında.
            </h2>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-4 md:grid-cols-3" stagger={0.1}>
            {mod.how.map((s, i) => (
              <RevealItem key={s.title}>
                <div className="relative h-full rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 pt-8 shadow-[var(--shadow-card)]">
                  <span
                    className="absolute -top-4 left-6 flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold text-[var(--color-ink)] shadow-[var(--shadow-cta)]"
                    style={{ backgroundColor: "var(--color-signal)" }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-display text-base font-bold text-[var(--color-ink)]">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{s.desc}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* ── Türkiye farkı ── */}
      {mod.tr && (
        <section className="bg-[var(--color-paper)] pb-16 sm:pb-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <RevealX from="left">
              <div className="relative overflow-hidden rounded-3xl bg-[var(--color-cream)] p-8 sm:p-12">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-60"
                  style={{ background: "radial-gradient(circle at 85% 15%, var(--color-warm-soft), transparent 55%)" }}
                />
                <div className="relative max-w-3xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-signal-deep)] shadow-sm">
                    <Scale size={14} /> Türkiye farkı
                  </span>
                  <h2 className="font-display mt-4 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
                    {mod.tr.title}
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-[var(--color-muted)] sm:text-lg">{mod.tr.body}</p>
                </div>
              </div>
            </RevealX>
          </div>
        </section>
      )}

      <CtaBand
        title={mod.phase ? "Çekirdek modüllerle bugün başla." : `${mod.name} bugün kafende çalışsın.`}
        sub={
          mod.phase
            ? "Bu modül yol haritasında — vardiya, görev ve mesai bugün hazır. Kur, kullan; yeni modüller geldikçe aynı hesapta açılır."
            : "10 dakikada kur, ekibini davet et, ilk programını bugün yayınla. Ücretsiz, taahhütsüz."
        }
      />
    </main>
  );
}
