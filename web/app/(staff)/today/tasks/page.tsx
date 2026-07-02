import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getMyTasks } from "@/lib/api-server";
import StaffTasks from "@/components/staff/StaffTasks";

// Staff "Görevlerim" — GET /api/tasks/mine (kendine atanmış). İlerletme move ucundan.
export default async function StaffTasksPage() {
  const tasks = await getMyTasks();

  return (
    <div className="space-y-4">
      <Link href="/today" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ChevronLeft className="h-4 w-4" /> Bugün
      </Link>
      <h1 className="text-xl font-semibold text-gray-900">Görevlerim</h1>
      <StaffTasks initialTasks={tasks} />
    </div>
  );
}
