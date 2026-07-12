import { getOvertimeRecords, getStaff } from "@/lib/api-server";
import PayrollBoard from "@/components/payroll/PayrollBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bordro | Shiftle",
};

export default async function PayrollPage() {
  const [records, staff] = await Promise.all([
    getOvertimeRecords(),
    getStaff(),
  ]);

  return (
    <div className="space-y-6">
      <PayrollBoard initialRecords={records} staff={staff} />
    </div>
  );
}
