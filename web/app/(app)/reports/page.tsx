import { getOvertimeSummary, getStaff } from "@/lib/api-server";
import OvertimeSummaryBoard from "@/components/reports/OvertimeSummaryBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raporlar | Shift",
};

export default async function ReportsPage() {
  // Backend summary ucu TEK personel hesaplar (userId zorunlu). Ekip tablosu için
  // her personel için paralel çağırıyoruz (Availability ile aynı N+1 deseni).
  // İçinde bulunulan ayın ilk ve son günü (date-only "yyyy-MM-dd"). Ay seçici Faz 2
  // (server component; seçici client'a çevirmeyi gerektirir — şimdilik doğru ay yeter).
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const pad = (n: number) => String(n).padStart(2, "0");
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const from = `${y}-${pad(m + 1)}-01`;
  const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`;

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
