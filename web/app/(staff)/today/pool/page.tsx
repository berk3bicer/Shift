import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMe, getShiftPool, getMyShifts } from "@/lib/api-server";
import { mondayOf, addDaysIso } from "@/lib/date";
import StaffPool from "@/components/staff/StaffPool";

// Staff Vardiya Havuzu. "Sun" için kendi YAYINDAKİ (status=1) vardiyalarım gerekir →
// getMyShifts (self-read ucu). "Kap" için havuz listesi → getShiftPool.
export default async function StaffPoolPage() {
  const weekStart = mondayOf(new Date());
  const rangeStart = `${weekStart}T00:00:00.000Z`;
  const rangeEnd = `${addDaysIso(weekStart, 28)}T00:00:00.000Z`;

  const [me, pool, myShifts] = await Promise.all([
    getMe(),
    getShiftPool(),
    getMyShifts(rangeStart, rangeEnd),
  ]);

  // Yalnızca Yayında (1) vardiyalar sunulabilir (Taslak sunulamaz, zaten Havuzda/Dolduruldu değil).
  const offerable = myShifts.filter((s) => s.status === 1);

  return (
    <div className="space-y-4">
      <Link href="/today" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Bugün
      </Link>
      <h1 className="font-display text-xl font-bold text-ink">Vardiya Havuzu</h1>
      <StaffPool offerable={offerable} pool={pool} myName={me.name} />
    </div>
  );
}
