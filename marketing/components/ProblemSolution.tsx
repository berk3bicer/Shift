import { Check, MessageCircle, FileText, Calculator } from "lucide-react";
import { PROBLEM_SOLUTION } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem } from "./Reveal";

// Problem → Çözüm — 7shifts "before/after" anlatısı. Sol: dağınık (WhatsApp/kağıt/Excel, soluk),
// sağ: Shift'te toplanmış (SICAK krem/amber kart — artık koyu DEĞİL). İçerik spec 1.1/1.3.
const CHAOS_ICONS = [MessageCircle, FileText, Calculator, MessageCircle, FileText, MessageCircle];
// Dağınık chip'lere doğal bir "atılmışlık" hissi için hafif dönüşler.
const TILT = ["-2.5deg", "1.8deg", "-1.2deg", "2.2deg", "-2deg", "1.4deg"];

export default function ProblemSolution() {
  return (
    <section className="bg-[var(--color-paper)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">
            Problem → Çözüm
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Dağınık araçlar bir işi iki kez yaptırır.
          </h2>
          <p className="mt-4 text-lg text-[var(--color-muted)]">
            Bağımsız kafelerin operasyonu WhatsApp, kağıt ve hesap makinesine dağılmış durumda. POS
            sistemleri yalnız satışı çözer. Shift hepsini tek çatıda toplar.
          </p>
        </Reveal>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-[1fr_auto_1fr]">
          {/* Sol: dağınık */}
          <Reveal className="relative rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-deep)] p-6 sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-muted)]/50" />
              <span className="font-display text-sm font-bold text-[var(--color-muted)]">Şimdi — dağınık</span>
            </div>
            <div className="space-y-2.5">
              {PROBLEM_SOLUTION.map((row, i) => {
                const Icon = CHAOS_ICONS[i];
                return (
                  <div
                    key={row.problem}
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm"
                    style={{ transform: `rotate(${TILT[i]})` }}
                  >
                    <Icon size={15} className="shrink-0 text-[var(--color-muted)]/70" />
                    <span className="text-sm text-[var(--color-muted)] line-through decoration-[var(--color-muted)]/30">
                      {row.current}
                    </span>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* Orta: ok */}
          <div className="flex items-center justify-center lg:px-2">
            <div className="flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-[var(--color-signal)] text-[var(--color-ink)] shadow-[var(--shadow-cta)] lg:rotate-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Sağ: Shift'te toplanmış — SICAK krem/amber kart */}
          <Reveal className="rounded-2xl border-2 border-[var(--color-signal)]/40 bg-gradient-to-b from-[var(--color-cream)] to-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] sm:p-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
              <span className="font-display text-sm font-bold text-[var(--color-ink)]">Shift ile — tek çatıda</span>
            </div>
            <RevealStagger className="space-y-2.5" stagger={0.06}>
              {PROBLEM_SOLUTION.map((row) => (
                <RevealItem
                  key={row.problem}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-2.5 shadow-sm"
                  y={12}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-barista)]/15 text-[var(--color-barista)]">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span className="text-sm font-medium text-[var(--color-ink)]">{row.shift}</span>
                </RevealItem>
              ))}
            </RevealStagger>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
