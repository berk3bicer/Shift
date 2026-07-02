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
      {error && <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Durum + aksiyon */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm">
        {open ? (
          <>
            <p className="text-sm text-gray-500">İçeridesin</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {formatTime(open.checkInTime)}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">girişinden beri</p>
            <button
              onClick={doClockOut}
              disabled={busy}
              className="mt-4 w-full rounded-md bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {busy ? "…" : "Çıkış Yap"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500">Şu an dışarıdasın</p>
            <button
              onClick={doClockIn}
              disabled={busy}
              className="mt-4 w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? "…" : "Giriş Yap"}
            </button>
          </>
        )}
      </div>

      {/* Geçmiş */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">Son Kayıtlar</h2>
        {history.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-500">
            Henüz tamamlanmış puantaj kaydın yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {history.map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {r.checkInTime.slice(8, 10)}.{r.checkInTime.slice(5, 7)} • {formatTime(r.checkInTime)}–{r.checkOutTime ? formatTime(r.checkOutTime) : "…"}
                  </p>
                  {r.isLate && <p className="text-[11px] font-semibold text-amber-600">Geç giriş</p>}
                </div>
                <span className="text-xs font-medium text-gray-500">{fmtDur(r.workedMinutes)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
