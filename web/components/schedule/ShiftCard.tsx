import type { ShiftDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { formatTime } from "@/lib/date";

// Tek vardiya kartı: saat aralığı + atanan kişi (yoksa "Açık vardiya") + pozisyon
// (renk şeridiyle) + taslak/yayın rozeti. Salt okuma (sürükle-bırak 2. adım).
export default function ShiftCard({ shift }: { shift: ShiftDto }) {
  const color = shift.positionColor ?? "#9ca3af"; // pozisyon rengi yoksa gri
  const isDraft = shift.status === ShiftStatus.Draft;
  const isUnassigned = !shift.userId;

  return (
    <div
      className={`group relative rounded-xl border p-3 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isDraft
          ? "border-amber-200/60 bg-amber-50/50 hover:border-amber-300 hover:bg-amber-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <div className="mb-1 flex items-center justify-between">
        <div className="font-semibold tracking-tight text-slate-900">
          {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
        </div>
        {isDraft && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-800 ring-1 ring-inset ring-amber-500/20">
            Taslak
          </span>
        )}
      </div>

      <div className={`truncate font-medium ${isUnassigned ? "text-slate-400 italic" : "text-slate-700"}`}>
        {shift.userFullName ?? "Açık vardiya"}
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className="truncate text-xs font-medium text-slate-500">
          {shift.positionName}
        </span>
      </div>
    </div>
  );
}
