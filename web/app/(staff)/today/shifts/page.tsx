import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMyShifts } from "@/lib/api-server";
import { formatTime, mondayOf, addDaysIso } from "@/lib/date";

// Staff "Vardiyalarım" — salt-okuma. GET /api/shifts/mine (yalnızca kendi vardiyaları,
// UserId JWT'den). Pencere: bu haftanın Pazartesi'sinden +4 hafta.
const SHIFT_STATUS: Record<number, { label: string; cls: string }> = {
  0: { label: "Taslak", cls: "bg-gray-100 text-gray-500" },
  1: { label: "Yayında", cls: "bg-emerald-100 text-emerald-700" },
  2: { label: "Havuzda", cls: "bg-amber-100 text-amber-700" },
  3: { label: "Dolduruldu", cls: "bg-indigo-100 text-indigo-700" },
};

const WEEKDAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

export default async function StaffShiftsPage() {
  const weekStart = mondayOf(new Date());
  const rangeStart = `${weekStart}T00:00:00.000Z`;
  const rangeEnd = `${addDaysIso(weekStart, 28)}T00:00:00.000Z`;
  const shifts = await getMyShifts(rangeStart, rangeEnd);

  return (
    <div className="space-y-4">
      <Link href="/today" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ChevronLeft className="h-4 w-4" /> Bugün
      </Link>
      <h1 className="text-xl font-semibold text-gray-900">Vardiyalarım</h1>

      {shifts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Önümüzdeki 4 hafta için planlanmış vardiyan yok.
        </p>
      ) : (
        <ul className="space-y-2">
          {shifts.map((s) => {
            const st = SHIFT_STATUS[s.status];
            const d = new Date(s.startTime);
            const dayLabel = `${WEEKDAYS[d.getUTCDay()]} ${s.startTime.slice(8, 10)}.${s.startTime.slice(5, 7)}`;
            return (
              <li key={s.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900">{dayLabel}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${st?.cls ?? "bg-gray-100 text-gray-500"}`}>
                    {st?.label ?? "—"}
                  </span>
                </div>
                <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.positionColor ?? "#94a3b8" }}
                  />
                  {s.positionName} • {formatTime(s.startTime)}–{formatTime(s.endTime)}
                </p>
                {s.notes && <p className="mt-1 text-xs text-gray-400">{s.notes}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
