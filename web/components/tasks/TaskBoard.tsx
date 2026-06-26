"use client";

import { useState } from "react";
import type { StaffDto, TaskDto } from "@/lib/types";
import { STATUS_LABEL, STATUS_ORDER } from "@/lib/taskMeta";
import { useOptimisticList } from "@/lib/useOptimisticList";
import { moveTask } from "@/lib/api-client";
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Görev Panosu</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
        >
          + Yeni Görev
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm ${
            feedback.type === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
          }`}
          role="status"
        >
          <span>
            <span className="font-medium">{feedback.type === "error" ? "İşlem geri alındı: " : "Uyarı: "}</span>
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Kapat">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {STATUS_ORDER.map((status) => {
          const colTasks = tasks.filter((t) => t.status === status);
          const isOver = overCol === status;
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); if (overCol !== status) setOverCol(status); }}
              onDragLeave={() => setOverCol((c) => (c === status ? null : c))}
              onDrop={() => onDropCol(status)}
              className={`min-h-40 rounded-lg p-2 transition-colors ${isOver ? "bg-blue-100 ring-2 ring-blue-300" : "bg-gray-100/60"}`}
            >
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-medium text-gray-900">{STATUS_LABEL[status]}</span>
                <span className="rounded-full bg-gray-200 px-2 text-xs text-gray-600">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.length === 0 ? (
                  <div className="px-1 py-6 text-center text-xs text-gray-300">—</div>
                ) : (
                  colTasks.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", t.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(t.id);
                      }}
                      onDragEnd={() => { setDraggingId(null); setOverCol(null); }}
                      className={`cursor-grab active:cursor-grabbing ${draggingId === t.id ? "opacity-40" : ""} ${pendingId === t.id ? "animate-pulse" : ""}`}
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

      <p className="text-xs text-gray-400">İpucu: kartı başka kolona sürükleyip bırakın.</p>

      {modalOpen && (
        <TaskModal branchId={branchId} staff={staff} onClose={() => setModalOpen(false)} onCreated={onCreated} />
      )}
    </div>
  );
}
