import { COMPARISON, TRUST } from "@/lib/content";

// Neden Shift — spec 1.5 rakip tablosu (sadeleştirilmiş) + spec 2.3/10.3/12.1 güven kartları.
// Farklılaştırıcılar (stok/hijyen 7shifts'te yok) + Türkiye kazanan kartları (İş Kanunu/KVKK/Türkçe).

function Cell({ value, isShift }: { value: string; isShift: boolean }) {
  if (value === "full") {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
          isShift ? "bg-[var(--color-barista)]/20 text-[var(--color-barista)]" : "bg-[var(--color-muted)]/15 text-[var(--color-ink)]"
        }`}
        title="Tam"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-label="Tam">
          <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
        </svg>
      </span>
    );
  }
  if (value === "partial") {
    return <span className="font-mono text-xs text-[var(--color-muted)]" title="Kısmi">kısmi</span>;
  }
  // none
  return (
    <span className="inline-flex h-6 w-6 items-center justify-center text-[var(--color-muted)]/40" title="Yok" aria-label="Yok">
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
        <path d="M4 9h12v2H4z" />
      </svg>
    </span>
  );
}

export default function WhyShift() {
  return (
    <section id="neden" className="bg-[var(--color-paper)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-signal-deep)]">
            Neden Shift
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            7shifts&apos;in bıraktığı yerde, Türkiye&apos;ye göre.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            7shifts vardiyada güçlü ama stok, tedarik ve hijyene hiç girmez; İş Kanunu ve KVKK&apos;yı
            bilmez. Yerli POS sistemleri ise yalnız satışı çözer.
          </p>
        </div>

        {/* Karşılaştırma matrisi */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            <thead>
              <tr>
                <th className="bg-[var(--color-paper)] px-5 py-4 text-left font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  Özellik
                </th>
                {COMPARISON.competitors.map((c, i) => (
                  <th
                    key={c}
                    className={`px-4 py-4 text-center font-display text-sm font-semibold ${
                      i === 0 ? "bg-[var(--color-ink)] text-white" : "bg-[var(--color-paper)] text-[var(--color-muted)]"
                    }`}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.rows.map((row) => (
                <tr key={row.feature}>
                  <td className="border-t border-[var(--color-line)] px-5 py-3 text-sm font-medium">
                    {row.feature}
                  </td>
                  {row.values.map((v, i) => (
                    <td
                      key={i}
                      className={`border-t border-[var(--color-line)] px-4 py-3 text-center ${
                        i === 0 ? "bg-[var(--color-ink)]/[0.03]" : ""
                      }`}
                    >
                      <Cell value={v} isShift={i === 0} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 font-mono text-xs text-[var(--color-muted)]">{COMPARISON.footnote}</p>

        {/* Güven kartları */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {TRUST.map((t) => (
            <div key={t.title} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <h3 className="font-display text-base font-semibold">{t.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{t.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
