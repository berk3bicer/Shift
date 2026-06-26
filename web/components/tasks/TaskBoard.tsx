"use client";

import { useState } from "react";
import type { StaffDto, TaskDto } from "@/lib/types";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/taskMeta";
import { useOptimisticList } from "@/lib/useOptimisticList";
import { moveTask } from "@/lib/api-client";
import { ClipboardList, LoaderCircle, CheckCircle2, Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";

// Kanban panosu: 3 kolon (Yapılacak/Devam/Tamamlandı). Kartı kolonlar arası sürükle →
// move (status). Optimistic+rollback ÇİZELGEYLE AYNI hook'tan (useOptimisticList).
// Kolon-only: intra-column sıralama yok (backend'de SortOrder yok).
export default function TaskBoard({
  initialTasks,
  branchId,
  staff,
}: {
  initialTasks: TaskDto[];
  branchId: string;
  staff: StaffDto[];
}) {
  const { items: tasks, setItems: setTasks, feedback, setFeedback, pendingId, mutate } =
    useOptimisticList<TaskDto>(initialTasks);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  function onDropCol(targetStatus: number) {
    const id = draggingId;
    setDraggingId(null);
    setOverCol(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === targetStatus) return; // aynı kolon = no-op (400'e girme)
    mutate({
      id,
      optimistic: (items) => items.map((t) => (t.id === id ? { ...t, status: targetStatus } : t)),
      run: () => moveTask(id, targetStatus),
    });
  }

  function onCreated(task: TaskDto) {
    setTasks((cur) => [task, ...cur]);
    setModalOpen(false);
  }

  const getColIcon = (status: number) => {
    switch (status) {
      case 0: return <ClipboardList className="h-4 w-4 text-slate-500" />;
      case 1: return <LoaderCircle className="h-4 w-4 text-blue-500" />;
      case 2: return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Görev Panosu</h1>
          <p className="text-sm text-slate-500">Ekip görevlerini sürükleyip bırakarak yönetin.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Yeni Görev</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-sm border ${
            feedback.type === "error" ? "bg-red-50/50 text-red-800 border-red-200" : "bg-amber-50/50 text-amber-800 border-amber-200"
          }`}
          role="status"
        >
          <span>
            <span className="font-semibold">{feedback.type === "error" ? "İşlem geri alındı: " : "Uyarı: "}</span>
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Kapat">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-start">
        {STATUS_ORDER.map((status) => {
          const colTasks = tasks.filter((t) => t.status === status);
          const isOver = overCol === status;
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); if (overCol !== status) setOverCol(status); }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={() => onDropCol(status)}
              className={`min-h-[24rem] rounded-2xl flex flex-col transition-all duration-200 ${
                isOver 
                  ? "bg-slate-200/50 ring-2 ring-slate-300 shadow-inner" 
                  : "bg-slate-100/50 border border-slate-200/50"
              }`}
            >
              <div className="mb-4 flex items-center justify-between p-4 pb-0">
                <div className="flex items-center gap-2">
                  {getColIcon(status)}
                  <h2 className="text-sm font-bold text-slate-800">{STATUS_LABEL[status]}</h2>
                </div>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 shadow-sm">
                  {colTasks.length}
                </span>
              </div>
              <div className="flex-1 space-y-3 p-4 pt-0">
                {colTasks.length === 0 ? (
                  <div className={`flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 transition-colors ${isOver ? "border-slate-400 bg-slate-200/50" : ""}`}>
                    <p className="text-xs font-medium text-slate-400">Görev bırak</p>
                  </div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                        // Kısa bir gecikme ile opacity düşürürsek, sürüklendiğinde elementin kendi görünümü tam kalır, arkadaki silikleşir.
                        setTimeout(() => setDraggingId(t.id), 0);
                      }}
                      onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
                      className={`cursor-grab active:cursor-grabbing transition-opacity ${
                        draggingId === t.id ? "opacity-30" : ""
                      } ${pendingId === t.id ? "animate-pulse" : ""}`}
                    >
                      <TaskCard task={t} />
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <TaskModal branchId={branchId} staff={staff} onClose={() => setModalOpen(false)} onCreated={onCreated} />
      )}
    </div>
  );
}
