import { REGISTER_URL } from "@/lib/config";
import ShiftGrid from "./ShiftGrid";
import Nav from "./Nav";

// Hero — koyu ink zemin. Sol: değer önerisi + CTA'lar. Sağ: canlı vardiya ızgarası (imza).
// Değer önerisi spec 1.1/1.2/0'dan: dağınık araçlar → tek platform, kafe odaklı.
export default function Hero() {
  return (
    <header id="top" className="relative overflow-hidden bg-[var(--color-ink)]">
      {/* Zemin dokusu — hafif ızgara deseni (operasyon paneli hissi) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-ink-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-ink-line) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 80% 60% at 70% 0%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 70% 0%, black, transparent)",
        }}
      />

      <div className="relative">
        <Nav />

        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pb-28 lg:pt-16">
          {/* Sol: metin */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-barista)]" />
              Kafeler için, kafede çalışmış biri tarafından
            </span>

            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]">
              Kafenin bütün operasyonu{" "}
              <span className="text-[var(--color-signal)]">tek ekranda</span>.
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">
              Vardiya WhatsApp&apos;ta, hijyen kağıtta, mesai hesap makinesinde dönmesin. Vardiya,
              görev, giriş-çıkış, checklist ve duyuru — hepsi tek platformda, Türkçe, İş Kanunu ve
              KVKK uyumlu.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={REGISTER_URL}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-signal)] px-6 py-3.5 text-base font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-signal-deep)]"
              >
                Ücretsiz başla
              </a>
              <a
                href="#pilot"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/5"
              >
                Ücretsiz pilot iste
              </a>
            </div>

            <p className="mt-4 font-mono text-xs text-white/40">
              Kurulum 10 dakika · Kredi kartı yok · Tanıdık kafelerle sıcak pilot
            </p>
          </div>

          {/* Sağ: imza ızgara */}
          <div className="lg:pl-4">
            <ShiftGrid />
          </div>
        </div>
      </div>
    </header>
  );
}
