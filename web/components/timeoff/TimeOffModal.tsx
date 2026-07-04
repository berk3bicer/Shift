"use client";

import { useState } from "react";
import type { TimeOffRequestDto } from "@/lib/types";
import { TimeOffType, TimeOffStatus } from "@/lib/types";
import { createTimeOffRequest, ApiClientError } from "@/lib/api-client";
import { UserRound, X } from "lucide-react";

// Personel SEÇİCİ YOK — bilinçli. Backend izin talebini HER ZAMAN login olan kullanıcı
// adına kaydeder (token'dan; gövdedeki userId yok sayılır). Seçici olsaydı "Ayşe için
// izin" seçilse bile kayıt login kullanıcıya düşer → F5'te yanlış isim (eski bug). Bu
// yüzden talep sahibi = oturum sahibi olarak sabit gösterilir. Yönetici adına oluşturma
// backend'de desteklenmiyor (GAP #timeoff-create-for-staff).
export default function TimeOffModal({
  currentUserId,
  currentUserName,
  onClose,
  onCreated,
}: {
  currentUserId: string;
  currentUserName: string | null;
  onClose: () => void;
  onCreated: (req: TimeOffRequestDto) => void;
}) {
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [type, setType] = useState<number>(TimeOffType.Annual);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (endDate < startDate) { setError("Bitiş tarihi başlangıç tarihinden önce olamaz."); return; }

    setSaving(true);
    try {
      const { id } = await createTimeOffRequest({
        userId: currentUserId,
        startDate,
        endDate,
        type,
        note: note.trim() || null,
      });

      // Optimistic görünüm backend gerçeğiyle tutarlı: kayıt login kullanıcı adına
      // düşer, o yüzden isim de oturum sahibinin adı (F5 sonrası da aynısı gelir).
      const newReq: TimeOffRequestDto = {
        id,
        userId: currentUserId,
        userFullName: currentUserName,
        startDate,
        endDate,
        type,
        status: TimeOffStatus.Pending, // Yeni talepler her zaman Pending'dir
        reason: note.trim() || null,
        decisionNote: null,
        decidedByUserId: null,
        decidedByUserFullName: null,
      };

      onCreated(newReq);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Talep kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl bg-surface p-6 shadow-float ring-1 ring-ink/5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">İzin Talebi Ekle</h2>
            <p className="text-sm text-muted mt-1">Kendi adınıza yeni bir izin (Time Off) talebi oluşturun.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-faint hover:bg-paper-deep hover:text-ink transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Talep Sahibi</label>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-cream text-xs font-bold text-signal-deep">
                {currentUserName ? currentUserName.charAt(0) : <UserRound className="h-4 w-4" />}
              </span>
              <span className="font-medium">{currentUserName ?? "Siz"}</span>
            </div>
            <p className="text-xs text-faint">İzin talebi kendi adınıza oluşturulur.</p>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">İzin Tipi</label>
            <select
              value={type}
              onChange={(e) => setType(Number(e.target.value))}
              className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
            >
              <option value={TimeOffType.Annual}>Yıllık İzin</option>
              <option value={TimeOffType.Sick}>Hastalık</option>
              <option value={TimeOffType.Excuse}>Mazeret</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-muted">Başlangıç Tarihi</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-sm font-semibold text-muted">Bitiş Tarihi</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Not (Opsiyonel)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Örn: Hastane randevusu..."
              className="w-full rounded-xl border border-line-strong px-4 py-2.5 text-sm text-ink placeholder:text-faint focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-paper-deep transition-colors">
            Vazgeç
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-signal px-6 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Kaydediliyor..." : "Talep Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}
