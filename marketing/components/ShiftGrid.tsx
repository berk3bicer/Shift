import { Plus } from "lucide-react";

// İmza öğe: canlı haftalık vardiya çizelgesi (statik resim DEĞİL — gerçek DOM).
// Tur 4: AÇIK zeminli beyaz kart, bloklar PASTEL (kapkara değil). Hero'da fotoğrafın üstüne
// bindirilen "floating app kartı" (7shifts screenshot-over-photo deseni).
// Bloklar SAF CSS keyframe (.anim-settle + stagger) ile sırayla "yerine oturur" —
// JS/hydration'a bağlı değil → arka planda yüklenen sekmede bile görünür (Gün 34 dersi).

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

export default function ShiftGrid({ className = "" }: { className?: string }) {
  const slotCount = SLOT_HOURS.length - 1;

  return (
    <div
      className={`anim-float rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-float)] sm:p-4 ${className}`}
      style={{ animationDelay: "260ms" }}
      role="img"
      aria-label="Haftalık vardiya çizelgesi örneği: barista, kasiyer ve komi vardiyaları gün ve saate göre renk kodlu bloklar halinde yerleşmiş."
    >
      {/* Kart başlığı */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
          <span className="font-display text-sm font-bold text-[var(--color-ink)]">Bu Hafta · Merkez</span>
        </div>
        <span className="rounded-full bg-[var(--color-barista)]/12 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-barista)]">
          Yayında
        </span>
      </div>

      {/* Izgara */}
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `auto repeat(${DAYS.length}, minmax(0, 1fr))`,
          gridTemplateRows: `auto repeat(${slotCount}, 30px)`,
        }}
      >
        <div />
        {DAYS.map((d) => (
          <div key={d} className="pb-1 text-center font-display text-[11px] font-semibold text-[var(--color-muted)]" aria-hidden="true">
            {d}
          </div>
        ))}

        {SLOT_HOURS.slice(0, slotCount).map((t, i) => (
          <div
            key={t}
            className="pr-2 text-right font-mono text-[9px] leading-none text-[var(--color-muted)]/60"
            style={{ gridColumn: 1, gridRow: i + 2, alignSelf: "start", marginTop: "-3px" }}
            aria-hidden="true"
          >
            {String(t).padStart(2, "0")}:00
          </div>
        ))}

        {SLOT_HOURS.slice(0, slotCount).map((t, i) => (
          <div
            key={`line-${t}`}
            className="border-t border-[var(--color-line)]"
            style={{ gridColumn: `2 / span ${DAYS.length}`, gridRow: i + 2 }}
            aria-hidden="true"
          />
        ))}

        <div
          className="flex items-center justify-center rounded-md border border-dashed border-[var(--color-line-strong)] text-[10px] text-[var(--color-muted)]/70"
          style={{ gridColumn: 6, gridRow: "2 / span 1" }}
          aria-hidden="true"
        >
          <Plus size={11} className="mr-0.5" /> Aç
        </div>

        {/* Vardiya blokları — stagger ile yerleşir; PASTEL zemin + renkli sol şerit */}
        {BLOCKS.map((b, i) => (
          <div
            key={i}
            className="anim-settle flex flex-col justify-center overflow-hidden rounded-md px-1.5 py-0.5"
            style={{
              gridColumn: b.day + 2,
              gridRow: `${b.start + 2} / span ${b.span}`,
              backgroundColor: `color-mix(in srgb, ${ROLE_VAR[b.role]} 13%, white)`,
              borderLeft: `3px solid ${ROLE_VAR[b.role]}`,
              animationDelay: `${420 + i * 60}ms`,
            }}
          >
            <span className="truncate text-[11px] font-bold leading-tight text-[var(--color-ink)]">{b.name}</span>
            <span className="truncate font-mono text-[9px] leading-tight text-[var(--color-muted)]">
              {hours(b.start, b.span)}
            </span>
          </div>
        ))}
      </div>

      {/* Lejant */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--color-line)] pt-3">
        {(["barista", "kasiyer", "komi"] as Role[]).map((r) => (
          <span key={r} className="flex items-center gap-1.5 text-[11px] font-medium capitalize text-[var(--color-muted)]">
            <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ROLE_VAR[r] }} />
            {r}
          </span>
        ))}
      </div>
    </div>
  );
}
