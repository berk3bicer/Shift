import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMe, getMyTimeClocks } from "@/lib/api-server";
import StaffClock from "@/components/staff/StaffClock";

// Staff Giriş-Çıkış. branchId /me'den (birincil şube), kayıtlar /timeclocks/mine.
export default async function StaffClockPage() {
  const [me, records] = await Promise.all([getMe(), getMyTimeClocks()]);

  return (
    <div className="space-y-4">
      <Link href="/today" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Bugün
      </Link>
      <h1 className="font-display text-xl font-bold text-ink">Giriş / Çıkış</h1>
      <StaffClock branchId={me.branchId} initialRecords={records} />
    </div>
  );
}
