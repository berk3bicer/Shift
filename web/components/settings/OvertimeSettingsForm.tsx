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
        <h1 className="font-display text-2xl font-bold text-ink">İşletme Ayarları</h1>
        <p className="text-sm text-muted">Çarpanlar ve mesai kuralları gibi işletme genelini ilgilendiren ayarları yapılandırın.</p>
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
        <div className="rounded-xl border border-sage/40 bg-sage-soft p-4 text-sm font-medium text-sage-deep">
          Ayarlar başarıyla kaydedildi!
        </div>
      )}

      <form onSubmit={onSubmit} className="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
        <div className="border-b border-line bg-paper px-6 py-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-muted" />
          <h2 className="font-display text-base font-bold text-ink">Mesai ve Çarpan Ayarları</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted">Haftalık Mesai Eşiği (Saat)</label>
              <p className="text-xs text-muted">Bu süreyi aşan çalışmalar fazla mesai sayılır (İş Kanunu: 45).</p>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.weeklyOvertimeThresholdHours}
                onChange={e => setFormData({ ...formData, weeklyOvertimeThresholdHours: Number(e.target.value) })}
                className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted">Fazla Mesai Çarpanı</label>
              <p className="text-xs text-muted">Fazla mesailerin ücreti hesaplanırken kullanılacak katsayı (Örn: %50 zam için 1.5).</p>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.overtimeMultiplier}
                onChange={e => setFormData({ ...formData, overtimeMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted">Gece Çalışma Çarpanı</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.nightMultiplier}
                onChange={e => setFormData({ ...formData, nightMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted">Hafta Sonu Çarpanı</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.weekendMultiplier}
                onChange={e => setFormData({ ...formData, weekendMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-muted">Resmi Tatil Çarpanı</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={formData.holidayMultiplier}
                onChange={e => setFormData({ ...formData, holidayMultiplier: Number(e.target.value) })}
                className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-line">
            <h3 className="text-sm font-bold text-ink mb-1">Gece Çalışma Penceresi</h3>
            <p className="text-xs text-muted mb-4">Bu saat aralığına değen vardiyalar gece çarpanıyla primlenir (tüm vardiya). Varsayılan 22:00–06:00.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted">Gece Başlangıcı</label>
                <input
                  type="time"
                  value={formData.nightStart}
                  onChange={e => setFormData({ ...formData, nightStart: e.target.value })}
                  className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-muted">Gece Bitişi</label>
                <input
                  type="time"
                  value={formData.nightEnd}
                  onChange={e => setFormData({ ...formData, nightEnd: e.target.value })}
                  className="w-full rounded-xl border border-line-strong px-3 py-2 text-sm text-ink focus:border-signal focus:ring-1 focus:ring-signal"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-line bg-paper px-6 py-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white disabled:opacity-60 transition-all"
          >
            {saving ? <AlertTriangle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Ayarları Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}
