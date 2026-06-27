"use client";

import { useState } from "react";
import type { ChecklistDto, ChecklistRunDto, ChecklistRunItemDto, BranchDto } from "@/lib/types";
import { startChecklistRun, checkChecklistItem } from "@/lib/api-client";
import { Play, CheckSquare, Square, CheckCircle2, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChecklistsBoard({
  checklists,
  initialRuns,
  branch,
  runDate
}: {
  checklists: ChecklistDto[];
  initialRuns: ChecklistRunDto[];
  branch: BranchDto;
  runDate: string;
}) {
  const router = useRouter();
  const [runs, setRuns] = useState<ChecklistRunDto[]>(initialRuns);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<string | null>(null);

  const handleStartRun = async (checklistId: string) => {
    if (isStarting) return;
    setError(null);
    setIsStarting(checklistId);
    try {
      await startChecklistRun({ branchId: branch.id, checklistId, runDate });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Başlatılamadı");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsStarting(null);
    }
  };

  const handleToggleCheck = async (runId: string, item: ChecklistRunItemDto) => {
    // Optimistic Update
    const newIsChecked = !item.isChecked;
    const previousRuns = [...runs];

    const updatedRuns = runs.map(r => {
      if (r.id !== runId) return r;
      const updatedItems = r.items.map(i => i.id === item.id ? { ...i, isChecked: newIsChecked } : i);
      const isAllChecked = updatedItems.every(i => i.isChecked);
      return {
        ...r,
        items: updatedItems,
        completedAt: isAllChecked ? new Date().toISOString() : null,
      };
    });

    setRuns(updatedRuns);

    try {
      await checkChecklistItem(runId, item.id, newIsChecked);
      router.refresh();
    } catch (err: any) {
      setRuns(previousRuns); // Rollback
      setError(err.message || "İşaretlenemedi");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kontrol Listeleri</h1>
        <p className="mt-1 text-sm text-slate-500">
          {branch.name} şubesi için rutin listeleri ({runDate})
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Taraf: Şablonlar */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Şablonlar</h2>
          {checklists.map(checklist => {
            const hasRunToday = runs.some(r => r.checklistId === checklist.id);

            return (
              <div key={checklist.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-slate-900">{checklist.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">{checklist.items.length} Madde</p>
                </div>
                
                <button
                  onClick={() => handleStartRun(checklist.id)}
                  disabled={hasRunToday || isStarting === checklist.id}
                  className={`flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    hasRunToday
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                  }`}
                >
                  {isStarting === checklist.id ? (
                    "Başlatılıyor..."
                  ) : hasRunToday ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Bugün Başlatıldı
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Yeni Başlat
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Sağ Taraf: Aktif Çalıştırmalar (Runs) */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Aktif Listeler (Bugün)</h2>
          
          {runs.length === 0 && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">Bugün henüz bir kontrol listesi başlatılmadı.</p>
              <p className="text-sm text-slate-400 mt-1">Sol taraftaki şablonlardan birini başlatabilirsiniz.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runs.map(run => {
              const isCompleted = !!run.completedAt;
              const progress = Math.round((run.items.filter(i => i.isChecked).length / run.items.length) * 100);

              return (
                <div key={run.id} className={`bg-white rounded-xl border ${isCompleted ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col`}>
                  
                  {/* Header */}
                  <div className={`p-4 border-b ${isCompleted ? 'bg-emerald-50/50' : 'bg-slate-50'} flex items-start justify-between`}>
                    <div>
                      <h3 className="font-bold text-slate-900">{run.checklistName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(run.startedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>•</span>
                        <span>{run.startedByUserFullName}</span>
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        Tamamlandı
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-100">
                    <div 
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>

                  {/* Items */}
                  <div className="p-2 space-y-1 bg-slate-50/50 flex-1">
                    {run.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleToggleCheck(run.id, item)}
                        className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors ${
                          item.isChecked 
                            ? "bg-slate-100/50 text-slate-500" 
                            : "bg-white hover:bg-slate-50 border border-slate-100 shadow-sm"
                        }`}
                      >
                        <div className={`mt-0.5 flex-shrink-0 ${item.isChecked ? 'text-emerald-500' : 'text-slate-300'}`}>
                          {item.isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${item.isChecked ? 'line-through opacity-70' : 'text-slate-700'}`}>
                            {item.text}
                          </span>
                          {item.isChecked && item.checkedByUserFullName && (
                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-semibold">
                              {item.checkedByUserFullName} onayladı
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
