"use client";

import { useState } from "react";
import type { ShiftDto, StaffDto } from "@/lib/types";
import {
  weekDays,
  shiftDay,
  formatTime,
  dayDeltaDays,
  shiftIsoByDays,
} from "@/lib/date";
import ShiftCard from "./ShiftCard";
import { updateShift, ApiClientError } from "@/lib/api-client";

type Feedback = { type: "error" | "warning"; text: string } | null;

// Haftalık çizelge. İki etkileşim, AYNI optimistic+rollback yolundan (applyUpdate):
//   • Gün-taşıma: kartı başka güne sürükle (tarih değişir).
//   • Kişi-atama: karta tıkla → dropdown'dan kişi seç (UserId değişir; "Açık vardiya" = null).
// Her ikisinde: 400 (çakışma) → geri al + neden; 200 + Warnings[] → tut + toast.
export default function ScheduleBoard({
  initialShifts,
  weekStartIso,
  staff,
}: {
  initialShifts: ShiftDto[];
  weekStartIso: string;
  staff: StaffDto[];
}) {
  const [shifts, setShifts] = useState<ShiftDto[]>(initialShifts);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const days = weekDays(weekStartIso);
  const staffById = new Map(staff.map((s) => [s.id, s.fullName]));

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

  // Optimistic + rollback/uyarı çekirdeği — her iki etkileşim de buradan geçer.
  async function applyUpdate(
    shift: ShiftDto,
    patch: Partial<ShiftDto>,
    overrides: { startTime?: string; endTime?: string; userId?: string | null },
  ) {
    const prev = shifts;
    setShifts((cur) => cur.map((s) => (s.id === shift.id ? { ...s, ...patch } : s)));
    setFeedback(null);
    setSavingId(shift.id);
    try {
      const { warnings } = await updateShift(shift, overrides);
      if (warnings.length > 0) setFeedback({ type: "warning", text: warnings.join("  •  ") });
    } catch (e) {
      setShifts(prev); // 400 (çakışma): geri al
      setFeedback({
        type: "error",
        text: e instanceof ApiClientError ? e.message : "İşlem başarısız.",
      });
    } finally {
      setSavingId(null);
    }
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
    await applyUpdate(
      shift,
      { startTime: newStart, endTime: newEnd },
      { startTime: newStart, endTime: newEnd },
    );
  }

  function onAssign(shift: ShiftDto, value: string) {
    setAssigningId(null);
    const newUserId = value === "" ? null : value;
    if (newUserId === shift.userId) return;
    const newName = newUserId ? staffById.get(newUserId) ?? null : null;
    applyUpdate(shift, { userId: newUserId, userFullName: newName }, { userId: newUserId });
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm ${
            feedback.type === "error" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"
          }`}
          role="status"
        >
          <span>
            <span className="font-medium">
              {feedback.type === "error" ? "İşlem geri alındı: " : "Uyarı: "}
            </span>
            {feedback.text}
          </span>
          <button
            onClick={() => setFeedback(null)}
            className="shrink-0 text-current opacity-60 hover:opacity-100"
            aria-label="Kapat"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
        {days.map((day) => {
          const dayShifts = byDay.get(day.iso) ?? [];
          const isOver = overDay === day.iso;
          return (
            <div
              key={day.iso}
              onDragOver={(e) => {
                e.preventDefault();
                if (overDay !== day.iso) setOverDay(day.iso);
              }}
              onDragLeave={() => setOverDay((d) => (d === day.iso ? null : d))}
              onDrop={() => onDropDay(day.iso)}
              className={`min-h-28 rounded-lg p-2 transition-colors ${
                isOver ? "bg-blue-100 ring-2 ring-blue-300" : "bg-gray-100/60"
              }`}
            >
              <div className="mb-2 px-1">
                <div className="text-sm font-medium text-gray-900">{day.name}</div>
                <div className="text-xs text-gray-400">{day.label}</div>
              </div>
              <div className="space-y-2">
                {dayShifts.length === 0 ? (
                  <div className="px-1 py-4 text-center text-xs text-gray-300">—</div>
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
                        onDragEnd={() => {
                          setDraggingId(null);
                          setOverDay(null);
                        }}
                        onClick={() => setAssigningId((cur) => (cur === s.id ? null : s.id))}
                        className={`cursor-pointer ${draggingId === s.id ? "opacity-40" : ""} ${
                          savingId === s.id ? "animate-pulse" : ""
                        }`}
                        title="Tıkla: kişi ata · Sürükle: başka güne taşı"
                      >
                        <ShiftCard shift={s} />
                      </div>

                      {assigningId === s.id && (
                        <div
                          className="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <label className="mb-1 block text-[11px] font-medium text-gray-500">
                            Kişi ata
                          </label>
                          <select
                            autoFocus
                            defaultValue={s.userId ?? ""}
                            onChange={(e) => onAssign(s, e.target.value)}
                            className="w-full rounded border border-gray-300 px-1 py-1 text-xs outline-none focus:border-gray-900"
                          >
                            <option value="">Açık vardiya (atama yok)</option>
                            {staff.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.fullName}
                                {m.positionName ? ` — ${m.positionName}` : ""}
                              </option>
                            ))}
                          </select>
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
    </div>
  );
}
