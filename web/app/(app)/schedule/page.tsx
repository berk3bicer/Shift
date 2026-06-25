import Link from "next/link";
import { redirect } from "next/navigation";
import { getBranches, getShifts, ApiError } from "@/lib/api-server";
import { mondayOf, addDaysIso, rangeForWeek } from "@/lib/date";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";

type SearchParams = { branchId?: string; week?: string };

// Vardiya çizelgesi (salt okuma). Tümü SUNUCUDA: şubeleri + seçili haftanın vardiyalarını
// .NET'ten doğrudan çeker, grid'i render eder. Şube/hafta navigasyonu link tabanlı
// (searchParams) → ekstra client JS yok. Sürükle-bırak 2. adımda gelir.
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

  if (branches.length === 0) {
    return <p className="text-sm text-gray-500">Henüz şube yok. Önce bir şube oluşturun.</p>;
  }

  const branchId = sp.branchId && branches.some((b) => b.id === sp.branchId)
    ? sp.branchId
    : branches[0].id;
  const weekStart = sp.week ?? mondayOf(new Date());

  const { startIso, endIso } = rangeForWeek(weekStart);
  let shifts;
  try {
    shifts = await getShifts(branchId, startIso, endIso);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

  const hrefFor = (bId: string, week: string) =>
    `/schedule?branchId=${bId}&week=${week}`;
  const prevWeek = addDaysIso(weekStart, -7);
  const nextWeek = addDaysIso(weekStart, 7);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-900">Vardiya Çizelgesi</h1>

        {/* Hafta navigasyonu */}
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={hrefFor(branchId, prevWeek)}
            className="rounded-md border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100"
          >
            ← Önceki
          </Link>
          <span className="px-1 font-medium text-gray-700">{weekStart} haftası</span>
          <Link
            href={hrefFor(branchId, nextWeek)}
            className="rounded-md border border-gray-300 px-2 py-1 text-gray-700 hover:bg-gray-100"
          >
            Sonraki →
          </Link>
        </div>
      </div>

      {/* Şube seçimi */}
      {branches.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <Link
              key={b.id}
              href={hrefFor(b.id, weekStart)}
              className={`rounded-full px-3 py-1 text-sm ${
                b.id === branchId
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <ScheduleGrid shifts={shifts} weekStartIso={weekStart} />
    </div>
  );
}
