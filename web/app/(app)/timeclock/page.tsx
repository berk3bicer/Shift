import { getTimeClocks, getStaff, getBranches, getMe } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import TimeClockBoard from "@/components/timeclock/TimeClockBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puantaj Yönetimi | Shift",
};

export default async function TimeClockPage() {
  const [branches, staff, me] = await Promise.all([getBranches(), getStaff(), getMe()]);
  const branch = await selectBranch(branches);
  if (!branch) {
    return <p className="text-sm text-muted">Henüz şube yok.</p>;
  }

  // Şubenin tüm puantaj kayıtları (yönetici görünümü).
  const clocks = await getTimeClocks(branch.id, false);

  return (
    <TimeClockBoard
      initialClocks={clocks}
      branchId={branch.id}
      meId={me.userId}
      meName={me.name ?? "Ben"}
    />
  );
}
