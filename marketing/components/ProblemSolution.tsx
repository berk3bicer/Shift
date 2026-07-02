import { PROBLEM_SOLUTION } from "@/lib/content";

// Problem → Çözüm — spec 1.1/1.3. "Mevcut yöntem" karşısında "Shift ile".
export default function ProblemSolution() {
  return (
    <section className="bg-[var(--color-paper)] py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-signal-deep)]">
            Problem → Çözüm
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
            Dağınık araçlar bir işi iki kez yaptırır.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            Bağımsız kafelerin operasyonu WhatsApp, kağıt ve hesap makinesine dağılmış durumda. POS
            sistemleri yalnız satışı çözer; ekip, mesai ve hijyen boşta kalır. Shift bu boşluğu doldurur.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          {/* Başlık satırı — sadece masaüstünde */}
          <div className="hidden grid-cols-[1.2fr_1fr_1.4fr] border-b border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-3 font-mono text-xs uppercase tracking-wider text-[var(--color-muted)] sm:grid">
            <span>Operasyonel sorun</span>
            <span>Mevcut yöntem</span>
            <span>Shift ile</span>
          </div>

          <ul>
            {PROBLEM_SOLUTION.map((row, i) => (
              <li
                key={row.problem}
                className={`grid gap-2 px-6 py-4 sm:grid-cols-[1.2fr_1fr_1.4fr] sm:items-center sm:gap-4 ${
                  i > 0 ? "border-t border-[var(--color-line)]" : ""
                }`}
              >
                <span className="font-display font-semibold">{row.problem}</span>
                <span className="text-sm text-[var(--color-muted)] line-through decoration-[var(--color-muted)]/40">
                  {row.current}
                </span>
                <span className="flex items-start gap-2 text-sm font-medium">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-barista)]"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {row.shift}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
