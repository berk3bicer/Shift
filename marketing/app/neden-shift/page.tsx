import type { Metadata } from "next";
import { Check, Minus, Scale, ShieldCheck, Zap, MessagesSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WHY_CARDS, COMPARISON_FULL } from "@/lib/content";
import Reveal, { RevealX, RevealStagger, RevealItem } from "@/components/Reveal";
import { ComparisonTable } from "@/components/WhyShift";
import CtaBand from "@/components/CtaBand";

// /neden-shift — derinlemesine karşılaştırma (Tur 7). DÜRÜST analiz: 7shifts'in ve yerli
// POS'ların güçlü yanları saklanmaz ("rakip kötü" pazarlaması YOK); boşluk nerede, Shift
// neyi dolduruyor — açıkça. Matris: spec 1.5'in TAM hali (ComparisonTable yeniden kullanımı).

export const metadata: Metadata = {
  title: "Neden Shift? — 7shifts ve yerli POS'larla dürüst karşılaştırma",
  description:
    "7shifts vardiyada dünya lideri ama İş Kanunu'nu bilmez, Türkçe konuşmaz. Yerli POS'lar satışı çözer, ekip operasyonunu değil. Shift tam bu boşlukta.",
};

const ICONS: Record<string, LucideIcon> = { Scale, ShieldCheck, MessagesSquare, Zap };

// Dürüst "yapar / yapmaz" analizi — spec 1.5 + 2.4'ten.
const HONEST = [
  {
    name: "7shifts",
    verdict: "Vardiyada dünya lideri — ama başka coğrafya için yazılmış.",
    does: [
      "Vardiya planlama ve havuz/takas: sektörün en iyisi",
      "Ekip iletişimi ve bildirim omurgası çok güçlü",
      "55.000'den fazla restoranda kanıtlanmış deneyim",
    ],
    doesnt: [
      "Stok, tedarik ve hijyen modülü hiç yok",
      "Mesai ABD/Kanada kurallarına göre — İş Kanunu'nu bilmez",
      "Türkçe arayüz ve destek yok; KVKK yerine GDPR",
    ],
  },
  {
    name: "Yerli POS / adisyon sistemleri",
    verdict: "Satış tarafını iyi çözerler — ekip operasyonu boşta kalır.",
    does: [
      "Adisyon, kasa ve satış raporlaması olgun",
      "Türkçe destek ve KVKK uyumu yerinde",
      "e-Fatura gibi yerel entegrasyonlar hazır",
    ],
    doesnt: [
      "Vardiya havuzu/takas yok; planlama temel düzeyde",
      "Görev, checklist ve foto-kanıt takibi yok",
      "Tedarik ve hijyen/HACCP kaydı kapsam dışı",
    ],
  },
];

export default function WhyShiftPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--color-paper)] pb-14 pt-28 lg:pt-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-8%] h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <span className="anim-rise inline-block text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]" style={{ animationDelay: "40ms" }}>
            Neden Shift
          </span>
          <h1 className="anim-rise font-display mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink)] sm:text-5xl" style={{ animationDelay: "120ms" }}>
            7shifts&apos;in bıraktığı yerde, Türkiye için.
          </h1>
          <p className="anim-rise mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]" style={{ animationDelay: "200ms" }}>
            Rakipleri kötülemeyeceğiz — 7shifts vardiyada gerçekten dünya lideri, yerli POS&apos;lar satışı
            gerçekten iyi çözer. Soru şu: kafenin <em>ekip operasyonu</em>{" "}için Türkiye&apos;de eksiksiz bir
            araç var mı? İşte o boşluk.
          </p>
        </div>
      </section>

      {/* Dürüst yapar/yapmaz analizi */}
      <section className="bg-[var(--color-paper-deep)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {HONEST.map((h, i) => (
              <RevealX key={h.name} from={i === 0 ? "left" : "right"}>
                <article className="flex h-full flex-col rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)] sm:p-9">
                  <h2 className="font-display text-xl font-extrabold text-[var(--color-ink)] sm:text-2xl">{h.name}</h2>
                  <p className="mt-2 text-sm font-medium text-[var(--color-signal-deep)]">{h.verdict}</p>
                  <div className="mt-6 space-y-5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Ne yapar</h3>
                      <ul className="mt-2.5 space-y-2">
                        {h.does.map((d) => (
                          <li key={d} className="flex items-start gap-2.5 text-sm text-[var(--color-ink)]">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-barista)]/12 text-[var(--color-barista)]">
                              <Check size={12} strokeWidth={3} />
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Ne yapmaz</h3>
                      <ul className="mt-2.5 space-y-2">
                        {h.doesnt.map((d) => (
                          <li key={d} className="flex items-start gap-2.5 text-sm text-[var(--color-muted)]">
                            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)]/10 text-[var(--color-muted)]">
                              <Minus size={12} strokeWidth={3} />
                            </span>
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              </RevealX>
            ))}
          </div>
        </div>
      </section>

      {/* Shift farkı — landing'deki WHY_CARDS verisinin yeniden kullanımı */}
      <section className="bg-[var(--color-paper)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">Shift farkı</span>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              Hepsi-bir-arada + İş Kanunu + KVKK + kafe dili.
            </h2>
            <p className="mt-4 text-lg text-[var(--color-muted)]">
              Vardiyadan hijyene tek çatı; mesai 4857&apos;ye göre, veri KVKK&apos;ya göre, arayüz ekibinin
              konuştuğu dille.
            </p>
          </Reveal>
          <RevealStagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CARDS.map((c) => {
              const Icon = ICONS[c.icon] ?? Scale;
              return (
                <RevealItem key={c.title}>
                  <div className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/50">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[var(--color-signal)]">
                        <Icon size={20} />
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.badge === "Yerel kazanç"
                            ? "bg-[var(--color-barista)]/15 text-[var(--color-barista)]"
                            : "bg-[var(--color-signal)]/15 text-[var(--color-signal-deep)]"
                        }`}
                      >
                        {c.badge}
                      </span>
                    </div>
                    <h3 className="font-display mt-4 text-base font-bold text-[var(--color-ink)]">{c.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{c.detail}</p>
                  </div>
                </RevealItem>
              );
            })}
          </RevealStagger>

          {/* Tam karşılaştırma matrisi — spec 1.5, faz etiketli dürüst hali */}
          <Reveal className="mt-16 max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              Özellik özellik karşılaştırma
            </h2>
          </Reveal>
          <div className="mt-6">
            <ComparisonTable data={COMPARISON_FULL} />
          </div>
        </div>
      </section>

      <CtaBand title="Boşluğu Shift'le doldur." sub="Vardiya, görev, mesai ve havuz bugün hazır — Türkçe, İş Kanunu ve KVKK uyumlu. 10 dakikada kur." />
    </main>
  );
}
