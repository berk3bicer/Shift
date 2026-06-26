"use client";

import { useState } from "react";
import type { TimeClockDto, StaffDto } from "@/lib/types";
import { clockIn, clockOut, ApiClientError } from "@/lib/api-client";
import { LogIn, LogOut, Clock, AlertTriangle, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

export default function TimeClockBoard({
  initialClocks,
  branchId,
  staff,
}: {
  initialClocks: TimeClockDto[];
  branchId: string;
  staff: StaffDto[];
}) {
  const router = useRouter();
  const [clocks, setClocks] = useState<TimeClockDto[]>(initialClocks);
  const [currentUserId, setCurrentUserId] = useState<string>(staff[0]?.id || "s1");
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if current user has an open record
  const myOpenRecord = clocks.find(c => c.userId === currentUserId && c.checkOutTime === null);

  async function handleClockIn() {
    setError(null);
    setLoading("in");
    try {
      await clockIn(branchId);
      // Optimistic update for mock mode
      const member = staff.find(s => s.id === currentUserId);
      const newClock: TimeClockDto = {
        id: "mock-new-" + Date.now(),
        userId: currentUserId,
        userFullName: member?.fullName || "Bilinmeyen Personel",
        branchId,
        checkInTime: new Date().toISOString(),
        checkOutTime: null,
        isLate: false,
        workedMinutes: null,
      };
      setClocks(prev => [newClock, ...prev]);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Giriş yapılamadı.");
    } finally {
      setLoading(null);
    }
  }

  async function handleClockOut() {
    setError(null);
    setLoading("out");
    try {
      await clockOut();
      // Optimistic update for mock mode
      setClocks(prev => prev.map(c => {
        if (c.userId === currentUserId && c.checkOutTime === null) {
          return {
            ...c,
            checkOutTime: new Date().toISOString(),
            workedMinutes: 480 // Fake worked minutes
          };
        }
        return c;
      }));
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Çıkış yapılamadı.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Puantaj (Time Clock)</h1>
          <p className="text-sm text-slate-500">Personelin gerçek çalışma saatlerini ve geç girişlerini takip edin.</p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Kimlik:</span>
            <select
              value={currentUserId}
              onChange={(e) => setCurrentUserId(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-1.5 ring-1 ring-slate-200">
            <button
              onClick={handleClockIn}
              disabled={!!myOpenRecord || loading !== null}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "in" ? <Clock className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Giriş Yap
            </button>
            
            <button
              onClick={handleClockOut}
              disabled={!myOpenRecord || loading !== null}
              className="flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "out" ? <Clock className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-4 w-4" /> İşlem Hatası
          </div>
          <p className="mt-1">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-sm font-bold text-slate-800">Günlük Puantaj Kayıtları</h2>
        </div>
        
        {clocks.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Henüz giriş-çıkış kaydı bulunmuyor.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {clocks.map(clock => (
              <div key={clock.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${clock.checkOutTime ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500/20"}`}>
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{clock.userFullName}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-500">
                      <span className="flex items-center gap-1">
                        <LogIn className="h-3 w-3 text-emerald-500" />
                        {new Date(clock.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <LogOut className={`h-3 w-3 ${clock.checkOutTime ? "text-rose-500" : "text-slate-300"}`} />
                        {clock.checkOutTime 
                          ? new Date(clock.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                          : "Halen İçeride"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {clock.isLate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                      <AlertTriangle className="h-3 w-3" /> Geç Kaldı
                    </span>
                  )}
                  {clock.workedMinutes !== null && (
                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                      {Math.floor(clock.workedMinutes / 60)}s {clock.workedMinutes % 60}d
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
