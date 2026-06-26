"use client";

import { useState } from "react";
import type { StaffDto, TimeOffRequestDto } from "@/lib/types";
import { TimeOffType, TimeOffStatus } from "@/lib/types";
import { createTimeOffRequest, ApiClientError } from "@/lib/api-client";
import { X } from "lucide-react";

export default function TimeOffModal({
  staff,
  onClose,
  onCreated,
}: {
  staff: StaffDto[];
  onClose: () => void;
  onCreated: (req: TimeOffRequestDto) => void;
}) {
  const [userId, setUserId] = useState(staff[0]?.id ?? "");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<number>(TimeOffType.Annual);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) { setError("Personel seçmelisiniz."); return; }
    if (endDate < startDate) { setError("Bitiş tarihi başlangıç tarihinden önce olamaz."); return; }

    setSaving(true);
    try {
      const { id } = await createTimeOffRequest({
        userId,
        startDate,
        endDate,
        type,
        note: note.trim() || null,
      });

      const member = staff.find((s) => s.id === userId);
      const newReq: TimeOffRequestDto = {
        id,
        userId,
        userFullName: member?.fullName ?? null,
        startDate,
        endDate,
        type,
        status: TimeOffStatus.Pending, // Yeni talepler her zaman Pending'dir
        note: note.trim() || null,
        decidedByUserId: null,
        decidedByUserFullName: null,
      };

      onCreated(newReq);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Talep kaydedilemedi.");
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
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">İzin Talebi Ekle</h2>
            <p className="text-sm text-slate-500 mt-1">Personel için yeni bir izin (Time Off) talebi oluşturun.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Personel</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all cursor-pointer"
            >
              {staff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">İzin Tipi</label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all cursor-pointer"
            >
              <option value={TimeOffType.Annual}>Yıllık İzin</option>
              <option value={TimeOffType.Sick}>Hastalık</option>
              <option value={TimeOffType.Excuse}>Mazeret</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Başlangıç Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all cursor-pointer"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Not (Opsiyonel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Örn: Hastane randevusu..."
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/20 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Vazgeç
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Kaydediliyor..." : "Talep Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
