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
  [TimeOffStatus.Pending]: { label: "Bekliyor", cls: "bg-cream text-signal-deep" },
  [TimeOffStatus.Approved]: { label: "Onaylandı", cls: "bg-sage-soft text-sage-deep" },
  [TimeOffStatus.Rejected]: { label: "Reddedildi", cls: "bg-red-100 text-red-700" },
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
      <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-line bg-surface p-4 shadow-card">
        <h2 className="font-display text-sm font-bold text-ink">Yeni İzin Talebi</h2>
        {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted">Başlangıç</span>
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted">Bitiş</span>
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Tür</span>
          <select
            value={type}
            onChange={(e) => setType(Number(e.target.value))}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal"
          >
            {Object.entries(TYPE_LABEL).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted">Açıklama (opsiyonel)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm text-ink outline-none focus:border-signal"
            placeholder="Kısa not…"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
        >
          {loading ? "Gönderiliyor…" : "Talep Gönder"}
        </button>
      </form>

      <div className="space-y-2">
        <h2 className="font-display text-sm font-bold text-ink">Geçmişim</h2>
        {initialRequests.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-6 text-center text-sm text-muted">
            Henüz izin talebin yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {initialRequests.map((r) => {
              const status = STATUS_META[r.status];
              return (
                <li key={r.id} className="rounded-xl border border-line bg-surface p-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">
                      {r.startDate} → {r.endDate}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${status?.cls ?? "bg-paper-deep text-muted"}`}>
                      {status?.label ?? "—"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {TYPE_LABEL[r.type] ?? "—"}
                    {r.reason ? ` • ${r.reason}` : ""}
                  </p>
                  {r.decisionNote && (
                    <p className="mt-1 text-xs text-faint">Yönetici notu: {r.decisionNote}</p>
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
