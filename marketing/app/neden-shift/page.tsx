import type { Metadata } from "next";
import { Coffee, LayoutGrid, ReceiptText, Scale, ShieldCheck, Zap, MessagesSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { WHY_CARDS, COMPARISON_FULL } from "@/lib/content";
import Reveal, { RevealX, RevealStagger, RevealItem } from "@/components/Reveal";
import ScriptWord from "@/components/ScriptWord";
import { ComparisonTable, BADGE_STYLE } from "@/components/WhyShift";
import CtaBand from "@/components/CtaBand";

// /neden-shift — Tur 8 kurgusu: RAKİPSİZ anlatı. Marka ismi geçmez; iki araç KATEGORİSİNİN
// (vardiya araçları / satış-POS sistemleri) bıraktığı boşluk hikâyeyle anlatılır, Shift'in
// cevabı pozitif ve kendinden emin verilir. Matris kavramsal kolonlarla (kategori, isim değil).

export const metadata: Metadata = {
  title: "Neden Shiftle? — Operasyonun tamamı tek platformda",
  description:
    "Çoğu araç ya vardiyayı ya satışı çözer. Shiftle ikisinin arasında kalan her şeyi tek çatıda toplar — İş Kanunu, KVKK ve kafe diliyle, Türkiye'ye göre.",
};

const ICONS: Record<string, LucideIcon> = { Scale, ShieldCheck, MessagesSquare, Zap };

// İki dünya + Shift'in cevabı — kategori anlatısı (marka YOK). Her kart dürüst: kategorilerin
// güçlü olduğu yer saklanmaz; boşluk nerede, Shift neyi bütünlüyor — açıkça.
const STORY = [
  {
    icon: LayoutGrid,
    name: "Vardiyayı çözenler",
    story:
      "Ekip ve vardiya uygulamaları planlamada gerçekten iyidir — ama iş stoğa, tedariğe ve hijyene gelince sayfa biter. Çoğu başka coğrafyanın mevzuatına göre yazılmıştır: mesai hesabı oranın kurallarıyla, arayüz oranın dilinde.",
    gap: "Mutfak tarafı ve Türkiye mevzuatı dışarıda kalır.",
  },
  {
    icon: ReceiptText,
    name: "Satışı çözenler",
    story:
      "POS ve adisyon sistemleri kasada güçlüdür: satış, rapor, e-Fatura. Ama vardiyayı kim planlıyor, açılış checklist'ini kim dolduruyor, fazla mesai kaç saat oldu — bu soruların cevabı sistemin dışında, kağıtta ve mesaj gruplarında yaşar.",
    gap: "Ekip operasyonu boşta kalır.",
  },
  {
    icon: Coffee,
    name: "Shiftle: ikisinin arasındaki her şey",
    story:
      "Vardiyadan stoğa, mesaiden hijyene — parça parça değil, bütün. İş Kanunu limitleri planlama anında denetlenir, veriler KVKK'ya göre tutulur, arayüz kafenin diliyle konuşur. Sonradan çeviri değil: baştan Türkiye'deki kafeler için kurgulandı.",
    gap: null,
  },
];

export default function WhyShiftPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--color-paper)] pb-16 pt-32 lg:pt-40">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-8%] h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-[-8%] h-[20rem] w-[20rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-sage-soft), transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <span className="anim-rise inline-block text-sm font-bold uppercase tracking-wider text-[var(--color-terra)]" style={{ animationDelay: "40ms" }}>
            Neden Shiftle
          </span>
          <h1 className="anim-rise font-display mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink)] sm:text-5xl" style={{ animationDelay: "120ms" }}>
            Çünkü operasyonun <ScriptWord>tamamı</ScriptWord> burada.
          </h1>
          <p className="anim-rise mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]" style={{ animationDelay: "200ms" }}>
            Kimseyi kötülemeye ihtiyacımız yok — her araç kendi işini iyi yapar. Soru şu: kafenin
            <em> ekip operasyonu</em>{" "}için, vardiyadan hijyene her parçayı Türkiye&apos;ye göre çözen
            eksiksiz bir araç var mı? Shiftle, o sorunun cevabı olsun diye yazılıyor.
          </p>
        </div>
      </section>

      {/* İki dünya + Shift'in cevabı — hikâye kartları */}
      <section className="bg-[var(--color-paper-deep)] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-3">
            {STORY.map((s, i) => {
              const isShift = s.gap === null;
              return (
                <RevealX key={s.name} from={i === 2 ? "right" : "left"} delay={i * 0.08}>
                  <article
                    className={`flex h-full flex-col rounded-[2rem] border p-7 sm:p-8 ${
                      isShift
                        ? "border-2 border-[var(--color-signal)]/50 bg-gradient-to-b from-[var(--color-cream)] to-[var(--color-surface)] shadow-[var(--shadow-card)]"
                        : "border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-card)]"
                    }`}
                  >
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                        isShift ? "bg-[var(--color-signal)] text-[var(--color-ink)]" : "bg-[var(--color-paper-deep)] text-[var(--color-muted)]"
                      }`}
                    >
                      <s.icon size={22} />
                    </span>
                    <h2 className="font-display mt-5 text-xl font-extrabold text-[var(--color-ink)]">{s.name}</h2>
                    <p className="mt-3 flex-1 text-[15px] leading-relaxed text-[var(--color-muted)]">{s.story}</p>
                    {s.gap ? (
                      <p className="mt-5 rounded-xl bg-[var(--color-paper-deep)] px-4 py-3 text-sm font-semibold text-[var(--color-terra)]">
                        Boşluk: {s.gap}
                      </p>
                    ) : (
                      <p className="mt-5 rounded-xl bg-[var(--color-sage-soft)]/70 px-4 py-3 text-sm font-semibold text-[var(--color-sage-deep)]">
                        Tek çatı — parça parça değil, bütün.
                      </p>
                    )}
                  </article>
                </RevealX>
              );
            })}
          </div>
        </div>
      </section>

      {/* Shift farkı — landing'deki WHY_CARDS verisinin yeniden kullanımı */}
      <section className="bg-[var(--color-paper)] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <Reveal className="max-w-2xl">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-sage-deep)]">Shiftle farkı</span>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              Hepsi-bir-arada + İş Kanunu + KVKK + kafe dili.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--color-muted)]">
              Vardiyadan hijyene tek çatı; mesai 4857&apos;ye göre, veri KVKK&apos;ya göre, arayüz ekibinin
              konuştuğu dille.
            </p>
          </Reveal>
          <RevealStagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_CARDS.map((c) => {
              const Icon = ICONS[c.icon] ?? Scale;
              return (
                <RevealItem key={c.title}>
                  <div className="flex h-full flex-col rounded-3xl border border-[var(--color-line)] bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-paper)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-signal)]/50">
                    <div className="flex items-center justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-cream)] text-[var(--color-signal-deep)]">
                        <Icon size={20} />
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${BADGE_STYLE[c.badge] ?? BADGE_STYLE.default}`}>
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

          {/* Kapsam matrisi — kavramsal kategoriler (marka ismi YOK), faz etiketli dürüst hali */}
          <Reveal className="mt-20 max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              Kapsam, yan yana
            </h2>
            <p className="mt-3 text-base leading-relaxed text-[var(--color-muted)]">
              İsimlere gerek yok — kategoriler yeter. Aşağıdaki tablo, tipik bir vardiya aracının ve
              tipik bir POS/adisyon sisteminin kapsamıyla Shiftle&apos;nin kapsamını yan yana koyar.
            </p>
          </Reveal>
          <div className="mt-8">
            <ComparisonTable data={COMPARISON_FULL} />
          </div>
        </div>
      </section>

      <CtaBand title="Parçaları toplamayı bırak." sub="Vardiya, görev, mesai ve havuz bugün hazır — Türkçe, İş Kanunu ve KVKK uyumlu. 10 dakikada kur." />
    </main>
  );
}
