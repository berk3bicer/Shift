import { PRICING } from "@/lib/content";
import { REGISTER_URL } from "@/lib/config";

// Fiyatlandırma — spec 12.3 ile birebir (499 / 999 / 1.799 / Özel). Şube başına aylık.
export default function Pricing() {
  return (
    <section id="fiyat" className="bg-[var(--color-ink)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-signal)]">
            Fiyatlandırma
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Şube başına, aylık. Sürprizsiz.
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Küçük kafeden büyüyen zincire — ihtiyacın kadar modül.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {PRICING.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-[var(--color-signal)] bg-[var(--color-ink-soft)] ring-1 ring-[var(--color-signal)]"
                  : "border-[var(--color-ink-line)] bg-[var(--color-ink-soft)]"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-6 rounded-full bg-[var(--color-signal)] px-3 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink)]">
                  Önerilen
                </span>
              )}

              <h3 className="font-display text-lg font-semibold text-white">{plan.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                {plan.price === "Özel" ? (
                  <span className="font-display text-3xl font-bold text-white">Özel</span>
                ) : (
                  <>
                    <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
                    <span className="font-mono text-sm text-white/50">TL/ay</span>
                  </>
                )}
              </div>
              <p className="mt-1 font-mono text-xs text-white/45">{plan.users}</p>

              <ul className="mt-5 flex-1 space-y-2 border-t border-white/5 pt-5">
                {plan.scope.map((s) => (
                  <li key={s} className="flex items-start gap-2 text-sm text-white/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-signal)]" />
                    {s}
                  </li>
                ))}
              </ul>

              <a
                href={plan.price === "Özel" ? "#pilot" : REGISTER_URL}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-[var(--color-signal)] text-[var(--color-ink)] hover:bg-[var(--color-signal-deep)]"
                    : "border border-white/20 text-white hover:bg-white/5"
                }`}
              >
                {plan.price === "Özel" ? "İletişime geç" : "Başla"}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
