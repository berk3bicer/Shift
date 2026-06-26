import { getTimeClocks, getStaff } from "@/lib/api-server";
import TimeClockBoard from "@/components/timeclock/TimeClockBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puantaj Yönetimi | Shift",
};

export default async function TimeClockPage() {
  const branchId = "b1"; // Sabit mock branch

  const [clocks, staff] = await Promise.all([
    getTimeClocks(branchId, false),
    getStaff(),
  ]);

  return (
    <TimeClockBoard
      initialClocks={clocks}
      branchId={branchId}
      staff={staff}
    />
  );
}
