"use client";

import { useState } from "react";
import type { OvertimeRecordDto, StaffDto } from "@/lib/types";
import { closePeriod, unlockRecord, exportOvertimeCsv, ApiClientError } from "@/lib/api-client";
import { Lock, Unlock, Calculator, FileCheck2, AlertTriangle, UserRound, ArrowRight, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PayrollBoard({
  initialRecords,
  staff,
}: {
  initialRecords: OvertimeRecordDto[];
  staff: StaffDto[];
}) {
  const router = useRouter();
  // records prop'tan DOĞRUDAN okunur (useState DEĞİL): router.refresh sonrası server
  // bileşeni yeni initialRecords ile yeniden render eder; useState(initialRecords) ilk
  // mount'tan sonra güncellenmez → bayatlardı. Kaynak tek: DB → prop.
  const records = initialRecords;

  // İçinde bulunulan ay "yyyy-MM" (yerel saat — kullanıcının ayı). Seçiciyle değiştirilebilir.
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dönem sınırları DATE-ONLY "yyyy-MM-dd" (backend DateOnly bekler — ISO datetime
  // bind OLMAZ). from = ayın 1'i, to = ayın son günü.
  const year = parseInt(selectedMonth.split("-")[0]);
  const month = parseInt(selectedMonth.split("-")[1]) - 1; // 0-indexed
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const periodStart = `${selectedMonth}-01`;
  const periodEnd = `${selectedMonth}-${String(lastDay).padStart(2, "0")}`;

  // Personeli dönemin gerçek kaydıyla eşle. Backend periodStart "2026-06-01" döner;
  // date-only string'le KARŞILAŞTIR (eskiden ISO datetime'la kıyaslanıp hiç eşleşmiyordu).
  const gridData = staff.map(s => {
    const record = records.find(r => r.userId === s.id && r.periodStart === periodStart);
    return {
      staff: s,
      record: record || null
    };
  });

  // Calculate totals for the summary footer
  const totalNormal = gridData.reduce((acc, row) => acc + (row.record?.normalHours || 0), 0);
  const totalOvertime = gridData.reduce((acc, row) => acc + (row.record?.overtimeHours || 0), 0);
  const totalGrand = gridData.reduce((acc, row) => acc + (row.record?.totalHours || 0), 0);

  const isAllLocked = gridData.every(row => row.record?.isLocked);

  async function handleBulkClose() {
    setError(null);
    setSuccess(null);
    setLoading("bulk-close");
    try {
      // Toplu kapanış ucu yok → kilitsiz personel için sırayla gerçek close çağır.
      // Backend her kişiyi gerçek clock verisinden hesaplayıp snapshot dondurur;
      // SAHTE veri ÜRETMEYİZ. Sonra router.refresh ile gerçek kayıtları geri okuruz
      // (optimistic illüzyon yok — ekrandaki saat/brüt DB'den gelir).
      const toClose = gridData.filter(row => !row.record?.isLocked);

      if (toClose.length === 0) {
        setSuccess("Bu dönemde kapatılacak kayıt yok (tümü kilitli).");
        setTimeout(() => setSuccess(null), 3000);
        return;
      }

      let closed = 0;
      for (const row of toClose) {
        await closePeriod({
          userId: row.staff.id,
          from: periodStart,
          to: periodEnd,
        });
        closed++;
      }

      setSuccess(`${closed} personelin dönemi gerçek puantajdan hesaplandı ve kilitlendi.`);
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Toplu dönem kapatılamadı.");
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
      // Optimistic illüzyon yok: kilidi gerçekten açtıktan sonra DB'den tazele.
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Kilit açılamadı.");
    } finally {
      setLoading(null);
    }
  }

  // Gerçek CSV: backend /records/export ucundan indir. Client-side ÜRETME — brüt/prim
  // hesabı tek kaynaktan (DB snapshot) gelir; backend zaten BOM + InvariantCulture
  // + sadece-kilitli süzgeci uyguluyor (Logo/Mikro/Paraşüt import için).
  async function handleExportCsv() {
    setError(null);
    if (!gridData.some(row => row.record?.isLocked)) {
      setError("Dışa aktarılacak kilitli bordro kaydı bulunmuyor.");
      return;
    }
    setLoading("export");
    try {
      await exportOvertimeCsv(periodStart, periodEnd);
      setSuccess("Bordro CSV indirildi (kilitli kayıtlar).");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "CSV dışa aktarılamadı.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-ink">Bordro Onayı (Timesheets)</h1>
          <p className="text-sm text-muted">Personelin puantajlarını tek bir ekrandan inceleyin ve dönemi toplu olarak kilitleyin.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-surface p-2 rounded-xl border border-line shadow-card">
          <div className="flex items-center gap-2 pl-2">
            <span className="text-sm font-semibold text-muted">Dönem:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-lg border-none bg-paper-deep px-3 py-1.5 text-sm font-medium text-muted outline-none focus:ring-2 focus:ring-signal"
            />
          </div>
          <div className="h-6 w-px bg-paper-deep"></div>
          <button
            onClick={handleBulkClose}
            disabled={loading === "bulk-close" || isAllLocked}
            className="flex items-center gap-2 rounded-lg bg-sage-deep px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-sage disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading === "bulk-close" ? (
              <Calculator className="h-4 w-4 animate-spin" />
            ) : isAllLocked ? (
              <Lock className="h-4 w-4" />
            ) : (
              <FileCheck2 className="h-4 w-4" />
            )}
            {isAllLocked ? "Tümü Kilitli" : "Tümünü Kapat (Approve All)"}
          </button>
          
          <button
            onClick={handleExportCsv}
            disabled={!gridData.some(r => r.record?.isLocked)}
            className="flex items-center gap-2 rounded-lg bg-ink px-5 py-2 text-sm font-semibold text-white shadow-card hover:bg-ink-soft disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="Sadece kilitli kayıtları dışa aktarır"
          >
            <Download className="h-4 w-4" />
            Dışa Aktar (CSV)
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-sage/40 bg-sage-soft p-4 text-sm font-medium text-sage-deep flex items-center gap-2">
          <FileCheck2 className="h-4 w-4" /> {success}
        </div>
      )}

      {/* Main Master-List Grid */}
      <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted">
            <thead className="border-b border-line bg-paper text-xs font-semibold uppercase text-muted">
              <tr>
                <th className="px-6 py-4">Personel</th>
                <th className="px-6 py-4">Dönem</th>
                <th className="px-6 py-4 text-right">Normal Saat</th>
                <th className="px-6 py-4 text-right">Fazla Mesai</th>
                <th className="px-6 py-4 text-right font-bold text-ink">Toplam Saat</th>
                <th className="px-6 py-4 text-right">Brüt Tutar</th>
                <th className="px-6 py-4 text-center">Durum</th>
                <th className="px-6 py-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {gridData.map((row) => (
                <tr key={row.staff.id} className="hover:bg-paper transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-deep text-muted">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-ink">{row.staff.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-muted">
                    {new Date(periodStart).toLocaleDateString('tr-TR', { month: 'short' })}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-muted">
                    {row.record ? `${row.record.normalHours}s` : <span className="text-faint">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.record && row.record.overtimeHours > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-cream px-2 py-1 text-xs font-bold text-signal-deep ring-1 ring-inset ring-signal/30">
                        {row.record.overtimeHours}s
                      </span>
                    ) : row.record ? (
                      <span className="text-faint">0s</span>
                    ) : (
                      <span className="text-faint">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-ink">
                    {row.record ? `${row.record.totalHours}s` : <span className="text-faint">-</span>}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {row.record ? (
                      row.record.grossAmount !== null ? (
                        <span className="text-ink">{row.record.grossAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-semibold" title="Personele saatlik ücret tanımlanmamış">
                          <AlertTriangle className="h-3 w-3" /> Ücret Yok
                        </span>
                      )
                    ) : (
                      <span className="text-faint">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {!row.record ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-paper-deep px-2.5 py-1 text-xs font-bold text-muted">
                        Hesaplanmadı
                      </span>
                    ) : row.record.isLocked ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-soft px-2.5 py-1 text-xs font-bold text-sage-deep ring-1 ring-inset ring-sage/30">
                        <Lock className="h-3 w-3" /> Kilitli
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-bold text-signal-deep ring-1 ring-inset ring-signal/30">
                        <Unlock className="h-3 w-3" /> Düzeltmeye Açık
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {row.record?.isLocked && (
                      <button
                        onClick={() => handleUnlock(row.record!.id)}
                        disabled={loading !== null}
                        className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-muted shadow-card hover:bg-paper hover:text-signal-deep transition-all disabled:opacity-50"
                      >
                        {loading === `unlock-${row.record.id}` ? <Unlock className="h-3 w-3 animate-spin" /> : <Unlock className="h-3 w-3" />}
                        Kilidi Aç
                      </button>
                    )}
                    {!row.record?.isLocked && row.record && (
                      <span className="text-xs text-faint italic">Kapatma Bekliyor</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-line bg-paper">
              <tr>
                <td colSpan={2} className="px-6 py-4 font-bold text-ink text-right">Aylık Toplam:</td>
                <td className="px-6 py-4 text-right font-bold text-muted">{totalNormal.toFixed(2)}s</td>
                <td className="px-6 py-4 text-right font-bold text-signal-deep">{totalOvertime.toFixed(2)}s</td>
                <td className="px-6 py-4 text-right font-bold text-ink text-lg">{totalGrand.toFixed(2)}s</td>
                <td colSpan={3}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
