"use client";

import { useState } from "react";
import type { TimeClockDto } from "@/lib/types";
import { clockIn, clockOut, ApiClientError } from "@/lib/api-client";
import { LogIn, LogOut, Clock, AlertTriangle, UserRound, QrCode, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

// Puantaj (yönetici görünümü). Listede şubenin TÜM kayıtları. Giriş/Çıkış butonu
// GİRİŞ YAPAN KULLANICIYI (token, meId) damgalar — backend clock-in token-user'dır.
// QR (kendi telefonu) / PIN (paylaşılan tablet) yöntemi backend'e gönderilir.
// NOT (kapsam): "başka personeli PIN'le tablette damgalama" (gerçek Kiosk) backend
// clock-in-by-pin ucu gerektirir — yok; o yüzden buradaki giriş hep oturum sahibidir.
export default function TimeClockBoard({
  initialClocks,
  branchId,
  meId,
  meName,
}: {
  initialClocks: TimeClockDto[];
  branchId: string;
  meId: string;
  meName: string;
}) {
  const router = useRouter();
  const clocks = initialClocks;
  const [method, setMethod] = useState<number>(0); // 0=QR, 1=PIN
  const [loading, setLoading] = useState<"in" | "out" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Giriş yapan kullanıcının açık kaydı (token user = meId).
  const myOpenRecord = clocks.find((c) => c.userId === meId && c.checkOutTime === null);

  async function handleClockIn() {
    setError(null);
    setLoading("in");
    try {
      await clockIn(branchId, method);
      router.refresh(); // gerçek DB'den tazele (sahte optimistic değil)
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
      router.refresh();
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
          <h1 className="font-display text-2xl font-bold text-ink">Puantaj (Time Clock)</h1>
          <p className="text-sm text-muted">Personelin gerçek çalışma saatlerini ve geç girişlerini takip edin.</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-muted">Yöntem:</span>
            <div className="flex overflow-hidden rounded-lg ring-1 ring-line">
              <button
                onClick={() => setMethod(0)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold ${method === 0 ? "bg-ink text-white" : "bg-surface text-muted hover:bg-paper"}`}
              >
                <QrCode className="h-3.5 w-3.5" /> QR (telefon)
              </button>
              <button
                onClick={() => setMethod(1)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold ${method === 1 ? "bg-ink text-white" : "bg-surface text-muted hover:bg-paper"}`}
              >
                <KeyRound className="h-3.5 w-3.5" /> PIN (tablet)
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-paper p-1.5 ring-1 ring-line">
            <span className="px-2 text-xs font-medium text-muted">{meName}</span>
            <button
              onClick={handleClockIn}
              disabled={!!myOpenRecord || loading !== null}
              className="flex items-center gap-2 rounded-lg bg-sage-deep px-4 py-2 text-sm font-semibold text-white shadow-card transition-all hover:bg-sage disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading === "in" ? <Clock className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Giriş Yap
            </button>
            <button
              onClick={handleClockOut}
              disabled={!myOpenRecord || loading !== null}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-card transition-all hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
        <div className="border-b border-line bg-paper px-6 py-4">
          <h2 className="font-display text-sm font-bold text-ink">Günlük Puantaj Kayıtları</h2>
        </div>

        {clocks.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">Henüz giriş-çıkış kaydı bulunmuyor.</div>
        ) : (
          <div className="divide-y divide-line">
            {clocks.map((clock) => (
              <div key={clock.id} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-paper">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${clock.checkOutTime ? "bg-paper-deep text-muted" : "bg-sage-soft text-sage-deep ring-2 ring-sage/30"}`}>
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink">{clock.userFullName}</h3>
                    <div className="mt-1 flex items-center gap-3 text-xs font-medium text-muted">
                      <span className="flex items-center gap-1">
                        <LogIn className="h-3 w-3 text-sage" />
                        {new Date(clock.checkInTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}
                      </span>
                      <span className="text-faint">|</span>
                      <span className="flex items-center gap-1">
                        <LogOut className={`h-3 w-3 ${clock.checkOutTime ? "text-red-500" : "text-faint"}`} />
                        {clock.checkOutTime
                          ? new Date(clock.checkOutTime).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                          : "Halen İçeride"}
                      </span>
                      <span className="text-faint">|</span>
                      <span className="rounded bg-paper-deep px-1.5 text-[10px] text-muted">{clock.method}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {clock.isLate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream px-2 py-1 text-xs font-semibold text-signal-deep ring-1 ring-inset ring-signal/30">
                      <AlertTriangle className="h-3 w-3" /> Geç Kaldı
                    </span>
                  )}
                  {clock.workedMinutes != null && (
                    <span className="rounded-lg bg-paper-deep px-3 py-1.5 text-xs font-bold text-muted">
                      {Math.floor(clock.workedMinutes / 60)}s {Math.round(clock.workedMinutes % 60)}d
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
