import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ExternalLink, Info } from "lucide-react";
import Reveal, { RevealStagger, RevealItem, CountUp } from "@/components/Reveal";
import CtaBand from "@/components/CtaBand";

// /kaynaklar/kafe-rehberi — İÇERİK SAYFASI (Tur 7, EN HASSAS SAYFA).
// DÜRÜSTLÜK ÇERÇEVESİ (Berke onaylı): 7shifts'in benzer sayfası KENDİ 1.074 kişilik anketine
// dayanır; bizim öyle verimiz YOK. Bu yüzden "biz araştırdık" tonu YASAK. Burada yalnızca
// (1) resmi mevzuat, (2) üçüncü taraf/akademik araştırma atıfları kullanılır — her veri
// görünür + tıklanır kaynak linkiyle. UYDURMA anket/yüzde YOK; niteliksel gözlemler sayı
// verilmeden, gözlem tonunda anlatılır. Pilot verisi geldiğinde kendi verimizle güçlenecek.

export const metadata: Metadata = {
  title: "Kafe Operasyonu Rehberi: Verilerle Ekip Yönetimi — Shift",
  description:
    "Bağımsız kafe işletmek zor. Resmi mevzuat ve sektör verileri sorunları gösteriyor: dar kâr marjı, yüksek personel devri, İş Kanunu limitleri. Kaynaklı rehber.",
};

