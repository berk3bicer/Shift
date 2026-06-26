"use client";

import { useState } from "react";
import type { ShiftDto } from "@/lib/types";
import {
  weekDays,
  shiftDay,
  formatTime,
  dayDeltaDays,
  shiftIsoByDays,
} from "@/lib/date";
import ShiftCard from "./ShiftCard";
import { updateShiftDay, ApiClientError } from "@/lib/api-client";

type Feedback = { type: "error" | "warning"; text: string } | null;

// Haftalık çizelge + GÜN-TAŞIMA sürükle-bırak. Native HTML5 DnD.
// Optimistic: bırakınca kart anında taşınır, PUT arkada gider.
//   - 400 (çakışma) → kart ESKİ yerine geri alınır + hata gösterilir.
//   - 200 + Warnings[] (11s/45s/dinlenme) → kart YERİNDE kalır + uyarı toast'lanır.
export default function ScheduleBoard({
  initialShifts,
  weekStartIso,
}: {
  initialShifts: ShiftDto[];
  weekStartIso: string;
}) {
  const [shifts, setShifts] = useState<ShiftDto[]>(initialShifts);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const days = weekDays(weekStartIso);

  // Günlere grupla + saate göre sırala.
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
    if (delta === 0) return; // aynı güne bırakıldı → no-op

    const newStart = shiftIsoByDays(shift.startTime, delta);
    const newEnd = shiftIsoByDays(shift.endTime, delta);

    const prev = shifts; // rollback için snapshot
    // ── Optimistic: kartı anında taşı ──
    setShifts((cur) =>
      cur.map((s) => (s.id === id ? { ...s, startTime: newStart, endTime: newEnd } : s)),
    );
    setFeedback(null);
    setSavingId(id);

    try {
      const { warnings } = await updateShiftDay(shift, newStart, newEnd);
      // 200: taşıma kalıcı. Uyarı varsa bildir ama GERİ ALMA.
      if (warnings.length > 0) {
        setFeedback({ type: "warning", text: warnings.join("  •  ") });
      }
    } catch (e) {
      // 4xx (çakışma): GERİ AL + nedeni göster.
      setShifts(prev);
      setFeedback({
        type: "error",
        text: e instanceof ApiClientError ? e.message : "Taşıma başarısız.",
      });
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-3">
      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm ${
            feedback.type === "error"
              ? "bg-red-50 text-red-700"
              : "bg-amber-50 text-amber-800"
          }`}
          role="status"
        >
          <span>
            <span className="font-medium">
              {feedback.type === "error" ? "Taşınamadı: " : "Uyarı: "}
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
                    <div
                      key={s.id}
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
                      className={`cursor-grab active:cursor-grabbing ${
                        draggingId === s.id ? "opacity-40" : ""
                      } ${savingId === s.id ? "animate-pulse" : ""}`}
                    >
                      <ShiftCard shift={s} />
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
