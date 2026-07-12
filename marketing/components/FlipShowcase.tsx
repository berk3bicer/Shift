"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { ReactNode } from "react";
import Reveal from "./Reveal";
import Scribble from "./Scribble";

// Scroll-flip KANIT kartları (Tur 17). Kart Y ekseninde döner: viewport'a girerken
// ESKİ DÜNYA (DOM çizim: kağıt/mesaj grubu/defter) görünür, kart viewport ortasına
// gelene dek 180° dönüp GERÇEK ürün ekranına (screenshot) oturur — "bu böyleydi, artık bu".
// NOT: brief 0→180 der ama o kurguda kart merkezde ESKİ dünyada dinlenir (argüman ters
// biter); -180→0 ile dönüş AYNI, bitiş yüzü ürün. Ön yüz screenshot'lar mockup değil,
// vitrin tenant'ından çekilmiş çalışan panel (marketing/public/urun/).
//
// Reveal.tsx dersleri uygulanır: string variant YOK (obje/inline stil), reduced-motion'da
// içerik ASLA gizli kalmaz — dönüş yerine iki yüz YAN YANA gösterilir (bilgi kaybolmaz).

/* ── Eski dünya çizimleri — kasıtlı SOLUK/DAĞINIK: gri tonlar, eğik, düşük kontrast.
      Ön yüzün temiz ürün ekranıyla kontrast yaratır. Hepsi dekoratif (aria-hidden kökte). ── */

const OLD_INK = "#57534e"; // soluk kurşun kalem grisi
const OLD_FADE = "#a8a29e";

function OldPaper({ children, tilt = "-rotate-1" }: { children: ReactNode; tilt?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e7e5e1] p-4 sm:p-6">
      <div
        className={`relative max-h-full w-[88%] ${tilt} rounded-sm bg-[#f6f4ef] p-3 shadow-[0_10px_28px_-12px_rgb(60_55_50/0.45)] sm:p-5`}
        style={{ backgroundImage: "repeating-linear-gradient(transparent, transparent 26px, #dcd8d0 27px)" }}
      >
        {children}
      </div>
    </div>
  );
}

