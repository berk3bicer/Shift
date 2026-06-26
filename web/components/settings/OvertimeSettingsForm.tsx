"use client";

import { useState } from "react";
import type { OvertimeSettingsDto } from "@/lib/types";
import { updateOvertimeSettings, ApiClientError } from "@/lib/api-client";
import { Settings, Save, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OvertimeSettingsForm({
  initialSettings,
}: {
  initialSettings: OvertimeSettingsDto;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<OvertimeSettingsDto>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    
    try {
      await updateOvertimeSettings(formData);
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">İşletme Ayarları</h1>
        <p className="text-sm text-slate-500">Çarpanlar ve mesai kuralları gibi işletme genelini ilgilendiren ayarları yapılandırın.</p>
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
          Ayarlar başarıyla kaydedildi!
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-slate-500" />
          <h2 className="text-base font-bold text-slate-800">Mesai ve Çarpan Ayarları</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Haftalık Mesai Eşiği (Saat)</label>
              <p className="text-xs text-slate-500">Bu süreyi aşan çalışmalar fazla mesai sayılır (İş Kanunu: 45).</p>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.weeklyOvertimeThresholdHours}
                onChange={e => setFormData({ ...formData, weeklyOvertimeThresholdHours: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Fazla Mesai Çarpanı</label>
              <p className="text-xs text-slate-500">Fazla mesailerin ücreti hesaplanırken kullanılacak katsayı (Örn: %50 zam için 1.5).</p>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.overtimeMultiplier}
                onChange={e => setFormData({ ...formData, overtimeMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Gece Çalışma Çarpanı</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.nightMultiplier}
                onChange={e => setFormData({ ...formData, nightMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Hafta Sonu Çarpanı</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.weekendMultiplier}
                onChange={e => setFormData({ ...formData, weekendMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Resmi Tatil Çarpanı</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.holidayMultiplier}
                onChange={e => setFormData({ ...formData, holidayMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Giriş / Çıkış Toleransları (Grace Period)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Erken Giriş Toleransı (Dakika)</label>
                <p className="text-xs text-slate-500">Vardiya başlamadan X dakika önce girilirse, ekstra mesai yazılmaz.</p>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.earlyClockInToleranceMinutes || 0}
                  onChange={e => setFormData({ ...formData, earlyClockInToleranceMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Geç Çıkış Toleransı (Dakika)</label>
                <p className="text-xs text-slate-500">Vardiya bitiminden sonra X dakika geç çıkılırsa, normal süreye yuvarlanır.</p>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.lateClockOutToleranceMinutes || 0}
                  onChange={e => setFormData({ ...formData, lateClockOutToleranceMinutes: Number(e.target.value) })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 transition-all"
          >
            {saving ? <AlertTriangle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Ayarları Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
