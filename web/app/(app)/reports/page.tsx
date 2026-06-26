import { getOvertimeSummary } from "@/lib/api-server";
import OvertimeSummaryBoard from "@/components/reports/OvertimeSummaryBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Raporlar | Shift",
};

export default async function ReportsPage() {
  const summary = await getOvertimeSummary();

  return (
    <div className="space-y-6">
      <OvertimeSummaryBoard summary={summary} />
    </div>
  );
}
