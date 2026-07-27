"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BranchDto, PositionDto, StaffDto } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { resendInvite, deactivateStaff, ApiClientError } from "@/lib/api-client";
import { Users, Plus, Mail, MailPlus, UserX, ShieldCheck } from "lucide-react";
import TeamModal from "./TeamModal";

type Feedback = { type: "success" | "error"; text: string } | null;

// Personel rol etiketleri (number[] → TR). Genelde tek rol; yine de hepsini birleştir.
function roleLabel(roles: number[]): string {
  const labels = roles.map((r) => ROLE_LABELS[r] ?? "—").filter(Boolean);
  return labels.length ? labels.join(", ") : "—";
}

export default function TeamBoard({
  staff,
  branches,
  positions,
}: {
  staff: StaffDto[];
  branches: BranchDto[];
  positions: PositionDto[];
}) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function onInvited(email: string) {
    setModalOpen(false);
    setFeedback({ type: "success", text: `Davet gönderildi, ${email} adresine e-posta yollandı.` });
    router.refresh();
  }

  async function onResend(member: StaffDto) {
    setFeedback(null);
    setPendingId(member.id);
    try {
      await resendInvite(member.id);
      setFeedback({ type: "success", text: `Davet ${member.email} adresine yeniden gönderildi.` });
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof ApiClientError ? err.message : "İşlem başarısız." });
    } finally {
      setPendingId(null);
    }
  }

  async function onDeactivate(member: StaffDto) {
    if (!confirm(`${member.fullName} pasifleştirilsin mi? Girişi kapanır (kayıt silinmez).`)) return;
    setFeedback(null);
    setPendingId(member.id);
    try {
      await deactivateStaff(member.id);
      setFeedback({ type: "success", text: `${member.fullName} pasifleştirildi.` });
      router.refresh();
    } catch (err) {
      setFeedback({ type: "error", text: err instanceof ApiClientError ? err.message : "İşlem başarısız." });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold text-ink">Ekip</h1>
          <p className="text-sm text-muted">Personeli davet edin, bekleyen davetleri yineleyin, ayrılanları pasifleştirin.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="group flex items-center gap-1.5 rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal"
        >
          <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
          <span>Personel Ekle</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm shadow-card border ${
            feedback.type === "error" ? "bg-red-50/50 text-red-800 border-red-200" : "bg-cream/60 text-signal-deep border-signal/30"
          }`}
          role="status"
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity" aria-label="Kapat">✕</button>
        </div>
      )}

      {staff.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-2xl border border-dashed border-line-strong bg-paper">
          <Users className="mb-4 h-12 w-12 text-faint" />
          <h3 className="text-sm font-semibold text-ink">Henüz personel yok</h3>
          <p className="mt-1 text-xs text-muted">İlk personelinizi davet ederek başlayın.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-paper text-left text-xs font-semibold uppercase tracking-wider text-faint">
                <th className="px-4 py-3">Personel</th>
                <th className="hidden px-4 py-3 sm:table-cell">Pozisyon</th>
                <th className="px-4 py-3">Rol</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const busy = pendingId === member.id;
                return (
                  <tr key={member.id} className={`border-b border-line last:border-0 transition-opacity ${busy ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-xs font-bold text-signal-deep">
                          {member.fullName.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-ink">{member.fullName}</div>
                          <div className="flex items-center gap-1 truncate text-xs text-muted">
                            <Mail className="h-3 w-3 shrink-0 text-faint" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 text-muted sm:table-cell">{member.positionName ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-paper-deep px-2 py-1 text-xs font-semibold text-ink">
                        <ShieldCheck className="h-3 w-3 text-faint" />
                        {roleLabel(member.roles)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {member.isActive ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Beklemede / Pasif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {member.isActive ? (
                        <button
                          onClick={() => onDeactivate(member)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <UserX className="h-3.5 w-3.5" />
                          Pasifleştir
                        </button>
                      ) : (
                        <button
                          onClick={() => onResend(member)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold text-muted hover:border-signal/40 hover:bg-cream hover:text-signal-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <MailPlus className="h-3.5 w-3.5" />
                          Daveti Tekrar Gönder
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <TeamModal
          branches={branches}
          positions={positions}
          onClose={() => setModalOpen(false)}
          onInvited={onInvited}
        />
      )}
    </div>
  );
}
