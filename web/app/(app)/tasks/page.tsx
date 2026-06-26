import Link from "next/link";
import { redirect } from "next/navigation";
import { getBranches, getTasks, getStaff, ApiError } from "@/lib/api-server";
import TaskBoard from "@/components/tasks/TaskBoard";

type SearchParams = { branchId?: string };

// Görev/Kanban panosu. Server: şubeleri + seçili şubenin görevlerini + ekibi çeker.
// Şube seçimi link tabanlı (searchParams). Board (client) sürükle-taşı + oluştur yapar.
export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  let branches;
  try {
    branches = await getBranches();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }
  if (branches.length === 0) {
    return <p className="text-sm text-gray-500">Henüz şube yok.</p>;
  }

  const branchId =
    sp.branchId && branches.some((b) => b.id === sp.branchId) ? sp.branchId : branches[0].id;

  let tasks;
  let staff;
  try {
    [tasks, staff] = await Promise.all([getTasks(branchId), getStaff()]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

  return (
    <div className="space-y-4">
      {branches.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => (
            <Link
              key={b.id}
              href={`/tasks?branchId=${b.id}`}
              className={`rounded-full px-3 py-1 text-sm ${
                b.id === branchId
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {b.name}
            </Link>
          ))}
        </div>
      )}

      <TaskBoard key={branchId} initialTasks={tasks} branchId={branchId} staff={staff} />
    </div>
  );
}
