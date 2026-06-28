import { getOvertimeSummary, getStaff } from "@/lib/api-server";
import OvertimeSummaryBoard from "@/components/reports/OvertimeSummaryBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raporlar | Shift",
};

export default async function ReportsPage() {
  // Backend summary ucu TEK personel hesaplar (userId zorunlu). Ekip tablosu için
  // her personel için paralel çağırıyoruz (Availability ile aynı N+1 deseni).
  // Dönem sabit: Haziran 2026 (demo). Tarihler date-only "yyyy-MM-dd".
  const from = "2026-06-01";
  const to = "2026-06-30";

  const staff = await getStaff();
  const summaries = await Promise.all(
    staff.map((s) => getOvertimeSummary(s.id, from, to))
  );

  return (
    <div className="space-y-6">
      <OvertimeSummaryBoard summaries={summaries} periodStart={from} periodEnd={to} />
    </div>
  );
}
