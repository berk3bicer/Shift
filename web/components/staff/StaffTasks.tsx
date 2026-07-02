"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { moveTask } from "@/lib/api-client";
import { STATUS_LABEL, PRIORITY_LABEL, PRIORITY_BADGE, CATEGORY_LABEL } from "@/lib/taskMeta";
import type { TaskItemDto } from "@/lib/types";

// Staff "Görevlerim" — GET /tasks/mine (kendine atanmış). Move ucu (POST /tasks/{id}/move)
// zaten Staff'a açık → personel görevini ilerletebilir (Yapılacak → Devam → Tamamlandı).
// Bu ekran o asimetriyi (tamamlayabiliyordu ama listeleyemiyordu) kapatır.

// Sonraki durum: ToDo→InProgress→Done; Done ise geri açma (reopen → InProgress).
const NEXT: Record<number, { status: number; label: string }> = {
  0: { status: 1, label: "Başla" },
  1: { status: 2, label: "Tamamla" },
  2: { status: 1, label: "Geri aç" },
};

export default function StaffTasks({ initialTasks }: { initialTasks: TaskItemDto[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function advance(task: TaskItemDto) {
    const next = NEXT[task.status];
    if (!next) return;
    setBusyId(task.id);
    setError(null);
    try {
      await moveTask(task.id, next.status);
      router.refresh(); // DB'den taze durum
    } catch (err) {
      setError(err instanceof Error ? err.message : "Görev güncellenemedi.");
    } finally {
      setBusyId(null);
    }
  }

  if (initialTasks.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        Sana atanmış görev yok.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      <ul className="space-y-2">
        {initialTasks.map((t) => {
          const next = NEXT[t.status];
          const done = t.status === 2;
          return (
            <li key={t.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-semibold ${done ? "text-gray-400 line-through" : "text-gray-900"}`}>
                    {t.title}
                  </p>
                  {t.description && <p className="mt-0.5 text-xs text-gray-500">{t.description}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PRIORITY_BADGE[t.priority] ?? ""}`}>
                      {PRIORITY_LABEL[t.priority] ?? "—"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {CATEGORY_LABEL[t.category] ?? "—"}
                    </span>
                    <span className="text-[10px] font-medium text-gray-400">{STATUS_LABEL[t.status]}</span>
                  </div>
                </div>
                {next && (
                  <button
                    onClick={() => advance(t)}
                    disabled={busyId === t.id}
                    className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
                      done
                        ? "border border-gray-300 text-gray-600 hover:bg-gray-100"
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    }`}
                  >
                    {busyId === t.id ? "…" : next.label}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
