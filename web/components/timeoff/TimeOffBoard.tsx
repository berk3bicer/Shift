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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">İzin (Time Off) Yönetimi</h1>
          <p className="text-sm text-slate-500">Personelin izin taleplerini inceleyin ve onaylayın.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all hover:shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Talep Oluştur</span>
        </button>
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

      <div className="flex gap-2 border-b border-slate-200">
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
                  ? "border-slate-900 text-slate-900" 
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isActive ? "bg-slate-100 text-slate-700" : "bg-slate-100 text-slate-500"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
          <CalendarRange className="mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-sm font-semibold text-slate-900">Talep Bulunmuyor</h3>
          <p className="mt-1 text-xs text-slate-500">Bu statüde herhangi bir izin talebi yok.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className={`flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${pendingId === req.id ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{req.userFullName}</h3>
                      <span className="text-xs font-medium text-slate-500">{TYPE_LABELS[req.type]}</span>
                    </div>
                  </div>
                  {req.status === TimeOffStatus.Pending && (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      <Clock className="h-3 w-3" />
                      Bekliyor
                    </span>
                  )}
                  {req.status === TimeOffStatus.Approved && (
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
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

                <div className="rounded-lg bg-slate-50 p-3 text-sm">
                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>{new Date(req.startDate).toLocaleDateString('tr-TR')}</span>
                    <span className="text-slate-400">→</span>
                    <span>{new Date(req.endDate).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>

                {req.note && (
                  <p className="text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Not: </span>
                    {req.note}
                  </p>
                )}
              </div>

              {req.status === TimeOffStatus.Pending && (
                <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => onDecide(req.id, "Reject")}
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Reddet
                  </button>
                  <button
                    onClick={() => onDecide(req.id, "Approve")}
                    className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
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
