"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clockIn, clockOut } from "@/lib/api-client";
import { formatTime } from "@/lib/date";
import type { TimeClockDto } from "@/lib/types";

// Staff Giriş-Çıkış. branchId /me'den (birincil şube; clock-in ZORUNLU alanı). Kimlik
// token'dan → kayıt sahtelenemez. Açık kayıt (checkOutTime=null) varsa "içeride".
function fmtDur(min: number | null): string {
  if (min == null) return "";
  const total = Math.round(min); // workedMinutes ondalıklı gelebilir → yuvarla
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} sa ${m} dk` : `${m} dk`;
}

export default function StaffClock({
  branchId,
  initialRecords,
}: {
  branchId: string | null;
  initialRecords: TimeClockDto[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = initialRecords.find((r) => r.checkOutTime == null) ?? null;
  const history = initialRecords.filter((r) => r.checkOutTime != null).slice(0, 10);

  async function doClockIn() {
    if (!branchId) {
      setError("Şube bilgin bulunamadı — yöneticinle görüş.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await clockIn(branchId, 0); // QR=0 (kendi telefonu)
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function doClockOut() {
    setBusy(true);
    setError(null);
    try {
      await clockOut();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Çıkış yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Durum + aksiyon */}
      <div className="rounded-xl border border-line bg-surface p-5 text-center shadow-card">
        {open ? (
          <>
            <p className="text-sm text-muted">İçeridesin</p>
            <p className="mt-1 text-2xl font-semibold text-ink">
              {formatTime(open.checkInTime)}
            </p>
            <p className="mt-0.5 text-xs text-faint">girişinden beri</p>
            <button
              onClick={doClockOut}
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? "…" : "Çıkış Yap"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">Şu an dışarıdasın</p>
            <button
              onClick={doClockIn}
              disabled={busy}
              className="mt-4 w-full rounded-lg bg-sage-deep px-4 py-2.5 text-sm font-semibold text-white hover:bg-sage disabled:opacity-60"
            >
              {busy ? "…" : "Giriş Yap"}
            </button>
          </>
        )}
      </div>

      {/* Geçmiş */}
      <div className="space-y-2">
        <h2 className="font-display text-sm font-bold text-ink">Son Kayıtlar</h2>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-center text-xs text-muted">
            Henüz tamamlanmış puantaj kaydın yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 shadow-card">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {r.checkInTime.slice(8, 10)}.{r.checkInTime.slice(5, 7)} • {formatTime(r.checkInTime)}–{r.checkOutTime ? formatTime(r.checkOutTime) : "…"}
                  </p>
                  {r.isLate && <p className="text-[11px] font-semibold text-signal-deep">Geç giriş</p>}
                </div>
                <span className="text-xs font-medium text-muted">{fmtDur(r.workedMinutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
