import type { ShiftDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { formatTime } from "@/lib/date";

// Tek vardiya kartı: saat aralığı + atanan kişi (yoksa "Açık vardiya") + pozisyon.
// Pozisyon rengi SOL ŞERİT olarak (küçük nokta yerine) — sütunda göz gezdirirken
// renk kodu bir bakışta okunsun. Salt okuma (etkileşim üst sarmalayıcıda).
export default function ShiftCard({ shift }: { shift: ShiftDto }) {
  const color = shift.positionColor ?? "#a39889"; // pozisyon rengi yoksa nötr sıcak gri
  const isDraft = shift.status === ShiftStatus.Draft;
  const isUnassigned = !shift.userId;

  return (
    <div
      className={`group relative rounded-xl border border-l-4 p-3 text-sm shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float ${
        isDraft ? "border-line bg-cream/70" : "border-line bg-surface"
      }`}
      style={{ borderLeftColor: color }}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="font-mono text-[13px] font-semibold tracking-tight text-ink">
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
        </div>
        {isDraft && (
          <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-signal-deep">
            Taslak
          </span>
        )}
      </div>

      <div className={`truncate font-medium ${isUnassigned ? "italic text-faint" : "text-ink"}`}>
        {shift.userFullName ?? "Açık vardiya"}
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="truncate text-xs font-medium text-muted">
          {shift.positionName}
        </span>
      </div>
    </div>
  );
}
