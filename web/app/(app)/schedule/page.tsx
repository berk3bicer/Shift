import Link from "next/link";
import { redirect } from "next/navigation";
import { getBranches, getShifts, getStaff, getPositions, ApiError } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import { mondayOf, addDaysIso, rangeForWeek } from "@/lib/date";
import ScheduleBoard from "@/components/schedule/ScheduleBoard";

type SearchParams = { week?: string };

// Vardiya çizelgesi. Şube global switcher'dan (cookie); hafta link-tabanlı (?week=).
export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  let branches;
  try {
    branches = await getBranches();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

  const branch = await selectBranch(branches);
  if (!branch) {
    return <p className="text-sm text-muted">Henüz şube yok. Önce bir şube oluşturun.</p>;
  }
  const branchId = branch.id;
  const weekStart = sp.week ?? mondayOf(new Date());

  const { startIso, endIso } = rangeForWeek(weekStart);
  let shifts;
  let staff;
  let positions;
  try {
    [shifts, staff, positions] = await Promise.all([
      getShifts(branchId, startIso, endIso),
      getStaff(),
      getPositions(),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

  const hrefFor = (week: string) => `/schedule?week=${week}`;
  const prevWeek = addDaysIso(weekStart, -7);
  const nextWeek = addDaysIso(weekStart, 7);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-lg font-bold text-ink">Vardiya Çizelgesi — {branch.name}</h1>

        <div className="flex items-center gap-2 text-sm">
          <Link href={hrefFor(prevWeek)} className="rounded-lg border border-line-strong bg-surface px-3 py-2 font-medium text-muted transition-colors hover:bg-paper-deep hover:text-ink">← Önceki</Link>
          <span className="px-1 font-mono text-xs font-medium text-muted">{weekStart} haftası</span>
          <Link href={hrefFor(nextWeek)} className="rounded-lg border border-line-strong bg-surface px-3 py-2 font-medium text-muted transition-colors hover:bg-paper-deep hover:text-ink">Sonraki →</Link>
        </div>
      </div>

      {/* key: şube/hafta değişince board state'i (optimistic) sıfırlanır */}
      <ScheduleBoard
        key={`${branchId}-${weekStart}`}
        initialShifts={shifts}
        weekStartIso={weekStart}
        branchId={branchId}
        staff={staff}
        positions={positions}
      />
      <p className="text-xs text-faint">
        İpucu: kartı <strong>sürükle</strong> → başka güne taşı · karta <strong>tıkla</strong> → kişi ata.
      </p>
    </div>
  );
}
