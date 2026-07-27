"use client";

import { useState } from "react";
import type { BranchDto, PositionDto } from "@/lib/types";
import { ASSIGNABLE_ROLES, RoleType } from "@/lib/types";
import { createStaff, ApiClientError } from "@/lib/api-client";
import { X } from "lucide-react";

// Personel DAVET formu. Şifre alanı YOK — personel davet linkiyle kendi kurar.
// Rol dropdown'ı SADECE Yönetici/Asistan Yönetici/Personel (Owner+Supplier backend'de red).
export default function TeamModal({
  branches,
  positions,
  onClose,
  onInvited,
}: {
  branches: BranchDto[];
  positions: PositionDto[];
  onClose: () => void;
  onInvited: (email: string) => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<number>(RoleType.Staff);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [positionId, setPositionId] = useState(""); // "" = pozisyon yok
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const name = fullName.trim();
    if (!name) { setError("Ad soyad zorunludur."); return; }
    if (name.length > 200) { setError("Ad soyad en fazla 200 karakter olabilir."); return; }
    if (!email.trim()) { setError("E-posta zorunludur."); return; }
    if (!branchId) { setError("Şube seçmelisiniz."); return; }

    setSaving(true);
    try {
      await createStaff({
        fullName: name,
        email: email.trim(),
        role,
        branchId,
        // Pozisyon opsiyonel — boşsa null gönder ("" veya undefined DEĞİL).
        positionId: positionId || null,
      });
      onInvited(email.trim());
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Davet gönderilemedi.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "w-full rounded-xl border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-6 rounded-2xl bg-surface p-6 shadow-float ring-1 ring-ink/5 animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink">Personel Ekle</h2>
            <p className="text-sm text-muted mt-1">Davet e-postası gönderilir; personel şifresini kendi kurar.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 text-faint hover:bg-paper-deep hover:text-ink transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-800 border border-red-200">{error}</div>}

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Ad Soyad</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={200}
              placeholder="Örn: Ayşe Yılmaz"
              className={`${fieldClass} placeholder:text-faint`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@isletme.com"
              className={`${fieldClass} placeholder:text-faint`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Rol (Yetki)</label>
            <select
              value={role}
              onChange={(e) => setRole(Number(e.target.value))}
              className={`${fieldClass} cursor-pointer`}
            >
              {ASSIGNABLE_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Şube</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted">Pozisyon (Opsiyonel)</label>
            <select
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className={`${fieldClass} cursor-pointer`}
            >
              <option value="">— Belirtilmedi —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-line">
          <button type="button" onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-paper-deep transition-colors">
            Vazgeç
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-signal px-6 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {saving ? "Gönderiliyor..." : "Davet Gönder"}
          </button>
        </div>
      </form>
    </div>
  );
}