// Her insight: gerçek veri + görünür kaynak atfı + Shift bağlantısı. `stat` yoksa niteliksel
// (sayı uydurulmaz). Kaynak listesi sayfa altında tekrarlanır.
const INSIGHTS: {
  stat?: { prefix?: string; to: number; suffix: string };
  statLabel?: string;
  title: string;
  body: string;
  source: { label: string; url: string };
  solution: string;
  link: { href: string; label: string };
}[] = [
  {
    stat: { to: 45, suffix: " saat" },
    statLabel: "haftalık yasal çalışma sınırı",
    title: "İş Kanunu limitleri elle takip edilemeyecek kadar kritik",
    body: "4857 sayılı İş Kanunu'na göre haftalık çalışma süresi en çok 45 saattir ve günlük çalışma 11 saati aşamaz; 45 saati aşan çalışma, saat ücreti %50 zamlı fazla mesaidir. Bu limitleri kağıt puantajla takip etmek hem hata hem yaptırım riski taşır.",
    source: { label: "4857 sayılı İş Kanunu (Md. 41, 63) — mevzuat.gov.tr", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf" },
    solution: "Shift giriş-çıkış verisinden mesaiyi otomatik hesaplar; 45 saate yaklaşan personelde plan aşamasında uyarır, fazla mesaiyi %50 zamlı işaretler.",
    link: { href: "/moduller/giris-cikis", label: "Giriş-Çıkış & Mesai modülü" },
  },
  {
    stat: { prefix: "%3–", to: 9, suffix: "" },
    statLabel: "ortalama restoran net kâr marjı",
    title: "Kâr marjı dar — işgücü maliyeti sürprizi kaldırmaz",
    body: "Sektör analizlerine göre restoran ve kafelerde ortalama net kâr marjı %3–9 bandındadır; gelirin yaklaşık üçte biri işgücüne gider. Bu kadar dar marjda planlanmamış fazla mesai, doğrudan kârdan yer.",
    source: { label: "Toast — Average Restaurant Profit Margin (sektör analizi)", url: "https://pos.toasttab.com/blog/on-the-line/average-restaurant-profit-margin" },
    solution: "Shift fazla mesai eşiği yaklaşırken uyarır ve mesaiyi İş Kanunu'na göre hesaplar — ay sonu bordro sürprizi yerine planlı işgücü maliyeti.",
    link: { href: "/moduller/vardiya", label: "Vardiya & Planlama modülü" },
  },
  {
    title: "Personel devri yüksek — her ayrılık yeniden eğitim demek",
    body: "Türkiye'de perakende ve hizmet sektörleri, personel devir hızının en yüksek seyrettiği alanlar arasında gösterilir; kafe ve restoranlar bu grupta yer alır (organize perakende üzerine akademik çalışmalar bu ilişkiyi inceler). Sürekli yeni eleman, sürekli eğitim maliyeti ve operasyon bilgisinin kapıdan çıkması demektir.",
    source: {
      label: "Ciro ve Personel Devir Hızı İlişkisi — akademik çalışma (organize perakende, Türkiye)",
      url: "https://www.researchgate.net/publication/264129664_Ciro_ve_Personel_Devir_Hizi_Iliskisi_-_Revenue_and_Turnover_Relation",
    },
    solution: "Shift'in davetle katılım, şeffaf vardiya programı ve vardiya havuzu esnekliği, yeni personelin hızla uyum sağlamasını ve ekipte kalmasını hedefler.",
    link: { href: "/moduller/vardiya-havuzu", label: "Vardiya Havuzu modülü" },
  },
  {
    title: "Dağınık araçlar zaman yer: WhatsApp + Excel + kağıt",
    body: "Bu bir istatistik değil, sahadan bir gözlem: vardiya bir WhatsApp grubunda, puantaj Excel'de, hijyen kaydı deftere tutulunca aynı bilgi üç yerde yaşar — biri güncellenir, ikisi eski kalır. Aradaki fark hata, tartışma ve kayıp zaman olarak geri döner.",
    source: { label: "Niteliksel gözlem — sayı iddiası yok", url: "" },
    solution: "Shift bu üç aracı tek platformda birleştirir: program yayınlanır, giriş-çıkış kaydedilir, checklist doldurulur — tek doğru kaynak.",
    link: { href: "/moduller", label: "Tüm modüller" },
  },
];

const SOURCES = [
  { label: "4857 sayılı İş Kanunu — T.C. Mevzuat Bilgi Sistemi", url: "https://www.mevzuat.gov.tr/mevzuatmetin/1.5.4857.pdf" },
  { label: "Toast — Average Restaurant Profit Margin (2025 verileri, İngilizce)", url: "https://pos.toasttab.com/blog/on-the-line/average-restaurant-profit-margin" },
  {
    label: "Ciro ve Personel Devir Hızı İlişkisi — ResearchGate (organize perakende, Türkiye)",
    url: "https://www.researchgate.net/publication/264129664_Ciro_ve_Personel_Devir_Hizi_Iliskisi_-_Revenue_and_Turnover_Relation",
  },
];

export default function CafeGuidePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--color-paper)] pb-12 pt-28 lg:pt-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-8%] h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
          <span className="anim-rise inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] shadow-sm" style={{ animationDelay: "40ms" }}>
            <BookOpen size={14} className="text-[var(--color-signal-deep)]" /> Kaynaklar · Rehber
          </span>
          <h1 className="anim-rise font-display mt-5 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink)] sm:text-5xl" style={{ animationDelay: "120ms" }}>
            Kafe Operasyonu Rehberi: Verilerle Ekip Yönetimi
          </h1>
          <p className="anim-rise mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]" style={{ animationDelay: "200ms" }}>
            Bağımsız kafe işletmek zor. Sektör verileri ve mevzuat sorunları gösteriyor; Shift çözümü
            sunuyor. Aşağıdaki her veri, görünür kaynağıyla birlikte.
          </p>

          {/* Şeffaflık kutusu — sayfanın dürüstlük sözleşmesi */}
          <div className="anim-rise mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-[var(--color-line)] bg-[var(--color-cream)]/60 p-4" style={{ animationDelay: "280ms" }}>
            <Info size={18} className="mt-0.5 shrink-0 text-[var(--color-signal-deep)]" />
            <p className="text-sm leading-relaxed text-[var(--color-muted)]">
              <strong className="text-[var(--color-ink)]">Şeffaflık notu:</strong>{" "}Bu rehberdeki veriler
              resmi mevzuata ve üçüncü taraf araştırmalara dayanır — kendi anketimiz henüz yok.
              Pilot kafelerimizden gerçek veri geldikçe bu sayfa kendi bulgularımızla güncellenecek.
            </p>
          </div>
        </div>
      </section>

      {/* Insight kartları */}
      <section className="bg-[var(--color-paper-deep)] py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <RevealStagger className="space-y-6" stagger={0.08}>
            {INSIGHTS.map((ins) => (
              <RevealItem key={ins.title}>
                <article className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-card)] sm:p-9">
                  <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:gap-9">
                    {ins.stat ? (
                      <div className="sm:w-40">
                        <p className="font-display text-5xl font-extrabold leading-none text-[var(--color-signal-deep)]">
                          <CountUp to={ins.stat.to} prefix={ins.stat.prefix ?? ""} suffix={ins.stat.suffix} />
                        </p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                          {ins.statLabel}
                        </p>
                      </div>
                    ) : (
                      <div className="hidden sm:block sm:w-40">
                        <p className="font-display text-2xl font-extrabold leading-snug text-[var(--color-muted)]/60">
                          Sahadan gözlem
                        </p>
                      </div>
                    )}
                    <div>
                      <h2 className="font-display text-xl font-extrabold leading-snug text-[var(--color-ink)]">
                        {ins.title}
                      </h2>
                      <p className="mt-3 text-[15px] leading-relaxed text-[var(--color-muted)]">{ins.body}</p>
                      {ins.source.url ? (
                        <a
                          href={ins.source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-signal-deep)] underline decoration-[var(--color-signal)]/40 underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
                        >
                          Kaynak: {ins.source.label} <ExternalLink size={12} />
                        </a>
                      ) : (
                        <p className="mt-3 text-xs font-semibold text-[var(--color-muted)]">{ins.source.label}</p>
                      )}
                      <div className="mt-5 rounded-xl bg-[var(--color-cream)]/60 p-4">
                        <p className="text-sm leading-relaxed text-[var(--color-ink)]">
                          <strong className="font-display">Shift bunu nasıl çözer:</strong>{" "}{ins.solution}
                        </p>
                        <Link
                          href={ins.link.href}
                          className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-signal-deep)] transition-colors hover:text-[var(--color-ink)]"
                        >
                          {ins.link.label} <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* Kaynak listesi — şeffaflık = güven */}
      <section className="bg-[var(--color-paper)] py-14 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <Reveal>
            <h2 className="font-display text-xl font-extrabold text-[var(--color-ink)]">Kaynaklar</h2>
            <ul className="mt-4 space-y-2.5">
              {SOURCES.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-start gap-2 text-sm text-[var(--color-muted)] underline decoration-[var(--color-line-strong)] underline-offset-4 transition-colors hover:text-[var(--color-ink)]"
                  >
                    <ExternalLink size={14} className="mt-0.5 shrink-0" /> {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-[var(--color-muted)]">
              Üçüncü taraf kaynakların içerikleri kendi yayıncılarına aittir; erişim tarihi Temmuz 2026.
              Mevzuat yorumu değildir — yasal yükümlülükler için resmi metin esastır.
            </p>
          </Reveal>
        </div>
      </section>

      <CtaBand title="Veriler sorunu gösteriyor; çözüm hazır." sub="Vardiya, mesai ve görev takibini tek platformda topla — İş Kanunu limitlerini Shift takip etsin." />
    </main>
  );
}
