"use client";

import { useState } from "react";
import type { StaffDto, TimeOffRequestDto } from "@/lib/types";
import { TimeOffType, TimeOffStatus } from "@/lib/types";
import { useOptimisticList } from "@/lib/useOptimisticList";
import { decideTimeOffRequest } from "@/lib/api-client";
import { CalendarRange, Plus, CheckCircle2, XCircle, Clock, UserRound } from "lucide-react";
import TimeOffModal from "./TimeOffModal";

const TYPE_LABELS = {
  [TimeOffType.Annual]: "Yıllık İzin",
  [TimeOffType.Sick]: "Hastalık",
  [TimeOffType.Excuse]: "Mazeret",
};

export default function TimeOffBoard({
  initialRequests,
  staff,
}: {
  initialRequests: TimeOffRequestDto[];
  staff: StaffDto[];
}) {
  const { items: requests, setItems: setRequests, feedback, setFeedback, pendingId, mutate } =
    useOptimisticList<TimeOffRequestDto>(initialRequests);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TimeOffStatus>(TimeOffStatus.Pending);

  function onCreated(req: TimeOffRequestDto) {
    setRequests((cur) => [req, ...cur]);
    setModalOpen(false);
  }

  function onDecide(id: string, decision: "Approve" | "Reject") {
    const targetStatus = decision === "Approve" ? TimeOffStatus.Approved : TimeOffStatus.Rejected;
    mutate({
      id,
      optimistic: (items) => items.map(r => r.id === id ? { ...r, status: targetStatus } : r),
      run: () => decideTimeOffRequest(id, decision),
    });
  }

  const filteredRequests = requests.filter(r => r.status === activeTab);
  
  // Sort by startDate ascending
  filteredRequests.sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-ink">İzin (Time Off) Yönetimi</h1>
          <p className="text-sm text-muted">Personelin izin taleplerini inceleyin ve onaylayın.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Talep Oluştur</span>
        </button>
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

      <div className="flex gap-2 border-b border-line">
        {[
          { status: TimeOffStatus.Pending, label: "Bekleyenler" },
          { status: TimeOffStatus.Approved, label: "Onaylananlar" },
          { status: TimeOffStatus.Rejected, label: "Reddedilenler" },
        ].map(tab => {
          const count = requests.filter(r => r.status === tab.status).length;
          const isActive = activeTab === tab.status;
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                isActive 
                  ? "border-signal font-semibold text-ink" 
                  : "border-transparent text-muted hover:border-line-strong hover:text-ink"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isActive ? "bg-cream text-signal-deep" : "bg-paper-deep text-muted"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper">
          <CalendarRange className="mb-4 h-12 w-12 text-faint" />
          <h3 className="text-sm font-semibold text-ink">Talep Bulunmuyor</h3>
          <p className="mt-1 text-xs text-muted">Bu statüde herhangi bir izin talebi yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className={`flex flex-col justify-between rounded-xl border border-line bg-surface p-5 shadow-card transition-all hover:shadow-card ${pendingId === req.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-deep text-muted">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-ink">{req.userFullName}</h3>
                      <span className="text-xs font-medium text-muted">{TYPE_LABELS[req.type]}</span>
                    </div>
                  </div>
                  {req.status === TimeOffStatus.Pending && (
                    <span className="flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs font-semibold text-signal-deep ring-1 ring-inset ring-signal/30">
                      <Clock className="h-3 w-3" />
                      Bekliyor
                    </span>
                  )}
                  {req.status === TimeOffStatus.Approved && (
                    <span className="flex items-center gap-1 rounded-full bg-sage-soft px-2 py-1 text-xs font-semibold text-sage-deep ring-1 ring-inset ring-sage/30">
                      <CheckCircle2 className="h-3 w-3" />
                      Onaylandı
                    </span>
                  )}
                  {req.status === TimeOffStatus.Rejected && (
                    <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                      <XCircle className="h-3 w-3" />
                      Reddedildi
                    </span>
                  )}
                </div>

                <div className="rounded-lg bg-paper p-3 text-sm">
                  <div className="flex justify-between text-muted font-medium">
                    <span>{new Date(req.startDate).toLocaleDateString('tr-TR')}</span>
                    <span className="text-faint">→</span>
                    <span>{new Date(req.endDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                {req.reason && (
                  <p className="text-sm text-muted">
                    <span className="font-semibold text-muted">Not: </span>
                    {req.reason}
                  </p>
                )}
              </div>

              {req.status === TimeOffStatus.Pending && (
                <div className="mt-5 flex gap-2 border-t border-line pt-4">
                  <button
                    onClick={() => onDecide(req.id, "Reject")}
                    className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold text-muted hover:bg-paper transition-colors"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => onDecide(req.id, "Approve")}
                    className="flex-1 rounded-lg bg-sage-deep px-3 py-2 text-sm font-semibold text-white shadow-card hover:bg-sage transition-colors"
                  >
                    Onayla
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TimeOffModal staff={staff} onClose={() => setModalOpen(false)} onCreated={onCreated} />
      )}
    </div>
  );
}
