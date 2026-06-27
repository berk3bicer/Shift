import { getBranches, getMe, getShifts, getTimeOffRequests, getShiftNotes, getStaff, getPositions } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import DashboardBoard from "@/components/dashboard/DashboardBoard";

export const metadata = {
  title: "Ana Sayfa | Shift",
};

export default async function DashboardPage() {
  const branches = await getBranches();
  if (branches.length === 0) {
    return <div className="p-4 text-rose-500">Önce bir şube eklemelisiniz.</div>;
  }
  
  const branch = (await selectBranch(branches))!;
  const me = await getMe();

  const todayIso = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  // Günün başı ve sonu ISO (Shift sorgusu için)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Paralel Veri Çekimi
  const [shifts, timeOffs, notes, staff, positions] = await Promise.all([
    getShifts(branch.id, startOfDay.toISOString(), endOfDay.toISOString()),
    getTimeOffRequests(),
    getShiftNotes(branch.id, todayIso),
    getStaff(),
    getPositions()
  ]);

  // Sadece bekleyen (status === 0) izinleri filtrele
  const pendingTimeOffs = timeOffs.filter(t => t.status === 0);

  return (
    <DashboardBoard 
      branch={branch}
      todayShifts={shifts}
      pendingTimeOffs={pendingTimeOffs}
      recentNotes={notes}
      staffList={staff}
      positions={positions}
      userName={me.name ?? ""}
      todayStr={todayIso}
    />
  );
}
