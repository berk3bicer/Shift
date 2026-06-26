import type { TaskDto } from "@/lib/types";
import { PRIORITY_LABEL, PRIORITY_BADGE, CATEGORY_LABEL } from "@/lib/taskMeta";
import { CalendarClock, GripVertical, MessageSquare } from "lucide-react";

// Kanban görev kartı (salt gösterim). Sürüklenebilirlik sarmalayan board'da.
export default function TaskCard({ task }: { task: TaskDto }) {
  const assigneeName = task.assignedUserName ?? task.assignedPositionName;
  const isPosition = !task.assignedUserName && task.assignedPositionName;
  
  // İsimden baş harf bulma (Avatar için)
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-gray-200/60 bg-white p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md">
      
      {/* Sürükleme Tutamacı (Grip) - Sadece Hover'da görünür */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-5 w-5 text-gray-400" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-gray-800 leading-snug">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide ${PRIORITY_BADGE[task.priority] ?? ""}`}>
          {PRIORITY_LABEL[task.priority] ?? ""}
        </span>
      </div>

      {task.description && (
        <p className="line-clamp-2 text-xs text-gray-500 leading-relaxed">{task.description}</p>
      )}

      <div className="mt-1 flex items-center justify-between">
        
        {/* Sol alt: Kategori ve (varsa) tarih/yorum ikonları */}
        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
          <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
            {CATEGORY_LABEL[task.category] ?? "Diğer"}
          </span>
          {/* Sahte Yorum ikonu (Gelecek faz için UI hazırlığı) */}
          <div className="flex items-center gap-1 opacity-60 hover:opacity-100 cursor-pointer">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>0</span>
          </div>
        </div>

        {/* Sağ alt: Avatar */}
        <div className="flex items-center gap-2">
          {assigneeName ? (
            <div 
              title={isPosition ? `${assigneeName} (Pozisyon)` : assigneeName}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-sm ring-2 ring-white ${isPosition ? "bg-indigo-400" : "bg-emerald-500"}`}
            >
              {getInitials(assigneeName)}
            </div>
          ) : (
            <div title="Atanmamış" className="flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-[10px] text-gray-400">
              ?
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
