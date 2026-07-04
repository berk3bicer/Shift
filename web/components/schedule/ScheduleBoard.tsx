"use client";

import { useState } from "react";
import type { PositionDto, ShiftDto, StaffDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import {
  weekDays,
  shiftDay,
  formatTime,
  dayDeltaDays,
  shiftIsoByDays,
  rangeForWeek,
} from "@/lib/date";
import ShiftCard from "./ShiftCard";
import ShiftModal from "./ShiftModal";
import {
  updateShift,
  deleteShift,
  publishWeek,
  ApiClientError,
} from "@/lib/api-client";
import { useOptimisticList } from "@/lib/useOptimisticList";

// Haftalık çizelge — tüm yönetim etkileşimleri:
//   • Gün-taşıma (sürükle) + kişi-atama (tıkla) → optimistic + rollback (applyUpdate).
//   • Oluştur (gün "+" → modal) / Sil (pop-over, onaylı, HARD) → pessimistic.
//   • Haftayı Yayınla → publish-week (toplu, kişi başı tek bildirim).
export default function ScheduleBoard({
  initialShifts,
  weekStartIso,
  branchId,
  staff,
  positions,
}: {
  initialShifts: ShiftDto[];
  weekStartIso: string;
  branchId: string;
  staff: StaffDto[];
  positions: PositionDto[];
}) {
  // Optimistic+rollback çekirdeği paylaşılan hook'tan (Kanban da aynısını kullanır).
  const { items: shifts, setItems: setShifts, feedback, setFeedback, pendingId: savingId, mutate } =
    useOptimisticList<ShiftDto>(initialShifts);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [modalDay, setModalDay] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const days = weekDays(weekStartIso);
  const staffById = new Map(staff.map((s) => [s.id, s.fullName]));
  const draftCount = shifts.filter((s) => s.status === ShiftStatus.Draft).length;

  const byDay = new Map<string, ShiftDto[]>();
  for (const s of shifts) {
    const k = shiftDay(s.startTime);
    const arr = byDay.get(k) ?? [];
    arr.push(s);
    byDay.set(k, arr);
  }
  for (const arr of byDay.values()) {
    arr.sort((a, b) => formatTime(a.startTime).localeCompare(formatTime(b.startTime)));
  }

  async function onDropDay(targetDayIso: string) {
    const id = draggingId;
    setDraggingId(null);
    setOverDay(null);
    if (!id) return;
    const shift = shifts.find((s) => s.id === id);
    if (!shift) return;
    const delta = dayDeltaDays(shiftDay(shift.startTime), targetDayIso);
    if (delta === 0) return;
    const newStart = shiftIsoByDays(shift.startTime, delta);
    const newEnd = shiftIsoByDays(shift.endTime, delta);
    await mutate({
      id: shift.id,
      optimistic: (items) =>
        items.map((s) => (s.id === shift.id ? { ...s, startTime: newStart, endTime: newEnd } : s)),
      run: () => updateShift(shift, { startTime: newStart, endTime: newEnd }),
    });
  }

  function onAssign(shift: ShiftDto, value: string) {
    setAssigningId(null);
    const newUserId = value === "" ? null : value;
    if (newUserId === shift.userId) return;
    const newName = newUserId ? staffById.get(newUserId) ?? null : null;
    mutate({
      id: shift.id,
      optimistic: (items) =>
        items.map((s) => (s.id === shift.id ? { ...s, userId: newUserId, userFullName: newName } : s)),
      run: () => updateShift(shift, { userId: newUserId }),
    });
  }

  async function onDelete(shift: ShiftDto) {
    if (!confirm("Bu vardiya kalıcı olarak silinecek (geri alınamaz). Emin misiniz?")) return;
    setAssigningId(null);
    setFeedback(null);
    try {
      await deleteShift(shift.id);
      setShifts((cur) => cur.filter((s) => s.id !== shift.id));
    } catch (e) {
      setFeedback({ type: "error", text: e instanceof ApiClientError ? e.message : "Silinemedi." });
    }
  }

  function onCreated(shift: ShiftDto, warnings: string[]) {
    setShifts((cur) => [...cur, shift]);
    setModalDay(null);
    setFeedback(warnings.length > 0 ? { type: "warning", text: warnings.join("  •  ") } : null);
  }

  async function onPublishWeek() {
    if (draftCount === 0) return;
    setPublishing(true);
    setFeedback(null);
    try {
      const { startIso, endIso } = rangeForWeek(weekStartIso);
      const { publishedCount, notifiedUserCount } = await publishWeek(branchId, startIso, endIso);
      setShifts((cur) => cur.map((s) => (s.status === ShiftStatus.Draft ? { ...s, status: ShiftStatus.Published } : s)));
      setFeedback({
        type: "success",
        text: `${publishedCount} vardiya yayınlandı, ${notifiedUserCount} kişiye bildirim gönderildi.`,
      });
    } catch (e) {
      setFeedback({ type: "error", text: e instanceof ApiClientError ? e.message : "Yayınlanamadı." });
    } finally {
      setPublishing(false);
    }
  }

  const fbColor =
    feedback?.type === "error"
      ? "bg-red-50 text-red-700"
      : feedback?.type === "success"
        ? "bg-sage-soft text-sage-deep"
        : "bg-cream text-signal-deep";
  const fbLabel =
    feedback?.type === "error" ? "İşlem geri alındı: " : feedback?.type === "success" ? "" : "Uyarı: ";

  return (
    <div className="space-y-3">
      {/* Sayfa başlığı zaten "Vardiya Çizelgesi — {şube}" — burada tekrar etme (çift başlık kusuru).
          Solda taslak durumu, sağda tek birincil eylem. */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
        <p className="text-sm text-muted">
          {draftCount > 0
            ? `${draftCount} taslak vardiya henüz yayınlanmadı.`
            : "Tüm vardiyalar yayında."}
        </p>
        <button
          onClick={onPublishWeek}
          disabled={publishing || draftCount === 0}
          className="rounded-lg bg-signal px-4 py-2 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing ? "Yayınlanıyor…" : `Haftayı Yayınla${draftCount ? ` (${draftCount} taslak)` : ""}`}
        </button>
      </div>

      {feedback && (
        <div className={`flex items-start justify-between gap-3 rounded-lg px-3 py-2 text-sm ${fbColor}`} role="status">
          <span>
            <span className="font-medium">{fbLabel}</span>
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="shrink-0 text-current opacity-60 hover:opacity-100" aria-label="Kapat">✕</button>
        </div>
      )}

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-7">
        {days.map((day) => {
          const dayShifts = byDay.get(day.iso) ?? [];
          const isOver = overDay === day.iso;
          return (
            <div
              key={day.iso}
              onDragOver={(e) => { e.preventDefault(); if (overDay !== day.iso) setOverDay(day.iso); }}
              onDragLeave={() => setOverDay((d) => (d === day.iso ? null : d))}
              onDrop={() => onDropDay(day.iso)}
              className={`min-h-[16rem] rounded-2xl border p-3 transition-all duration-200 ${
                isOver ? "border-signal bg-cream ring-2 ring-signal/30" : "border-line bg-paper-deep/40"
              }`}
            >
              <div className="mb-3 flex items-start justify-between px-1">
                <div>
                  <div className="font-display text-sm font-bold text-ink">{day.name}</div>
                  <div className="text-xs font-medium text-faint">{day.label}</div>
                </div>
                <button
                  onClick={() => setModalDay(day.iso)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-muted shadow-card transition-colors hover:border-signal hover:text-signal-deep"
                  title="Yeni vardiya ekle"
                  aria-label="Yeni vardiya"
                >
                  <span className="text-base leading-none">+</span>
                </button>
              </div>
              <div className="space-y-3">
                {dayShifts.length === 0 ? (
                  <button
                    onClick={() => setModalDay(day.iso)}
                    className="w-full rounded-xl border border-dashed border-line-strong py-6 text-center text-xs font-medium text-faint transition-colors hover:border-signal hover:text-signal-deep"
                  >
                    + Vardiya ekle
                  </button>
                ) : (
                  dayShifts.map((s) => (
                    <div key={s.id} className="relative">
                      <div
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", s.id);
                          e.dataTransfer.effectAllowed = "move";
                          setDraggingId(s.id);
                        }}
                        onDragEnd={() => { setDraggingId(null); setOverDay(null); }}
                        onClick={() => setAssigningId((cur) => (cur === s.id ? null : s.id))}
                        className={`cursor-pointer ${draggingId === s.id ? "opacity-40" : ""} ${savingId === s.id ? "animate-pulse" : ""}`}
                        title="Tıkla: kişi ata / sil · Sürükle: başka güne taşı"
                      >
                        <ShiftCard shift={s} />
                      </div>

                      {assigningId === s.id && (
                        <div
                          className="absolute left-0 right-0 top-full z-10 mt-1.5 space-y-3 rounded-xl border border-line bg-surface p-3 shadow-float"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div>
                            <label className="mb-1.5 block text-xs font-semibold text-ink">Kişi ata</label>
                            <select
                              autoFocus
                              defaultValue={s.userId ?? ""}
                              onChange={(e) => onAssign(s, e.target.value)}
                              className="w-full rounded-lg border border-line-strong bg-paper px-2 py-2 text-xs text-ink outline-none transition-colors focus:border-signal"
                            >
                              <option value="">Açık vardiya (atama yok)</option>
                              {staff.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.fullName}{m.positionName ? ` — ${m.positionName}` : ""}
                                </option>
                              ))}
                            </select>
                          </div>
                          <button
                            onClick={() => onDelete(s)}
                            className="w-full rounded-lg bg-red-50 px-2 py-2 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100"
                          >
                            Vardiyayı Sil
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalDay && (
        <ShiftModal
          dayIso={modalDay}
          branchId={branchId}
          positions={positions}
          staff={staff}
          onClose={() => setModalDay(null)}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}
