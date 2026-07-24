// İmza öğe: canlı haftalık vardiya çizelgesi (statik resim DEĞİL — gerçek DOM).
// Tur "mockup-sadakat": bu bileşen artık gerçek panelin (web/components/schedule/
// ScheduleBoard.tsx + ShiftCard.tsx) sadık bir MİNYATÜRÜ. Uydurma saat ızgarası KALDIRILDI.
// Panelden birebir taşınan kimlik:
//   • Gün sütunları (Pzt–Paz, 7 gün) + dikey kart listesi — bloklar saate göre konumlanmaz.
//   • Üç saat-dilimi bandı (Sabah/Gündüz/Akşam) panelin TIME_SLOTS zeminleriyle.
//   • Kart = ShiftCard: isim → saat (tabular-nums) → pozisyon; DÜZ zemin (pastel color-mix YOK,
//     panel bunu bilinçle eledi — çift kodlama gürültüsü); tek kimlik kanalı sol 3px şerit.
//   • Açık vardiya (italik + soluk), taslak kart (bg-cream — durum kodlaması), lejant YOK.
//   • font-mono YOK (panel kaldırdı, slashed zero istenmiyordu) — tabular-nums kaldı.
// İKİ BOYUT: Hero'da (fotoğraf üstüne bindirilmiş, dar) ve Modules'te (tint kutusu, geniş)
// aynı DOM. Uyum viewport'a değil BİLEŞENİN kendi genişliğine bağlı → @container sorgusuyla
// dar sarmalda daha küçük yazı/dolgu, geniş sarmalda biraz büyür. 7 sütun × dar hücrede
// tam "HH:MM–HH:MM" hiçbir boyutta sığmıyor → saat panelin sadık kısaltması "HH–HH" (tabular),
// isim/pozisyon truncate ile korunur; metin hiçbir sarmalda kırpılıp taşmaz (Hero.tsx'e dokunmadan).
// Kartlar SAF CSS keyframe (.anim-settle + stagger) ile sırayla "yerine oturur" —
// JS/hydration'a bağlı değil → arka planda yüklenen sekmede bile görünür (Gün 34 dersi).

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

type Role = "barista" | "kasiyer" | "komi";

const ROLE_VAR: Record<Role, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};
const ROLE_LABEL: Record<Role, string> = {
  barista: "Barista",
  kasiyer: "Kasiyer",
  komi: "Komi",
};

// Saat-dilimi bantları — panelin TIME_SLOTS sabitiyle birebir isim + zemin (§1.2).
// Zeminler panelde bg-cream/70 · bg-paper-deep/70 · bg-sage-soft/60 → marketing'de
// aynı token'ların beyaz üstüne color-mix karşılığı (kart yüzeyi var(--color-surface) beyaz).
const SLOTS = [
  { label: "Sabah", bg: "color-mix(in srgb, var(--color-cream) 70%, white)", heading: "text-[var(--color-signal-deep)]" },
  { label: "Gündüz", bg: "color-mix(in srgb, var(--color-paper-deep) 70%, white)", heading: "text-[var(--color-muted)]" },
  { label: "Akşam", bg: "color-mix(in srgb, var(--color-sage-soft) 60%, white)", heading: "text-[var(--color-sage-deep)]" },
] as const;

type Slot = 0 | 1 | 2;
type Card = {
  slot: Slot;
  day: number; // 0=Pzt … 6=Paz
  name: string | null; // null → açık vardiya
  role: Role;
  start: string; // "HH:MM"
  end: string;
  draft?: boolean;
};

// Gerçekçi kafe haftası — panelle tutarlı isimler (Ayşe/Mehmet/Zeynep/Can/Elif).
// Her dilimde ≥1 kart (üç bant da görünsün); bir açık vardiya (Paz/Gündüz),
// bir taslak (Cmt/Akşam — sage bandda krem kart görünür durur).
const CARDS: Card[] = [
  // Sabah
  { slot: 0, day: 0, name: "Ayşe", role: "barista", start: "07:00", end: "15:00" },
  { slot: 0, day: 1, name: "Mehmet", role: "barista", start: "07:00", end: "15:00" },
  { slot: 0, day: 2, name: "Zeynep", role: "kasiyer", start: "08:00", end: "16:00" },
  { slot: 0, day: 3, name: "Ayşe", role: "barista", start: "07:00", end: "15:00" },
  { slot: 0, day: 5, name: "Can", role: "kasiyer", start: "08:00", end: "16:00" },
  // Gündüz
  { slot: 1, day: 0, name: "Can", role: "kasiyer", start: "11:00", end: "19:00" },
  { slot: 1, day: 2, name: "Elif", role: "komi", start: "12:00", end: "20:00" },
  { slot: 1, day: 4, name: "Mehmet", role: "barista", start: "11:00", end: "19:00" },
  { slot: 1, day: 5, name: "Elif", role: "komi", start: "12:00", end: "20:00" },
  { slot: 1, day: 6, name: null, role: "komi", start: "12:00", end: "18:00" }, // açık vardiya
  // Akşam
  { slot: 2, day: 1, name: "Elif", role: "komi", start: "15:00", end: "23:00" },
  { slot: 2, day: 3, name: "Can", role: "kasiyer", start: "16:00", end: "23:00" },
  { slot: 2, day: 4, name: "Ayşe", role: "barista", start: "15:00", end: "23:00" },
  { slot: 2, day: 5, name: "Zeynep", role: "kasiyer", start: "17:00", end: "23:00", draft: true }, // taslak
  { slot: 2, day: 6, name: "Mehmet", role: "barista", start: "16:00", end: "22:00" },
];

