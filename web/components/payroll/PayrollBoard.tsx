"use client";

import { useState } from "react";
import type { OvertimeRecordDto, StaffDto } from "@/lib/types";
import { closePeriod, unlockRecord, ApiClientError } from "@/lib/api-client";
import { Lock, Unlock, Calculator, FileCheck2, AlertTriangle, UserRound, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PayrollBoard({
  initialRecords,
  staff,
}: {
  initialRecords: OvertimeRecordDto[];
  staff: StaffDto[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState<OvertimeRecordDto[]>(initialRecords);
  
  // States for new closure
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || "");
  const [selectedMonth, setSelectedMonth] = useState<string>("2026-06");
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleClosePeriod() {
    setError(null);
    setSuccess(null);
    setLoading("close");
    try {
      // Calculate start and end ISO dates from YYYY-MM
      const year = parseInt(selectedMonth.split("-")[0]);
      const month = parseInt(selectedMonth.split("-")[1]) - 1; // 0-indexed
      
      const start = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)); // Last day of month

      await closePeriod({
        userId: selectedStaffId,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString()
      });

      setSuccess("Dönem başarıyla hesaplandı ve kilitlendi.");
      
      // Optimistic update for mock
      const staffMember = staff.find(s => s.id === selectedStaffId);
      const newRecord: OvertimeRecordDto = {
        id: "mock-or-" + Date.now(),
        userId: selectedStaffId,
        userFullName: staffMember?.fullName || "Personel",
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        totalHours: 200,
        normalHours: 180,
        overtimeHours: 20,
        isLocked: true,
        lockedAt: new Date().toISOString(),
        unlockedAt: null
      };
      
      setRecords(prev => [newRecord, ...prev.filter(r => !(r.userId === selectedStaffId && r.periodStart === start.toISOString()))]);
      
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Dönem kapatılamadı.");
    } finally {
      setLoading(null);
    }
  }

  async function handleUnlock(id: string) {
    if (!confirm("Bu kaydın kilidini açmak istediğinize emin misiniz? Denetim izi bırakılacaktır.")) return;
    
    setError(null);
    setSuccess(null);
    setLoading(`unlock-${id}`);
    
    try {
      await unlockRecord(id);
      setSuccess("Kilit başarıyla açıldı.");
      
      // Optimistic update for mock
      setRecords(prev => prev.map(r => {
        if (r.id === id) {
          return {
            ...r,
            isLocked: false,
            unlockedAt: new Date().toISOString()
          };
        }
        return r;
      }));
      
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Kilit açılamadı.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bordro & Dönem Kapatma</h1>
          <p className="text-sm text-slate-500">Aylık puantaj kayıtlarını hesaplayıp kilitli bordro snapshot'larına dönüştürün.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> Hata
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-indigo-500" />
              Yeni Dönem Kapat
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Personel</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Dönem (Ay/Yıl)</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <button
                onClick={handleClosePeriod}
                disabled={loading === "close"}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-all"
              >
                {loading === "close" ? <Calculator className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                Hesapla ve Kilitle
              </button>
            </div>
            
            <div className="mt-6 rounded-xl bg-indigo-50 p-4 border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 mb-1">Ne işe yarar?</h3>
              <p className="text-xs text-indigo-800/80 leading-relaxed">
                Puantaj (Time Clock) verilerini okur, haftalık fazla mesaileri hesaplar ve o ana ait değerleri <strong>değiştirilemez (kilitli) bir snapshot</strong> olarak kaydeder.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800">Kapatılmış Dönem Kayıtları</h2>
            <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
              {records.length} Kayıt
            </span>
          </div>
          
          <div className="divide-y divide-slate-100">
            {records.map(record => (
              <div key={record.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{record.userFullName}</h3>
                      <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-500">
                        {new Date(record.periodStart).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                        <span>•</span>
                        <span className="text-slate-400">Toplam:</span>
                        <span className="font-semibold text-slate-700">{record.totalHours}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {record.isLocked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        <Lock className="h-3 w-3" /> Kilitli
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        <Unlock className="h-3 w-3" /> Kilidi Açık
                      </span>
                    )}
                    
                    {record.isLocked && (
                      <button
                        onClick={() => handleUnlock(record.id)}
                        disabled={loading !== null}
                        className="text-slate-400 hover:text-amber-600 transition-colors"
                        title="Kilidi Aç (Düzeltme için)"
                      >
                        {loading === `unlock-${record.id}` ? <Unlock className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Normal Süre</span>
                    <span className="text-sm font-bold text-slate-900">{record.normalHours}s</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Fazla Mesai</span>
                    <span className="text-sm font-bold text-amber-600">{record.overtimeHours}s</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-slate-500 mb-1">Durum</span>
                    <div className="flex flex-col gap-0.5 text-[10px] text-slate-400">
                      {record.lockedAt && <span>Kilit: {new Date(record.lockedAt).toLocaleDateString('tr-TR')}</span>}
                      {record.unlockedAt && <span>Açılış: {new Date(record.unlockedAt).toLocaleDateString('tr-TR')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {records.length === 0 && (
              <div className="p-12 text-center">
                <FileCheck2 className="mx-auto h-8 w-8 text-slate-300 mb-3" />
                <h3 className="text-sm font-medium text-slate-900">Kayıt Bulunmuyor</h3>
                <p className="mt-1 text-sm text-slate-500">Henüz hesaplanıp kapatılmış bir bordro kaydı yok.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
