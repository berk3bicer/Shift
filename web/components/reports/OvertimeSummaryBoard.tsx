"use client";

import type { OvertimeSummaryDto } from "@/lib/types";
import { FileBarChart, Clock, Calculator, UserRound } from "lucide-react";

export default function OvertimeSummaryBoard({
  summaries,
  periodStart,
  periodEnd,
}: {
  summaries: OvertimeSummaryDto[];
  periodStart: string;
  periodEnd: string;
}) {
  const periodLabel = `${new Date(periodStart).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} – ${new Date(periodEnd).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}`;
  // periodStart'tan ay+yıl türet (props zaten geliyor — yeni prop gerekmez).
  const periodTitle = new Date(periodStart).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-ink">Aylık Mesai Özeti</h1>
          <p className="text-sm text-muted">Personelin puantaj kayıtlarından otomatik hesaplanan normal ve fazla mesai saatleri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-line bg-surface overflow-hidden shadow-card">
          <div className="border-b border-line bg-paper px-6 py-4 flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-muted" />
            <h2 className="font-display text-base font-bold text-ink">Personel Mesai Raporu ({periodTitle})</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-muted">
              <thead className="border-b border-line bg-paper text-xs font-semibold uppercase text-muted">
                <tr>
                  <th className="px-6 py-4">Personel</th>
                  <th className="px-6 py-4">Dönem</th>
                  <th className="px-6 py-4 text-right">Normal Çalışma</th>
                  <th className="px-6 py-4 text-right">Fazla Mesai</th>
                  <th className="px-6 py-4 text-right font-bold text-ink">Toplam Saat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {summaries.map(s => (
                  <tr key={s.userId} className="hover:bg-paper transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-deep text-muted">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-ink">{s.userFullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-muted">
                      {periodLabel}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-muted">
                      {s.normalHours}s
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.overtimeHours > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-cream px-2 py-1 text-xs font-bold text-signal-deep ring-1 ring-inset ring-signal/30">
                          {s.overtimeHours}s
                        </span>
                      ) : (
                        <span className="text-faint">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-ink">
                      {s.totalHours}s
                    </td>
                  </tr>
                ))}

                {summaries.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-muted">
                      Bu döneme ait mesai kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-sage/40 bg-sage-soft/60 p-6 shadow-card">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-sage-soft p-3 text-sage-deep">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-sage-deep">İş Kanunu Kuralları</h3>
                <p className="text-sm text-sage-deep leading-relaxed">
                  Sistem, fazla mesaiyi <strong>haftalık 45 saat</strong> eşiğine göre hesaplar. Aylık toplam çalışma üzerinden doğrudan çıkarım yapmaz, her haftayı kendi içinde değerlendirerek doğru sonucu bulur.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-card">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-faint" />
              Ayın Özeti
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-line">
                <span className="text-sm text-muted">Toplam Normal Süre</span>
                <span className="font-semibold text-ink">{summaries.reduce((acc, curr) => acc + curr.normalHours, 0)}s</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-line">
                <span className="text-sm text-muted">Toplam Fazla Mesai</span>
                <span className="font-bold text-signal-deep">{summaries.reduce((acc, curr) => acc + curr.overtimeHours, 0)}s</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-ink">Genel Toplam</span>
                <span className="text-lg font-bold text-ink">{summaries.reduce((acc, curr) => acc + curr.totalHours, 0)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
