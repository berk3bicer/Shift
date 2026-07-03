import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { PRICING } from "@/lib/content";
import { REGISTER_URL } from "@/lib/config";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Fiyatlandırma — spec 12.3 birebir (499 / 999 / 1.799 / Özel). AYDINLIK zemin, beyaz kartlar.
// Ortadaki "Büyüme" vurgulu (amber kenarlık + "Popüler" rozeti, 7shifts deseni). Şube başına aylık.
// hideHeader: /fiyatlar sayfası kendi hero'sunu taşır — bölüm başlığı orada gizlenir (Tur 7).
export default function Pricing({ hideHeader = false }: { hideHeader?: boolean }) {
  return (
    <section id="fiyat" className={`bg-[var(--color-paper)] ${hideHeader ? "pb-16 sm:pb-20" : "py-20 sm:py-28"}`}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {!hideHeader && (
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">
              Fiyatlandırma
            </span>
            <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
              Şube başına, aylık. Sürpriz yok.
            </h2>
            <p className="mt-4 text-lg text-[var(--color-muted)]">
              Küçük kafeden büyüyen zincire — ihtiyacın kadar modül. Gizli ücret, zorunlu üst paket yok.
            </p>
          </Reveal>
        )}

        <RevealStagger className="mt-12 grid items-start gap-5 lg:grid-cols-4">
          {PRICING.map((plan) => (
            <RevealItem key={plan.name}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "border-2 border-[var(--color-signal)] bg-gradient-to-b from-[var(--color-cream)] to-[var(--color-surface)] shadow-[0_24px_50px_-24px_rgb(245_158_11_/_0.55)] lg:-translate-y-2 lg:hover:-translate-y-3"
                    : "border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] hover:border-[var(--color-signal)]/50"
                }`}
              >
                {plan.highlighted && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[var(--color-signal)] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink)] shadow-[var(--shadow-cta)]">
                    <Sparkles size={11} /> Popüler
                  </span>
                )}

                <h3 className="font-display text-lg font-bold text-[var(--color-ink)]">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  {plan.price === "Özel" ? (
                    <span className="font-display text-3xl font-extrabold text-[var(--color-ink)]">Özel</span>
                  ) : (
                    <>
                      <span className="font-display text-4xl font-extrabold text-[var(--color-ink)]">{plan.price}</span>
                      <span className="text-sm font-medium text-[var(--color-muted)]">TL/ay</span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">{plan.users}</p>

                <ul className="mt-5 flex-1 space-y-2.5 border-t border-[var(--color-line)] pt-5">
                  {plan.scope.map((s) => (
                    <li key={s} className="flex items-start gap-2 text-sm text-[var(--color-ink)]">
                      <Check size={16} className="mt-0.5 shrink-0 text-[var(--color-signal-deep)]" strokeWidth={2.5} />
                      {s}
                    </li>
                  ))}
                </ul>

                {/* "/#pilot": Pricing artık /fiyatlar'da da render edilir — anchor ana sayfadaki forma */}
                <Link
                  href={plan.price === "Özel" ? "/#pilot" : REGISTER_URL}
                  className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                    plan.highlighted
                      ? "bg-[var(--color-signal)] text-[var(--color-ink)] shadow-[var(--shadow-cta)] hover:bg-[var(--color-signal-deep)] hover:text-white"
                      : "border border-[var(--color-line-strong)] text-[var(--color-ink)] hover:border-[var(--color-signal)] hover:bg-[var(--color-cream)]/50"
                  }`}
                >
                  {plan.price === "Özel" ? "İletişime geç" : "Başla"}
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
