import type { TaskDto } from "@/lib/types";
import { PRIORITY_LABEL, PRIORITY_BADGE, CATEGORY_LABEL } from "@/lib/taskMeta";

// Kanban görev kartı (salt gösterim). Sürüklenebilirlik sarmalayan board'da.
export default function TaskCard({ task }: { task: TaskDto }) {
  const assignee =
    task.assignedUserName ??
    (task.assignedPositionName ? `${task.assignedPositionName} (pozisyon)` : null);

  return (
    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm shadow-sm">
      <div className="mb-1 flex items-start justify-between gap-2">
        <span className="font-medium text-gray-900">{task.title}</span>
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] ${PRIORITY_BADGE[task.priority] ?? ""}`}>
          {PRIORITY_LABEL[task.priority] ?? ""}
        </span>
      </div>
      {task.description && (
        <p className="mb-2 line-clamp-2 text-xs text-gray-500">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">{CATEGORY_LABEL[task.category] ?? ""}</span>
        <span className="text-gray-600">
          {assignee ?? <span className="text-gray-300">Atanmamış</span>}
        </span>
      </div>
    </div>
  );
}
