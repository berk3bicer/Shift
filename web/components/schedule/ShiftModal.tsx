"use client";

import { useState } from "react";
import type { PositionDto, ShiftDto, StaffDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { createShift, ApiClientError } from "@/lib/api-client";

// Yeni vardiya modal'ı. Gün sütunundaki "+" ile açılır (dayIso önceden dolu).
// Pozisyon (zorunlu), saat aralığı, kişi (opsiyonel = açık vardiya). POST sonrası
// onCreated ile board'a eklenir; çakışma (400) modalda gösterilir.
export default function ShiftModal({
  dayIso,
  branchId,
  positions,
  staff,
  onClose,
  onCreated,
}: {
  dayIso: string;
  branchId: string;
  positions: PositionDto[];
  staff: StaffDto[];
  onClose: () => void;
  onCreated: (shift: ShiftDto, warnings: string[]) => void;
}) {
  const [positionId, setPositionId] = useState(positions[0]?.id ?? "");
  const [userId, setUserId] = useState(""); // "" = açık vardiya
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!positionId) { setError("Pozisyon seçin."); return; }
    if (end <= start) { setError("Bitiş, başlangıçtan sonra olmalı."); return; }

    const startTime = `${dayIso}T${start}:00Z`;
    const endTime = `${dayIso}T${end}:00Z`;
    setSaving(true);
    try {
      const { shiftId, warnings } = await createShift({
        branchId,
        positionId,
        userId: userId || null,
        startTime,
        endTime,
        notes: null,
      });
      const pos = positions.find((p) => p.id === positionId);
      const member = userId ? staff.find((s) => s.id === userId) : null;
      const newShift: ShiftDto = {
        id: shiftId,
        branchId,
        userId: userId || null,
        userFullName: member?.fullName ?? null,
        positionId,
        positionName: pos?.name ?? "",
        positionColor: pos?.colorCode ?? null,
        startTime,
        endTime,
        status: ShiftStatus.Draft,
        notes: null,
      };
      onCreated(newShift, warnings);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Oluşturulamadı.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-surface p-6 shadow-float"
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-base font-bold text-ink">Yeni Vardiya</h2>
          <span className="font-mono text-xs text-faint">{dayIso}</span>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Pozisyon</label>
          <select
            value={positionId}
            onChange={(e) => setPositionId(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-signal"
          >
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-ink">Başlangıç</label>
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-sm font-medium text-ink">Bitiş</label>
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-signal"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Kişi</label>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-signal"
          >
            <option value="">Açık vardiya (atama yok)</option>
            {staff.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}{m.positionName ? ` — ${m.positionName}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper-deep hover:text-ink"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-signal px-4 py-2 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
          >
            {saving ? "Ekleniyor…" : "Ekle"}
          </button>
        </div>
      </form>
    </div>
  );
}
