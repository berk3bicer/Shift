import { ArrowRight, ShieldCheck } from "lucide-react";
import { REGISTER_URL } from "@/lib/config";
import ShiftGrid from "./ShiftGrid";

// Hero — SPLIT. Sol: başlık + açıklama + 2 CTA + güven rozeti. Sağ: canlı vardiya çizelgesi.
// Giriş animasyonu SAF CSS keyframe (.anim-rise, stagger için animationDelay) — JS/hydration'a
// bağlı değil, arka planda yüklenen sekmede bile görünür. reduced-motion globals.css'te kapatılır.
export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[var(--color-ink)]">
      {/* Zemin: ince ızgara deseni + üstte yumuşak amber ışıma (derinlik) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ink-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 60% at 70% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 70% 0%, black, transparent)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-signal), transparent 65%)" }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-28 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-8 lg:pb-28 lg:pt-36">
        {/* Sol: metin */}
        <div>
          <span
            className="anim-rise inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs text-white/70"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-barista)]" />
            Kafeler için, kafede çalışmış biri tarafından
          </span>

          <h1
            className="anim-rise font-display mt-5 text-4xl font-bold leading-[1.06] text-white sm:text-5xl lg:text-[3.5rem]"
            style={{ animationDelay: "120ms" }}
          >
            Kafenin bütün operasyonu{" "}
            <span className="relative whitespace-nowrap text-[var(--color-signal)]">
              tek ekranda
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M1 5.5C50 2 150 2 199 5.5" stroke="var(--color-signal)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
            .
          </h1>

          <p
            className="anim-rise mt-6 max-w-xl text-lg leading-relaxed text-white/70"
            style={{ animationDelay: "200ms" }}
          >
            Vardiya WhatsApp&apos;ta, hijyen kağıtta, mesai hesap makinesinde dönmesin. Vardiya, görev,
            giriş-çıkış, checklist ve duyuru — hepsi tek platformda.
          </p>

          <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "280ms" }}>
            <a
              href={REGISTER_URL}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-signal)] px-6 py-3.5 text-base font-semibold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)]"
            >
              Ücretsiz Başla
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#pilot"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/5"
            >
              Ücretsiz pilot iste
            </a>
          </div>

          <div className="anim-rise mt-6 flex items-center gap-2 text-sm text-white/50" style={{ animationDelay: "360ms" }}>
            <ShieldCheck size={16} className="text-[var(--color-barista)]" />
            <span>İş Kanunu uyumlu · KVKK · Türkçe destek</span>
          </div>
        </div>

        {/* Sağ: imza çizelge */}
        <div className="lg:pl-4">
          <ShiftGrid />
        </div>
      </div>
    </section>
  );
}
