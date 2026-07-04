import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMyTasks } from "@/lib/api-server";
import StaffTasks from "@/components/staff/StaffTasks";

// Staff "Görevlerim" — GET /api/tasks/mine (kendine atanmış). İlerletme move ucundan.
export default async function StaffTasksPage() {
  const tasks = await getMyTasks();

  return (
    <div className="space-y-4">
      <Link href="/today" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Bugün
      </Link>
      <h1 className="font-display text-xl font-bold text-ink">Görevlerim</h1>
      <StaffTasks initialTasks={tasks} />
    </div>
  );
}
