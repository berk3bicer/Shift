"use client";

import { useState } from "react";
import type { StaffDto, AvailabilityDto } from "@/lib/types";
import { DayOfWeek } from "@/lib/types";
import { createAvailability, ApiClientError } from "@/lib/api-client";
import { X } from "lucide-react";

const DAY_LABELS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export default function AvailabilityModal({
  staff,
  onClose,
  onCreated,
}: {
  staff: StaffDto[];
  onClose: () => void;
  onCreated: (av: AvailabilityDto) => void;
}) {
  const [userId, setUserId] = useState(staff[0]?.id ?? "");
  const [dayOfWeek, setDayOfWeek] = useState<number>(1); // Default to Monday
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) { setError("Personel seçmelisiniz."); return; }
    if (endTime <= startTime) { setError("Bitiş saati başlangıçtan sonra olmalıdır."); return; }

    setSaving(true);
    try {
      const { id } = await createAvailability({
        userId,
        dayOfWeek,
        startTime,
        endTime,
        reason: reason.trim() || null,
      });

      const member = staff.find((s) => s.id === userId);
      const newAvail: AvailabilityDto = {
        id,
        userId,
        userFullName: member?.fullName ?? null,
        dayOfWeek,
        startTime,
        endTime,
        reason: reason.trim() || null,
      };

      onCreated(newAvail);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl bg-surface p-6 shadow-float ring-1 ring-ink/5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Müsaitlik Ekle</h2>
            <p className="text-sm text-muted mt-1">Personelin düzenli olarak çalışamayacağı saatleri (kısıtları) girin.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-faint hover:bg-paper-deep hover:text-ink transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Personel</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
            >
              {staff.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Haftanın Günü</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(Number(e.target.value))}
              className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
            >
              {DAY_LABELS.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-muted">Başlangıç Saati</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-muted">Bitiş Saati</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Sebep (Opsiyonel)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Örn: Okul, Kurs, Başka iş..."
              className="w-full rounded-xl border border-line-strong px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-paper-deep transition-colors">
            Vazgeç
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-signal px-6 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
