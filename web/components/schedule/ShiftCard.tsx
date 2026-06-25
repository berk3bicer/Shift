import type { ShiftDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { formatTime } from "@/lib/date";

// Tek vardiya kartı: saat aralığı + atanan kişi (yoksa "Açık vardiya") + pozisyon
// (renk şeridiyle) + taslak/yayın rozeti. Salt okuma (sürükle-bırak 2. adım).
export default function ShiftCard({ shift }: { shift: ShiftDto }) {
  const color = shift.positionColor ?? "#9ca3af"; // pozisyon rengi yoksa gri
  const isDraft = shift.status === ShiftStatus.Draft;

  return (
    <div
      className="rounded-md border border-gray-200 bg-white p-2 text-xs shadow-sm"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="font-medium text-gray-900">
        {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
      </div>
      <div className="truncate text-gray-700">
        {shift.userFullName ?? <span className="text-gray-400">Açık vardiya</span>}
      </div>
      <div className="mt-1 flex items-center justify-between">
        <span className="truncate text-gray-500">{shift.positionName}</span>
        {isDraft && (
          <span className="ml-1 rounded bg-amber-100 px-1 text-[10px] text-amber-700">
            Taslak
          </span>
        )}
      </div>
    </div>
  );
}
