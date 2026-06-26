import { getTimeOffRequests, getStaff } from "@/lib/api-server";
import TimeOffBoard from "@/components/timeoff/TimeOffBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "İzin Yönetimi | Shift",
};

// Sunucu tarafında personelleri ve izin taleplerini çeker
export default async function TimeOffPage() {
  const [requests, staff] = await Promise.all([
    getTimeOffRequests(),
    getStaff(),
  ]);

  return (
    <TimeOffBoard
      initialRequests={requests}
      staff={staff}
    />
  );
}
