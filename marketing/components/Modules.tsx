import { CORE_MODULES, MORE_MODULES } from "@/lib/content";

// Modüller — spec Bölüm 4 çekirdek MVP'si. Spec 12.1 "derinlik > genişlik": 11 modülle
// boğmadan çekirdek 5'i fayda cümlesiyle öne çıkar, gerisi "ve dahası".
const ACCENT: Record<string, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};

export default function Modules() {
  return (
    <section id="moduller" className="bg-[var(--color-ink)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-signal)]">
            Çekirdek modüller
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Genişlik değil, derinlik.
          </h2>
          <p className="mt-4 text-lg text-white/60">
            Önce çekirdeği kusursuz yapıyoruz: vardiya, görev, giriş-çıkış, checklist ve iletişim.
            Kafeye ilk günden değer katan beş modül.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CORE_MODULES.map((m) => (
            <article
              key={m.key}
              className="flex flex-col rounded-2xl border border-[var(--color-ink-line)] bg-[var(--color-ink-soft)] p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-semibold text-[var(--color-ink)]"
                  style={{ backgroundColor: ACCENT[m.accent] }}
                  aria-hidden="true"
                >
                  {m.title.charAt(0)}
                </span>
                <h3 className="font-display text-lg font-semibold text-white">{m.title}</h3>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/70">{m.benefit}</p>

              <ul className="mt-4 space-y-2 border-t border-white/5 pt-4">
                {m.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm text-white/55">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: ACCENT[m.accent] }}
                    />
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}

          {/* "ve dahası" kartı */}
          <article className="flex flex-col justify-center rounded-2xl border border-dashed border-[var(--color-ink-line)] p-6">
            <h3 className="font-display text-lg font-semibold text-white/80">ve dahası…</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {MORE_MODULES.map((m) => (
                <li
                  key={m}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60"
                >
                  {m}
                </li>
              ))}
            </ul>
            <p className="mt-4 font-mono text-xs text-white/35">
              Stok, tedarik ve hijyen modülleri sonraki fazlarda.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