const hhShort = (t: string) => t.slice(0, 2);

export default function ShiftGrid({ className = "" }: { className?: string }) {
  let stagger = 0; // kartlar arası anim-settle gecikmesi için akan sayaç

  return (
    <div
      className={`@container anim-float rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-float)] sm:p-4 ${className}`}
      style={{ animationDelay: "260ms" }}
      role="img"
      aria-label="Haftalık vardiya çizelgesi örneği: barista, kasiyer ve komi vardiyaları Pazartesi'den Pazar'a gün sütunlarında, sabah, gündüz ve akşam dilimleri altında pozisyon renkli kartlar halinde listelenmiş; bir açık vardiya ve bir taslak dahil."
    >
      {/* Kart başlığı — panelin "Bu Hafta · Şube / Yayında" durumu */}
      <div aria-hidden="true" className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
          <span className="font-display text-sm font-bold text-[var(--color-ink)]">Bu Hafta · Merkez</span>
        </div>
        <span className="rounded-full bg-[var(--color-barista)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-barista)]">
          Yayında
        </span>
      </div>

      {/* Gün başlıkları — bant ızgaralarıyla aynı 7 sütun (hizalı) */}
      <div aria-hidden="true" className="mb-1 grid grid-cols-7 gap-0.5 @md:gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center font-display text-[9px] font-semibold text-[var(--color-muted)] @md:text-[11px]">
            {d}
          </div>
        ))}
      </div>

      {/* Üç saat-dilimi bandı — her biri panelin TIME_SLOTS zemini; içinde 7 gün sütunu */}
      <div aria-hidden="true" className="space-y-1">
        {SLOTS.map((slot, si) => (
          <div key={slot.label} className="rounded-lg p-1.5" style={{ backgroundColor: slot.bg }}>
            <div className={`mb-1 px-0.5 text-[9px] font-bold uppercase tracking-wide @md:text-[11px] ${slot.heading}`}>
              {slot.label}
            </div>
            <div className="grid grid-cols-7 items-start gap-0.5 @md:gap-1">
              {DAYS.map((_, day) => {
                const card = CARDS.find((c) => c.slot === si && c.day === day);
                if (!card) return <div key={day} />;
                const color = ROLE_VAR[card.role];
                const isOpen = card.name === null;
                const delay = 420 + stagger++ * 55;
                return (
                  <div
                    key={day}
                    className="anim-settle overflow-hidden rounded-md border border-l-[3px] border-[var(--color-line)] px-1 py-0.5 @md:rounded-lg @md:px-2 @md:py-1.5"
                    style={{
                      borderLeftColor: color,
                      backgroundColor: card.draft
                        ? "color-mix(in srgb, var(--color-cream) 88%, white)"
                        : "var(--color-surface)",
                      animationDelay: `${delay}ms`,
                    }}
                  >
                    <span
                      className={`block truncate text-[8px] font-medium leading-tight @md:text-[11px] ${
                        isOpen ? "italic text-[var(--color-muted)]/70" : "text-[var(--color-ink)]"
                      }`}
                    >
                      {card.name ?? "Açık vardiya"}
                    </span>
                    {/* Saat: panelin "HH:MM–HH:MM" değerinin sadık kısaltması "HH–HH" (tabular-nums);
                        7 dar sütunda tam saat sığmıyor, kısaltma her boyutta kırpılmadan durur. */}
                    <span className="mt-0.5 block truncate text-[8px] tabular-nums tracking-tight text-[var(--color-muted)] @md:text-[10px]">
                      {`${hhShort(card.start)}–${hhShort(card.end)}`}
                    </span>
                    <span className="block truncate text-[7px] text-[var(--color-muted)] @md:text-[10px]">
                      {ROLE_LABEL[card.role]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
