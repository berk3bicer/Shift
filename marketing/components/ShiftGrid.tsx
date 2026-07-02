// İmza öğe: canlı haftalık vardiya ızgarası. gün×saat grid, renk kodlu vardiya blokları
// (app'in gerçek pozisyon renkleri: barista/kasiyer/komi). Bloklar yüklenirken "yerleşir"
// (stagger fade+rise, globals.css .shift-block; prefers-reduced-motion → statik).
// Saf CSS animasyon — JS yok, server component olarak render edilir.

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const TIMES = ["07:00", "09:00", "11:00", "13:00", "15:00", "17:00", "19:00"];

type Role = "barista" | "kasiyer" | "komi";
type Block = { day: number; start: number; span: number; role: Role; name: string };

// Gerçekçi bir kafe haftası (Pzt–Cmt). start = saat dilimi indeksi (0 = 07:00).
const BLOCKS: Block[] = [
  { day: 0, start: 0, span: 3, role: "barista", name: "Ayşe" },
  { day: 0, start: 2, span: 3, role: "komi", name: "Elif" },
  { day: 0, start: 3, span: 3, role: "kasiyer", name: "Zeynep" },
  { day: 1, start: 0, span: 3, role: "barista", name: "Mehmet" },
  { day: 1, start: 1, span: 3, role: "kasiyer", name: "Can" },
  { day: 1, start: 3, span: 3, role: "komi", name: "Elif" },
  { day: 2, start: 0, span: 2, role: "komi", name: "Elif" },
  { day: 2, start: 1, span: 3, role: "barista", name: "Ayşe" },
  { day: 2, start: 3, span: 3, role: "kasiyer", name: "Zeynep" },
  { day: 3, start: 0, span: 3, role: "barista", name: "Mehmet" },
  { day: 3, start: 2, span: 3, role: "kasiyer", name: "Can" },
  { day: 3, start: 4, span: 2, role: "komi", name: "Elif" },
  { day: 4, start: 0, span: 4, role: "barista", name: "Ayşe" },
  { day: 4, start: 2, span: 4, role: "kasiyer", name: "Zeynep" },
  { day: 4, start: 3, span: 2, role: "komi", name: "Elif" },
  { day: 5, start: 1, span: 3, role: "barista", name: "Mehmet" },
  { day: 5, start: 1, span: 2, role: "komi", name: "Elif" },
  { day: 5, start: 3, span: 3, role: "kasiyer", name: "Can" },
];

const ROLE_VAR: Record<Role, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};

export default function ShiftGrid() {
  const slotCount = TIMES.length - 1; // saat çizgileri arası dilim sayısı

  return (
    <div
      className="rounded-2xl border border-[var(--color-ink-line)] bg-[var(--color-ink-soft)] p-4 shadow-2xl shadow-black/40 sm:p-5"
      role="img"
      aria-label="Haftalık vardiya çizelgesi örneği: barista, kasiyer ve komi vardiyaları gün ve saate göre renk kodlu bloklar halinde yerleşmiş."
    >
      {/* Kart başlığı — gerçek panel hissi */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
          <span className="font-display text-sm font-semibold text-white">Bu Hafta · Merkez Şube</span>
        </div>
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/70">
          Yayında
        </span>
      </div>

      {/* Izgara: 1 saat-ekseni kolonu + 6 gün kolonu; 1 başlık satırı + dilim satırları */}
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${DAYS.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${slotCount}, 34px)`,
        }}
        aria-hidden="true"
      >
        {/* Sol üst boşluk */}
        <div />
        {/* Gün başlıkları */}
        {DAYS.map((d) => (
          <div key={d} className="pb-1 text-center font-display text-[11px] font-medium text-white/55">
            {d}
          </div>
        ))}

        {/* Saat etiketleri (mono) — her dilimin başında */}
        {TIMES.slice(0, slotCount).map((t, i) => (
          <div
            key={t}
            className="pr-2 text-right font-mono text-[10px] leading-none text-white/35"
            style={{ gridColumn: 1, gridRow: i + 2, alignSelf: "start", marginTop: "-4px" }}
          >
            {t}
          </div>
        ))}

        {/* İnce yatay çizgiler (dilim ızgarası) */}
        {TIMES.slice(0, slotCount).map((t, i) => (
          <div
            key={`line-${t}`}
            className="border-t border-white/5"
            style={{ gridColumn: `2 / span ${DAYS.length}`, gridRow: i + 2 }}
          />
        ))}

        {/* Vardiya blokları */}
        {BLOCKS.map((b, i) => (
          <div
            key={i}
            className="shift-block flex flex-col justify-center overflow-hidden rounded-md px-1.5 py-0.5"
            style={{
              gridColumn: b.day + 2,
              gridRow: `${b.start + 2} / span ${b.span}`,
              backgroundColor: `color-mix(in srgb, ${ROLE_VAR[b.role]} 24%, transparent)`,
              borderLeft: `3px solid ${ROLE_VAR[b.role]}`,
              animationDelay: `${i * 55}ms`,
            }}
          >
            <span className="truncate text-[11px] font-semibold leading-tight text-white/90">{b.name}</span>
            <span className="truncate font-mono text-[9px] capitalize leading-tight text-white/45">{b.role}</span>
          </div>
        ))}
      </div>

      {/* Alt lejant */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-3">
        {(["barista", "kasiyer", "komi"] as Role[]).map((r) => (
          <span key={r} className="flex items-center gap-1.5 text-[11px] capitalize text-white/55">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ROLE_VAR[r] }} />
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
