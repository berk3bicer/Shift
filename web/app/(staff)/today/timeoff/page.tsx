import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMe, getMyTimeOffRequests } from "@/lib/api-server";
import StaffTimeOff from "@/components/staff/StaffTimeOff";

// Staff izin sayfası — kendi talep geçmişini server'da çeker (GET /mine), formu
// client component yönetir. Layout guard 401/rol yönlendirmesini zaten yapıyor.
export default async function StaffTimeOffPage() {
  const [me, requests] = await Promise.all([getMe(), getMyTimeOffRequests()]);

  return (
    <div className="space-y-4">
      <Link href="/today" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Bugün
      </Link>
      <StaffTimeOff userId={me.userId} initialRequests={requests} />
    </div>
  );
}
