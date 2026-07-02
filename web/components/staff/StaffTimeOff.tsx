"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTimeOffRequest } from "@/lib/api-client";
import { TimeOffType, TimeOffStatus, type TimeOffRequestDto } from "@/lib/types";

// Staff izin ekranı — yeni talep + kendi geçmişi. Backend uçları HAZIR
// (POST /timeoffrequests + GET /mine); bu tamamen FE-only bir bağlama.

const TYPE_LABEL: Record<number, string> = {
  [TimeOffType.Annual]: "Yıllık",
  [TimeOffType.Sick]: "Hastalık",
  [TimeOffType.Excuse]: "Mazeret",
};

const STATUS_META: Record<number, { label: string; cls: string }> = {
  [TimeOffStatus.Pending]: { label: "Bekliyor", cls: "bg-amber-100 text-amber-700" },
  [TimeOffStatus.Approved]: { label: "Onaylandı", cls: "bg-emerald-100 text-emerald-700" },
  [TimeOffStatus.Rejected]: { label: "Reddedildi", cls: "bg-rose-100 text-rose-700" },
};

export default function StaffTimeOff({
  userId,
  initialRequests,
}: {
  userId: string;
  initialRequests: TimeOffRequestDto[];
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [type, setType] = useState<number>(TimeOffType.Annual);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!startDate || !endDate) {
      setError("Başlangıç ve bitiş tarihi gerekli.");
      return;
    }
    if (endDate < startDate) {
      setError("Bitiş, başlangıçtan önce olamaz.");
      return;
    }
    setLoading(true);
    try {
      await createTimeOffRequest({ userId, startDate, endDate, type, note: note || null });
      setStartDate("");
      setEndDate("");
      setNote("");
      setType(TimeOffType.Annual);
      router.refresh(); // geçmişi DB'den tazele (kalıcılık kaynağı)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Talep oluşturulamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Yeni İzin Talebi</h2>
        {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Başlangıç</span>
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-gray-600">Bitiş</span>
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-gray-600">Tür</span>
          <select
            value={type}
            onChange={(e) => setType(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900"
          >
            {Object.entries(TYPE_LABEL).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-gray-600">Açıklama (opsiyonel)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900"
            placeholder="Kısa not…"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Gönderiliyor…" : "Talep Gönder"}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">Geçmişim</h2>
        {initialRequests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            Henüz izin talebin yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {initialRequests.map((r) => {
              const status = STATUS_META[r.status];
              return (
                <li key={r.id} className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {r.startDate} → {r.endDate}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status?.cls ?? "bg-gray-100 text-gray-500"}`}>
                      {status?.label ?? "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {TYPE_LABEL[r.type] ?? "—"}
                    {r.reason ? ` • ${r.reason}` : ""}
                  </p>
                  {r.decisionNote && (
                    <p className="mt-1 text-xs text-gray-400">Yönetici notu: {r.decisionNote}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
