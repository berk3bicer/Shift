import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { TRUST } from "@/lib/content";
import Pricing from "@/components/Pricing";
import Reveal, { RevealStagger, RevealItem } from "@/components/Reveal";
import ScriptWord from "@/components/ScriptWord";
import CtaBand from "@/components/CtaBand";

// /fiyatlar — landing'deki Pricing bileşeni (spec 12.3 birebir) + güven kartları + SSS (Tur 7).
// SSS native <details>/<summary> — JS'siz, erişilebilir, reduced-motion sorunu yok.
// Cevaplar DÜRÜST: Faz 2/3 modülleri "gelince pakete dahil olur" diye anlatılır, "var" denmez.

export const metadata: Metadata = {
  title: "Fiyatlar — Shift",
  description:
    "Şube başına aylık fiyatlandırma: Başlangıç 499 TL, Büyüme 999 TL, Pro 1.799 TL. Gizli ücret yok, zorunlu üst paket yok. Pilot dönemi ücretsiz.",
};

const FAQ = [
  {
    q: "Fiyat şube başına mı, kişi başına mı?",
    a: "Şube başına, aylık. Paketler kullanıcı aralığıyla ayrılır: Başlangıç 1–10, Büyüme 1–30, Pro sınırsız kullanıcı. Kişi başına gizli ücret yok.",
  },
  {
    q: "Kurulum ne kadar sürer, teknik bilgi gerekir mi?",
    a: "Yaklaşık 10 dakika: şubeni aç, pozisyonları seç, ekibini davet linkiyle çağır. Teknik bilgi gerekmez — ilk vardiya programını aynı gün yayınlayabilirsin.",
  },
  {
    q: "Pilot programı nedir, gerçekten ücretsiz mi?",
    a: "İlk kafelerle birebir çalışıyoruz: kurulumdan ilk vardiyaya kadar yanında oluruz. Pilot dönemi tamamen ücretsiz ve taahhütsüz — ana sayfadaki formdan başvurabilirsin.",
  },
  {
    q: "Stok, tedarik ve hijyen modülleri fiyata dahil mi?",
    a: "Bu modüller henüz yayında değil — stok ve tedarik Faz 2'de, hijyen/HACCP Faz 3'te geliyor. Yayınlandıklarında tabloda göründükleri pakete ek ücretsiz dahil olacaklar. Bugün çalışan çekirdek: vardiya, görev/checklist, giriş-çıkış & mesai, vardiya havuzu ve duyurular.",
  },
  {
    q: "Verilerim nerede tutuluyor?",
    a: "Avrupa/Türkiye veri merkezinde, KVKK'ya uygun olarak. Verilerin yurt dışına, farklı hukuk bölgelerine gitmez.",
  },
  {
    q: "Paket değiştirmek istersem?",
    a: "İstediğin an üst pakete geçebilirsin; zorunlu üst paket ya da zorla yükseltme yok. İhtiyacın kadar modül, ihtiyacın kadar ödeme.",
  },
];

export default function PricingPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--color-paper)] pb-12 pt-28 lg:pt-36">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-[-8%] h-[24rem] w-[24rem] rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-5 text-center sm:px-8">
          <span className="anim-rise inline-block text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]" style={{ animationDelay: "40ms" }}>
            Fiyatlandırma
          </span>
          <h1 className="anim-rise font-display mx-auto mt-3 max-w-3xl text-4xl font-extrabold leading-[1.08] text-[var(--color-ink)] sm:text-5xl" style={{ animationDelay: "120ms" }}>
            Şube başına, aylık. <ScriptWord>Sürpriz yok.</ScriptWord>
          </h1>
          <p className="anim-rise mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]" style={{ animationDelay: "200ms" }}>
            Küçük kafeden büyüyen zincire — ihtiyacın kadar modül. Gizli ücret yok, zorunlu üst paket
            yok, pilot dönemi ücretsiz.
          </p>
        </div>
      </section>

      <Pricing hideHeader />

      {/* Güven şeridi */}
      <section className="bg-[var(--color-paper-deep)] py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <RevealStagger className="grid gap-4 md:grid-cols-3" stagger={0.08}>
            {TRUST.map((t) => (
              <RevealItem key={t.title}>
                <div className="flex h-full flex-col rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-barista)]/12 text-[var(--color-barista)]">
                    <ShieldCheck size={19} />
                  </span>
                  <h2 className="font-display mt-3 text-base font-bold text-[var(--color-ink)]">{t.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted)]">{t.detail}</p>
                </div>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      {/* SSS */}
      <section className="bg-[var(--color-paper)] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <Reveal className="text-center">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">SSS</span>
            <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
              Sık sorulanlar
            </h2>
          </Reveal>
          <RevealStagger className="mt-10 space-y-3" stagger={0.05}>
            {FAQ.map((f) => (
              <RevealItem key={f.q} y={20}>
                <details className="group rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-4 shadow-[var(--shadow-card)] open:pb-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-display text-base font-bold text-[var(--color-ink)]">
                    {f.q}
                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-cream)] text-[var(--color-signal-deep)] transition-transform duration-200 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">{f.a}</p>
                </details>
              </RevealItem>
            ))}
          </RevealStagger>
        </div>
      </section>

      <CtaBand title="Önce dene, sonra karar ver." sub="Pilot dönemi ücretsiz ve taahhütsüz — kurulumdan ilk vardiyaya birlikte geçelim." />
    </main>
  );
}
