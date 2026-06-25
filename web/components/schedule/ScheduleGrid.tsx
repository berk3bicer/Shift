import type { ShiftDto } from "@/lib/types";
import { weekDays, shiftDay, formatTime } from "@/lib/date";
import ShiftCard from "./ShiftCard";

// Haftalık çizelge: 7 gün sütunu (Pzt..Paz), her güne o günün vardiya kartları.
// Salt okuma. Vardiyalar gün + başlangıç saatine göre sıralı.
export default function ScheduleGrid({
  shifts,
  weekStartIso,
}: {
  shifts: ShiftDto[];
  weekStartIso: string;
}) {
  const days = weekDays(weekStartIso);

  // Günlere grupla (startTime'ın tarih kısmına göre).
  const byDay = new Map<string, ShiftDto[]>();
  for (const s of shifts) {
    const key = shiftDay(s.startTime);
    (byDay.get(key) ?? byDay.set(key, []).get(key)!).push(s);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => formatTime(a.startTime).localeCompare(formatTime(b.startTime)));
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayShifts = byDay.get(day.iso) ?? [];
        return (
          <div key={day.iso} className="rounded-lg bg-gray-100/60 p-2">
            <div className="mb-2 px-1">
              <div className="text-sm font-medium text-gray-900">{day.name}</div>
              <div className="text-xs text-gray-400">{day.label}</div>
            </div>
            <div className="space-y-2">
              {dayShifts.length === 0 ? (
                <div className="px-1 py-4 text-center text-xs text-gray-300">—</div>
              ) : (
                dayShifts.map((s) => <ShiftCard key={s.id} shift={s} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
