"use client";

import { useState } from "react";
import type { StaffDto, TaskDto } from "@/lib/types";
import { TaskItemStatus } from "@/lib/types";
import { PRIORITY_LABEL, CATEGORY_LABEL } from "@/lib/taskMeta";
import { createTask, ApiClientError } from "@/lib/api-client";
import { X } from "lucide-react";

// Yeni görev modal'ı. Görev her zaman ToDo (Yapılacak) sütununda doğar.
export default function TaskModal({
  branchId,
  staff,
  onClose,
  onCreated,
}: {
  branchId: string;
  staff: StaffDto[];
  onClose: () => void;
  onCreated: (task: TaskDto) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(1); // Orta
  const [category, setCategory] = useState(0); // Temizlik
  const [userId, setUserId] = useState(""); // "" = atanmamış
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Başlık zorunlu."); return; }
    setSaving(true);
    try {
      const { taskId } = await createTask({
        branchId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        category,
        assignedUserId: userId || null,
        assignedPositionId: null,
      });
      const member = userId ? staff.find((s) => s.id === userId) : null;
      const newTask: TaskDto = {
        id: taskId,
        branchId,
        title: title.trim(),
        description: description.trim() || null,
        dueDate: null,
        priority,
        category,
        status: TaskItemStatus.ToDo,
        assignedUserId: userId || null,
        assignedUserName: member?.fullName ?? null,
        assignedPositionId: null,
        assignedPositionName: null,
        startedAt: null,
        completedAt: null,
      };
      onCreated(newTask);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Yeni Görev Oluştur</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Başlık</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              placeholder="Örn. Akşam kapanış temizliği"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Açıklama (Opsiyonel)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Görevle ilgili detaylar..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                {PRIORITY_LABEL.map((l, i) => (
                  <option key={i} value={i}>{l}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                {CATEGORY_LABEL.map((l, i) => (
                  <option key={i} value={i}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Atanacak Kişi</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
            >
              <option value="">Atanmamış (Ortak Havuz)</option>
              {staff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}{m.positionName ? ` — ${m.positionName}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Vazgeç
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Ekleniyor..." : "Görevi Ekle"}
          </button>
        </div>
      </form>
    </div>
  );
}
