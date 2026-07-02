import { Plus } from "lucide-react";

// İmza öğe: canlı haftalık vardiya çizelgesi (statik resim DEĞİL — gerçek DOM).
// Bloklar SAF CSS keyframe (.anim-settle + stagger animationDelay) ile sırayla "yerine oturur".
// JS/hydration'a bağlı değil → arka planda yüklenen sekmede bile görünür. reduced-motion kapatır.
// Kart yumuşak gölge + hafif perspektifle "floating app-screenshot" gibi kaldırılır.

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const SLOT_HOURS = [7, 9, 11, 13, 15, 17, 19];

type Role = "barista" | "kasiyer" | "komi";
type Block = { day: number; start: number; span: number; role: Role; name: string };

const BLOCKS: Block[] = [
  { day: 0, start: 0, span: 3, role: "barista", name: "Ayşe" },
  { day: 0, start: 2, span: 3, role: "komi", name: "Elif" },
  { day: 1, start: 0, span: 3, role: "barista", name: "Mehmet" },
  { day: 1, start: 2, span: 4, role: "kasiyer", name: "Can" },
  { day: 2, start: 1, span: 3, role: "kasiyer", name: "Zeynep" },
  { day: 2, start: 3, span: 3, role: "komi", name: "Elif" },
  { day: 3, start: 0, span: 3, role: "barista", name: "Ayşe" },
  { day: 3, start: 3, span: 3, role: "kasiyer", name: "Burak" },
  { day: 4, start: 1, span: 3, role: "barista", name: "Mehmet" },
  { day: 4, start: 4, span: 2, role: "komi", name: "Elif" },
  { day: 5, start: 2, span: 3, role: "kasiyer", name: "Zeynep" },
];

const ROLE_VAR: Record<Role, string> = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
};

const hours = (start: number, span: number) => `${SLOT_HOURS[start]}–${SLOT_HOURS[start + span]}`;

export default function ShiftGrid() {
  const slotCount = SLOT_HOURS.length - 1;

  return (
    <div
      className="[perspective:1600px]"
      role="img"
      aria-label="Haftalık vardiya çizelgesi örneği: barista, kasiyer ve komi vardiyaları gün ve saate göre renk kodlu bloklar halinde yerleşmiş."
    >
      <div
        className="anim-rise rounded-2xl border border-[var(--color-ink-line)] bg-gradient-to-b from-[var(--color-ink-soft)] to-[var(--color-ink)] p-4 shadow-[var(--shadow-float)] sm:p-5 lg:[transform:rotateY(-7deg)_rotateX(3deg)]"
        style={{ transformStyle: "preserve-3d", animationDelay: "220ms" }}
      >
        {/* Kart başlığı */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
            <span className="font-display text-sm font-semibold text-white">Bu Hafta · Merkez Şube</span>
          </div>
          <span className="rounded-full bg-[var(--color-barista)]/15 px-2 py-0.5 font-mono text-[10px] text-[var(--color-barista)]">
            Yayında
          </span>
        </div>

        {/* Izgara */}
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `auto repeat(${DAYS.length}, minmax(0, 1fr))`,
            gridTemplateRows: `auto repeat(${slotCount}, 34px)`,
          }}
        >
          <div />
          {DAYS.map((d) => (
            <div key={d} className="pb-1 text-center font-display text-[11px] font-medium text-white/55" aria-hidden="true">
              {d}
            </div>
          ))}

          {SLOT_HOURS.slice(0, slotCount).map((t, i) => (
            <div
              key={t}
              className="pr-2 text-right font-mono text-[10px] leading-none text-white/35"
              style={{ gridColumn: 1, gridRow: i + 2, alignSelf: "start", marginTop: "-4px" }}
              aria-hidden="true"
            >
              {String(t).padStart(2, "0")}:00
            </div>
          ))}

          {SLOT_HOURS.slice(0, slotCount).map((t, i) => (
            <div
              key={`line-${t}`}
              className="border-t border-white/5"
              style={{ gridColumn: `2 / span ${DAYS.length}`, gridRow: i + 2 }}
              aria-hidden="true"
            />
          ))}

          <div
            className="flex items-center justify-center rounded-md border border-dashed border-white/15 text-[10px] text-white/30"
            style={{ gridColumn: 6, gridRow: "2 / span 1" }}
            aria-hidden="true"
          >
            <Plus size={11} className="mr-0.5" /> Aç vardiya
          </div>

          {/* Vardiya blokları — stagger ile yerleşir */}
          {BLOCKS.map((b, i) => (
            <div
              key={i}
              className="anim-settle flex flex-col justify-center overflow-hidden rounded-md px-1.5 py-0.5"
              style={{
                gridColumn: b.day + 2,
                gridRow: `${b.start + 2} / span ${b.span}`,
                backgroundColor: `color-mix(in srgb, ${ROLE_VAR[b.role]} 22%, var(--color-ink-soft))`,
                borderLeft: `3px solid ${ROLE_VAR[b.role]}`,
                animationDelay: `${400 + i * 65}ms`,
              }}
            >
              <span className="truncate text-[11px] font-semibold leading-tight text-white/90">{b.name}</span>
              <span className="truncate font-mono text-[9px] leading-tight text-white/50">
                {b.role} · {hours(b.start, b.span)}
              </span>
            </div>
          ))}
        </div>

        {/* Lejant */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/5 pt-3">
          {(["barista", "kasiyer", "komi"] as Role[]).map((r) => (
            <span key={r} className="flex items-center gap-1.5 text-[11px] capitalize text-white/55">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ROLE_VAR[r] }} />
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
