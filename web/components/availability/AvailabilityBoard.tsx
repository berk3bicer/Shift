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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Müsaitlik Yönetimi</h1>
          <p className="text-sm text-slate-500">Personelin düzenli kısıtlarını (okul, kurs vb.) yönetin.</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-colors"
          >
            <option value="all">Tüm Personel</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>{s.fullName}</option>
            ))}
          </select>
          <button
            onClick={() => setModalOpen(true)}
            className="group flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Kısıt Ekle</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-sm border ${
            feedback.type === "error" ? "bg-red-50/50 text-red-800 border-red-200" : "bg-amber-50/50 text-amber-800 border-amber-200"
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
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
          <CalendarX2 className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-900">Kısıt Bulunmuyor</h3>
          <p className="mt-1 text-xs text-slate-500">Bu personel için girilmiş herhangi bir müsaitlik kısıtı yok.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([userId, userAvails]) => {
            const member = staff.find(s => s.id === userId);
            if (!member) return null;

            return (
              <div key={userId} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <UserRound className="h-5 w-5 text-slate-400" />
                  <h2 className="text-lg font-bold text-slate-800">{member.fullName}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                    {userAvails.length} Kısıt
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userAvails.map(av => (
                    <div
                      key={av.id}
                      className={`group relative flex items-start justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-slate-300 ${pendingId === av.id ? "opacity-50 pointer-events-none" : ""}`}
                    >
                      <div className="space-y-3">
                        <div className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800">
                          {DAY_LABELS[av.dayOfWeek]}
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <span>{av.startTime.substring(0,5)} — {av.endTime.substring(0,5)}</span>
                        </div>
                        
                        {av.reason && (
                          <div className="text-sm text-slate-500">
                            {av.reason}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onDelete(av.id)}
                        className="opacity-0 group-hover:opacity-100 rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all focus:opacity-100"
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
