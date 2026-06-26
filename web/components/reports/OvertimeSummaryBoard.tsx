"use client";

import type { OvertimeSummaryDto } from "@/lib/types";
import { FileBarChart, Clock, Calculator, UserRound } from "lucide-react";

export default function OvertimeSummaryBoard({
  summary,
}: {
  summary: OvertimeSummaryDto[];
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Aylık Mesai Özeti</h1>
          <p className="text-sm text-slate-500">Personelin puantaj kayıtlarından otomatik hesaplanan normal ve fazla mesai saatleri.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-slate-500" />
            <h2 className="text-base font-bold text-slate-800">Personel Mesai Raporu (Haziran 2026)</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Personel</th>
                  <th className="px-6 py-4">Dönem</th>
                  <th className="px-6 py-4 text-right">Normal Çalışma</th>
                  <th className="px-6 py-4 text-right">Fazla Mesai</th>
                  <th className="px-6 py-4 text-right font-bold text-slate-900">Toplam Saat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.map(s => (
                  <tr key={s.userId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-slate-900">{s.userFullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-500">
                      {new Date(s.periodStart).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} 
                      &nbsp;–&nbsp; 
                      {new Date(s.periodEnd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                      {s.totalNormalHours}s
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.totalOvertimeHours > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                          {s.totalOvertimeHours}s
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">
                      {s.grandTotalHours}s
                    </td>
                  </tr>
                ))}
                
                {summary.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-slate-500">
                      Bu döneme ait mesai kaydı bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <Calculator className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-emerald-900">İş Kanunu Kuralları</h3>
                <p className="text-sm text-emerald-800/80 leading-relaxed">
                  Sistem, fazla mesaiyi <strong>haftalık 45 saat</strong> eşiğine göre hesaplar. Aylık toplam çalışma üzerinden doğrudan çıkarım yapmaz, her haftayı kendi içinde değerlendirerek doğru sonucu bulur.
                </p>
              </div>
            </div>
          </div>
          
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-400" />
              Ayın Özeti
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm text-slate-600">Toplam Normal Süre</span>
                <span className="font-semibold text-slate-900">{summary.reduce((acc, curr) => acc + curr.totalNormalHours, 0)}s</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <span className="text-sm text-slate-600">Toplam Fazla Mesai</span>
                <span className="font-bold text-amber-600">{summary.reduce((acc, curr) => acc + curr.totalOvertimeHours, 0)}s</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-semibold text-slate-900">Genel Toplam</span>
                <span className="text-lg font-bold text-slate-900">{summary.reduce((acc, curr) => acc + curr.grandTotalHours, 0)}s</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
