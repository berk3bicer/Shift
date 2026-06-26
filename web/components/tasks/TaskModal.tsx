"use client";

import { useState } from "react";
import type { StaffDto, TaskDto } from "@/lib/types";
import { TaskItemStatus } from "@/lib/types";
import { PRIORITY_LABEL, CATEGORY_LABEL } from "@/lib/taskMeta";
import { createTask, ApiClientError } from "@/lib/api-client";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold text-gray-900">Yeni Görev</h2>

        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Başlık</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Örn. Akşam kapanış temizliği"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Açıklama</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-gray-700">Öncelik</label>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            >
              {PRIORITY_LABEL.map((l, i) => (
                <option key={i} value={i}>{l}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-gray-700">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
            >
              {CATEGORY_LABEL.map((l, i) => (
                <option key={i} value={i}>{l}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Kişi</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm"
          >
            <option value="">Atanmamış (havuz)</option>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}{m.positionName ? ` — ${m.positionName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100">Vazgeç</button>
          <button type="submit" disabled={saving} className="rounded-md bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">
            {saving ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
      </form>
    </div>
  );
}