// 1 · Kağıda çizilmiş çizelge — karalanmış, silinmiş, okla düzeltilmiş.
function OldSchedule() {
  const rows = [
    { name: "Ayşe", cells: ["S", "S", "—", "A", "S", "?", "—"], strike: false },
    { name: "Mehmet", cells: ["A", "—", "A", "A", "—", "S", "A"], strike: true },
    { name: "Zeynep", cells: ["—", "S", "S", "?", "A", "A", "—"], strike: false },
    { name: "Can", cells: ["S", "A", "—", "S", "S", "—", "?"], strike: false },
  ];
  return (
    <OldPaper>
      <p className="font-script text-lg font-bold" style={{ color: OLD_INK }}>
        HAFTALIK VARDİYA <span className="text-sm line-through decoration-2" style={{ color: OLD_FADE }}>(son hali??)</span>
      </p>
      <table className="mt-2 w-full border-collapse">
        <thead>
          <tr>
            <th />
            {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
              <th key={d} className="border border-[#c9c4ba] px-1 py-0.5 font-script text-xs font-semibold" style={{ color: OLD_INK }}>
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className={r.strike ? "relative" : ""}>
              <td className={`border border-[#c9c4ba] px-1.5 py-1 font-script text-sm font-bold ${r.strike ? "line-through decoration-[3px]" : ""}`} style={{ color: r.strike ? OLD_FADE : OLD_INK }}>
                {r.name}
              </td>
              {r.cells.map((c, i) => (
                <td key={i} className="border border-[#c9c4ba] px-1 py-1 text-center font-script text-sm" style={{ color: c === "?" ? "#b45309" : OLD_INK, opacity: c === "—" ? 0.35 : 0.8 }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 font-script text-sm" style={{ color: "#b45309" }}>
        → Mehmet ayrıldı!! Cmt kim kapatıyor???
      </p>
      {/* kahve halkası lekesi */}
      <span className="absolute -right-2 top-3 h-14 w-14 rounded-full border-[5px] border-[#c8b8a4]/50" />
    </OldPaper>
  );
}

// 2 · Mesaj grubu kaosu — jenerik sohbet görünümü (marka YOK), gece yarısı vardiya pazarlığı.
function OldChat() {
  const msgs = [
    { me: false, text: "Abi ben yarın gelemiyorum, yerime bakan olur mu 🙏", time: "23:47" },
    { me: false, text: "Sabah kim açıyor?? Çizelge değişti mi", time: "06:12" },
    { me: true, text: "vardiya_SON_final2.xlsx 📎", time: "06:30" },
    { me: false, text: "O eski liste bende başkası var", time: "06:31" },
  ];
  return (
    <div className="flex h-full w-full items-center justify-center bg-[#e2e0dc] p-4 sm:p-6">
      <div className="w-[82%] -rotate-1 rounded-xl bg-[#efedea] p-3 shadow-[0_10px_28px_-12px_rgb(60_55_50/0.45)]">
        <div className="mb-2 flex items-center justify-between border-b border-[#d4d0c9] pb-1.5">
          <span className="text-xs font-bold" style={{ color: OLD_INK }}>Kafe Ekip Grubu</span>
          <span className="rounded-full bg-[#d6d2cb] px-2 py-0.5 text-[10px] font-semibold" style={{ color: OLD_INK }}>
            +47 yeni mesaj
          </span>
        </div>
        <div className="space-y-1.5">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.me ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-2 py-1 text-[11px] leading-snug ${m.me ? "bg-[#d9d9cf]" : "bg-white/80"}`} style={{ color: OLD_INK }}>
                {m.text}
                <span className="ml-1.5 text-[9px]" style={{ color: OLD_FADE }}>{m.time}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-center font-script text-sm" style={{ color: "#b45309" }}>
          … kimin geleceği belli değil
        </p>
      </div>
    </div>
  );
}

// 3 · Defter + hesap makinesi — elle mesai toplamı, yanlış toplama.
function OldLedger() {
  return (
    <OldPaper tilt="rotate-1">
      <p className="font-script text-lg font-bold" style={{ color: OLD_INK }}>Mesai defteri — Haziran</p>
      <div className="mt-1 space-y-0.5 font-script text-base" style={{ color: OLD_INK }}>
        <p>Ayşe&ensp;42 + 9,5 = <span className="line-through decoration-2" style={{ color: OLD_FADE }}>50</span> 51,5 ??</p>
        <p>Mehmet&ensp;38 + 8 = 46</p>
        <p>Zeynep&ensp;44 + <span style={{ color: "#b45309" }}>?</span> = …</p>
        <p className="font-bold">
          TOPLAM: <span className="line-through decoration-[3px]" style={{ color: OLD_FADE }}>1.284</span>{" "}
          <span style={{ color: "#b45309" }}>tutmuyor!</span>
        </p>
      </div>
      {/* hesap makinesi */}
      <div className="absolute -bottom-3 -right-2 w-24 rotate-6 rounded-lg bg-[#78716c] p-2 shadow-lg">
        <div className="rounded-sm bg-[#cfd8c3] px-1.5 py-1 text-right font-mono text-xs font-bold text-[#3f4a38]">1.284,50</div>
        <div className="mt-1.5 grid grid-cols-4 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className="h-2.5 rounded-[3px] bg-[#a8a29e]" />
          ))}
        </div>
      </div>
    </OldPaper>
  );
}

// 4 · Tezgahta ıslanmış kağıt form — soluk baskı, eğreti tikler, su lekesi, kıvrık köşe.
function OldForm() {
  const items = ["Makine temizliği", "Vitrin kontrol", "Kasa sayımı", "Tuvalet kontrolü", "Çöp alanı"];
  return (
    <OldPaper tilt="rotate-[1.5deg]">
      <p className="text-center text-xs font-bold uppercase tracking-wide" style={{ color: OLD_FADE }}>
        Günlük Açılış Formu
      </p>
      <div className="mt-2 space-y-1.5">
        {items.map((t, i) => (
          <div key={t} className="flex items-center gap-2 text-xs" style={{ color: i > 2 ? OLD_FADE : OLD_INK }}>
            <span className="relative h-3.5 w-3.5 shrink-0 border" style={{ borderColor: OLD_FADE }}>
              {i < 3 && (
                <span className="absolute -top-1.5 left-0 font-script text-base font-bold" style={{ color: OLD_INK }}>✓</span>
              )}
            </span>
            <span className={i === 4 ? "line-through" : ""}>{t}</span>
            {i === 2 && <span className="font-script text-sm" style={{ color: OLD_FADE }}>saat?</span>}
          </div>
        ))}
      </div>
      <p className="mt-2 font-script text-sm" style={{ color: OLD_FADE }}>
        İmza: <span className="text-base">~~~~</span>&ensp;Tarih: …
      </p>
      {/* su lekesi + kıvrık köşe */}
      <span
        className="pointer-events-none absolute bottom-1 left-6 h-16 w-24 rounded-[50%] opacity-40"
        style={{ background: "radial-gradient(ellipse, #b8ab97 0%, transparent 70%)" }}
      />
      <span className="absolute bottom-0 right-0 h-0 w-0 border-b-[22px] border-l-[22px] border-b-[#d8d4cc] border-l-transparent" />
    </OldPaper>
  );
}

/* ── Kart verisi — metinler spec §1.3 "Temel Değer Önerisi" tablosundan. ── */

type Card = {
  key: string;
  no: string;
  title: string;
  claim: string;
  img: string;
  aria: string;
  old: ReactNode;
};

const CARDS: Card[] = [
  {
    key: "cizelge",
    no: "01",
    title: "Kağıt çizelge yerine sürükle-bırak",
    claim: "Karalanmış kağıtlar ve 'son hali hangisi?' kargaşası yerine renk kodlu, yayınlanınca herkese bildirilen dijital çizelge.",
    img: "/urun/vardiya.webp",
    aria: "Karşılaştırma: kağıda çizilmiş, karalanmış eski vardiya çizelgesi ile Shift'in renk kodlu, dolu haftalık dijital vardiya çizelgesi ekranı.",
    old: <OldSchedule />,
  },
  {
    key: "gorev",
    no: "02",
    title: "Mesaj grubu yerine görev panosu",
    claim: "Gece yarısı mesajlarında kaybolan işler yerine kim-ne-ne zaman belli, fotoğraf kanıtlı Kanban panosu.",
    img: "/urun/kanban.webp",
    aria: "Karşılaştırma: dağınık mesaj grubu konuşmaları ile Shift'in üç sütunlu görev panosu ekranı: yapılacak, devam eden ve tamamlanan kafe görevleri.",
    old: <OldChat />,
  },
  {
    key: "bordro",
    no: "03",
    title: "Hesap makinesi yerine otomatik mesai",
    claim: "Defterde tutmayan toplamlar yerine İş Kanunu'na göre otomatik hesaplanan, dönemi kilitlenen bordro tablosu.",
    img: "/urun/bordro.webp",
    aria: "Karşılaştırma: elle tutulmuş, toplamı yanlış mesai defteri ve hesap makinesi ile Shift'in hesaplanmış normal saat, fazla mesai ve brüt tutar kolonlu bordro ekranı.",
    old: <OldLedger />,
  },
  {
    key: "checklist",
    no: "04",
    title: "Islak kağıt form yerine dijital checklist",
    claim: "Tezgahta ıslanan, kimin ne zaman baktığı belli olmayan formlar yerine saat damgalı, kişi imzalı dijital kontrol listesi.",
    img: "/urun/checklist.webp",
    aria: "Karşılaştırma: tezgahta ıslanmış, yarım doldurulmuş kağıt kontrol formu ile Shift'in kim ve ne zaman bilgisiyle tamamlanmış dijital açılış kontrol listesi ekranı.",
    old: <OldForm />,
  },
];

/* ── Tek flip kart — her kart KENDİ ref'i ve scroll aboneliğiyle bağımsız. ── */

function FlipCard({ card }: { card: Card }) {
  const ref = useRef<HTMLDivElement>(null);
  // Tur 19: dönüş penceresi görünür alana çekildi. "start 0.75" = kartın ÜSTÜ
  // viewport'un %75'ine (alt %25'e) girdiğinde başla; "center 0.52" = kartın
  // ORTASI hafif merkez-üstüne geldiğinde bit. Kullanıcı KARTA BAKARKEN döner.
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.75", "center 0.52"] });
  // -180 (eski dünya) → 0 (ürün). Bitiş yüzü HER ZAMAN ürün ekranı.
  const rotateY = useTransform(scrollYProgress, [0, 1], [-180, 0]);
  // Sinematik 3D (Tur 19): dönüşün ORTASINDA kart öne gelip hafif tepeden eğilir,
  // gölge derinleşir → "havada dönen kart" hissi. Uçlarda yerine oturur.
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 6, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1.04, 1]);
  // box-shadow string interpolate edilemez → blur+y+alpha ayrı sürülüp template ile birleşir.
  const shadowBlur = useTransform(scrollYProgress, [0, 0.5, 1], [24, 60, 30]);
  const shadowY = useTransform(scrollYProgress, [0, 0.5, 1], [12, 34, 16]);
  const shadowAlpha = useTransform(scrollYProgress, [0, 0.5, 1], [0.18, 0.42, 0.22]);
  const boxShadow = useMotionTemplate`0px ${shadowY}px ${shadowBlur}px -12px rgba(40,35,30,${shadowAlpha})`;
  // will-change yalnız dönüş sürerken — bittiğinde tarayıcı katmanı serbest bırakır.
  const willChange = useTransform(scrollYProgress, (v) => (v > 0 && v < 1 ? "transform, box-shadow" : "auto"));

  return (
    <div ref={ref} role="img" aria-label={card.aria}>
      {/* perspective 900px + hafif üstten bakış → 3D belirgin, kart hacim kazanır. */}
      <div aria-hidden="true" style={{ perspective: "900px", perspectiveOrigin: "50% 40%" }}>
        <motion.div
          className="relative aspect-[16/10] w-full rounded-2xl"
          style={{ transformStyle: "preserve-3d", rotateY, rotateX, scale, boxShadow, willChange }}
        >
          {/* ÖN: gerçek panel ekranı — gölge artık dönen kabuktaki animasyonlu
              boxShadow'da (çift gölge olmasın diye buradan kaldırıldı). */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-[var(--color-line)]"
            style={{ backfaceVisibility: "hidden" }}
          >
            <img src={card.img} alt="" width={1600} height={1000} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          {/* ARKA: eski dünya */}
          <div
            className="absolute inset-0 overflow-hidden rounded-2xl border border-[#d6d3cd]"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            {card.old}
          </div>
        </motion.div>
      </div>
      <Caption card={card} />
    </div>
  );
}

function Caption({ card }: { card: Card }) {
  return (
    <div aria-hidden="true" className="mx-auto mt-6 max-w-2xl text-center">
      <p className="font-mono text-xs font-semibold tracking-widest text-[var(--color-muted)]">{card.no}</p>
      <h3 className="font-display mt-1 text-xl font-extrabold text-[var(--color-ink)] sm:text-2xl">{card.title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-[var(--color-muted)]">{card.claim}</p>
    </div>
  );
}

// reduced-motion: dönüş YOK — iki yüz YAN YANA (bilgi kaybolmaz, Tur 7 dersi).
// Sıra aria ile aynı: solda eski dünya, sağda Shift.
function StaticCard({ card }: { card: Card }) {
  return (
    <div role="img" aria-label={card.aria}>
      <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[#d6d3cd]">
          {card.old}
          <span className="absolute left-3 top-3 rounded-full bg-[#57534e]/80 px-2.5 py-0.5 text-[10px] font-bold text-white">Eskiden</span>
        </div>
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-[var(--color-line)] shadow-[var(--shadow-card)]">
          <img src={card.img} alt="" width={1600} height={1000} loading="lazy" decoding="async" className="h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-[var(--color-signal)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--color-ink)]">Shift&apos;te</span>
        </div>
      </div>
      <Caption card={card} />
    </div>
  );
}

/* ── Bölüm ── */

export default function FlipShowcase() {
  // Hydration tuzağı (Tur 17): SSR her zaman flip düzenini basar; reduce'a göre AĞAÇ
  // değiştirmek ilk istemci render'ında metin uyuşmazlığı → hydration hatası üretiyordu.
  // Çözüm: mount'a kadar SSR ile birebir aynı düzen, mount SONRASI reduce ise yan-yana.
  // İçerik hiçbir aşamada gizlenmez (flip düzeninde de eski-dünya yüzü görünürdür).
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const sideBySide = mounted && reduce;
  return (
    <section id="urun-gercekte" className="overflow-hidden bg-[var(--color-surface)] py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-sage-deep)]">
            Mockup değil, ürünün kendisi
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-4xl">
            Ürünü{" "}
            <span className="relative inline-block">
              <span className="font-script font-bold text-[var(--color-signal-deep)]">gerçekte</span>
              <Scribble shape="underline" className="absolute -bottom-1.5 left-0 w-full" delay={0.4} />
            </span>{" "}
            gör.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-[var(--color-muted)]">
            Aşağıdaki ekranlar çalışan panelden alındı — kaydırdıkça eski yöntem
            yerini Shift&apos;e bırakıyor.
          </p>
        </Reveal>

        <div className="mt-16 space-y-20 sm:mt-20 sm:space-y-28">
          {CARDS.map((c) => (sideBySide ? <StaticCard key={c.key} card={c} /> : <FlipCard key={c.key} card={c} />))}
        </div>

        {/* Personel tarafı — telefon çerçevesinde gerçek mobil görünüm */}
        <Reveal className="mt-24 sm:mt-32">
          <div className="grid items-center gap-10 sm:grid-cols-[auto_1fr] sm:gap-14">
            <div
              role="img"
              aria-label="Telefon ekranında Shift personel görünümü: Elif'in yayınlanmış haftalık barista vardiyaları listesi."
              className="justify-self-center"
            >
              <div aria-hidden="true" className="w-56 rounded-[2.2rem] border-[6px] border-[var(--color-ink)] bg-[var(--color-ink)] shadow-[var(--shadow-float)]">
                <div className="overflow-hidden rounded-[1.85rem]">
                  <img src="/urun/mobil.webp" alt="" width={780} height={1688} loading="lazy" decoding="async" className="h-auto w-full" />
                </div>
              </div>
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-display text-2xl font-extrabold leading-tight text-[var(--color-ink)] sm:text-3xl">
                Ekibin cebinde de aynı gerçek.
              </h3>
              <p className="mt-3 max-w-md text-lg leading-relaxed text-[var(--color-muted)]">
                Personel kendi telefonundan vardiyalarını, görevlerini ve izinlerini görür —
                çizelge yayınlanınca herkese anında bildirilir. Kimse &ldquo;bana söylenmedi&rdquo; demez.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
