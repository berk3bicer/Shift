"use client";

import { useState } from "react";
import type { StaffDto, AvailabilityDto } from "@/lib/types";
import { DayOfWeek } from "@/lib/types";
import { useOptimisticList } from "@/lib/useOptimisticList";
import { deleteAvailability } from "@/lib/api-client";
import { CalendarX2, Plus, Trash2, Clock, UserRound } from "lucide-react";
import AvailabilityModal from "./AvailabilityModal";

const DAY_LABELS = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];

export default function AvailabilityBoard({
  initialAvailabilities,
  staff,
}: {
  initialAvailabilities: AvailabilityDto[];
  staff: StaffDto[];
}) {
  const { items: availabilities, setItems: setAvailabilities, feedback, setFeedback, pendingId, mutate } =
    useOptimisticList<AvailabilityDto>(initialAvailabilities);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>("all");

  function onCreated(av: AvailabilityDto) {
    setAvailabilities((cur) => [av, ...cur]);
    setModalOpen(false);
  }

  function onDelete(id: string) {
    if (!confirm("Bu kısıtı silmek istediğinize emin misiniz?")) return;
    mutate({
      id,
      optimistic: (items) => items.filter((a) => a.id !== id),
      run: () => deleteAvailability(id),
    });
  }

  // Filter & Group by Staff
  const filtered = selectedStaff === "all" 
    ? availabilities 
    : availabilities.filter(a => a.userId === selectedStaff);

  // Group by userId to show sections per employee
  const grouped = filtered.reduce((acc, av) => {
    if (!acc[av.userId]) acc[av.userId] = [];
    acc[av.userId].push(av);
    return acc;
  }, {} as Record<string, AvailabilityDto[]>);

  // Sort inside group by DayOfWeek, then StartTime
  Object.keys(grouped).forEach(uid => {
    grouped[uid].sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-ink">Müsaitlik Yönetimi</h1>
          <p className="text-sm text-muted">Personelin düzenli kısıtlarını (okul, kurs vb.) yönetin.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-muted outline-none focus:border-signal focus:ring-1 focus:ring-signal transition-colors"
          >
            <option value="all">Tüm Personel</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="group flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Kısıt Ekle</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-card border ${
            feedback.type === "error" ? "bg-red-50/50 text-red-800 border-red-200" : "bg-cream/60 text-signal-deep border-signal/30"
          }`}
          role="status"
        >
          <span>
            <span className="font-semibold">{feedback.type === "error" ? "İşlem geri alındı: " : "Uyarı: "}</span>
            {feedback.text}
          </span>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Kapat">✕</button>
        </div>
      )}

      {Object.keys(grouped).length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper">
          <CalendarX2 className="mb-4 h-12 w-12 text-faint" />
          <h3 className="text-sm font-semibold text-ink">Kısıt Bulunmuyor</h3>
          <p className="mt-1 text-xs text-muted">Bu personel için girilmiş herhangi bir müsaitlik kısıtı yok.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([userId, userAvails]) => {
            const member = staff.find(s => s.id === userId);
            if (!member) return null;

            return (
              <div key={userId} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <UserRound className="h-5 w-5 text-faint" />
                  <h2 className="font-display text-lg font-bold text-ink">{member.fullName}</h2>
                  <span className="rounded-full bg-paper-deep px-2.5 py-0.5 text-xs font-semibold text-muted">
                    {userAvails.length} Kısıt
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userAvails.map(av => (
                    <div
                      key={av.id}
                      className={`group relative flex items-start justify-between rounded-xl border border-line bg-surface p-4 shadow-card transition-all hover:shadow-card hover:border-line-strong ${pendingId === av.id ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="space-y-3">
                        <div className="inline-flex items-center rounded-lg bg-paper-deep px-2 py-1 text-xs font-semibold text-ink">
                          {DAY_LABELS[av.dayOfWeek]}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-sm font-medium text-muted">
                          <Clock className="h-4 w-4 text-faint" />
                          <span>{av.startTime.substring(0,5)} — {av.endTime.substring(0,5)}</span>
                        </div>
                        
                        {av.reason && (
                          <div className="text-sm text-muted">
                            {av.reason}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onDelete(av.id)}
                        className="opacity-0 group-hover:opacity-100 rounded-lg p-1.5 text-faint hover:bg-red-50 hover:text-red-600 transition-all focus:opacity-100"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <AvailabilityModal staff={staff} onClose={() => setModalOpen(false)} onCreated={onCreated} />
      )}
    </div>
  );
}
