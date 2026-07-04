"use client";

import { useState } from "react";
import type { AnnouncementDto, BranchDto } from "@/lib/types";
import { createAnnouncement } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Megaphone, Plus, X, Users, Briefcase } from "lucide-react";

export default function AnnouncementsBoard({
  initialAnnouncements,
  branch,
  currentUserId,
  canAnnounce,
}: {
  initialAnnouncements: AnnouncementDto[];
  branch: BranchDto;
  currentUserId: string;
  canAnnounce: boolean;
}) {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>(initialAnnouncements);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState<number | "all">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const roleVal = targetRole === "all" ? null : Number(targetRole);

    const tempId = "mock-ann-" + Date.now();
    const newAnn: AnnouncementDto = {
      id: tempId,
      title: title.trim(),
      body: content.trim(),
      branchId: branch.id,
      targetRole: roleVal,
      createdByUserId: currentUserId,
      createdByUserName: "Siz (Mevcut Kullanıcı)",
      createdAt: new Date().toISOString()
    };

    // Optimistic Update
    setAnnouncements(prev => [newAnn, ...prev]);
    setIsModalOpen(false);
    setTitle("");
    setContent("");
    setTargetRole("all");

    try {
      await createAnnouncement({
        branchId: branch.id,
        title: newAnn.title,
        body: newAnn.body,
        targetRole: roleVal
      });

      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Duyuru paylaşılamadı");
      setAnnouncements(prev => prev.filter(a => a.id !== tempId)); // Rollback
    } finally {
      setIsSubmitting(false);
    }
  };

  const sortedAnns = [...announcements].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      
      {/* Başlık Alanı */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-signal-deep" />
            Duyurular
          </h1>
          <p className="mt-1 text-sm text-muted">
            {branch.name} için yayınlanan tüm duyurular.
          </p>
        </div>
        {canAnnounce && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-bold text-ink hover:bg-signal-deep hover:text-white transition-colors"
          >
            <Plus className="h-4 w-4" />
            Yeni Yayınla
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Duyuru Akışı (Feed) */}
      <div className="space-y-4">
        {sortedAnns.length === 0 ? (
          <div className="bg-surface border-2 border-dashed border-line rounded-2xl p-12 text-center">
            <Megaphone className="h-10 w-10 text-faint mx-auto mb-3" />
            <p className="text-muted font-medium">Henüz bir duyuru yayınlanmamış.</p>
          </div>
        ) : (
          sortedAnns.map(ann => (
            <div key={ann.id} className="bg-surface rounded-2xl shadow-card border border-line p-6 flex gap-4 transition-all hover:shadow-card relative overflow-hidden">
              <div className="flex-shrink-0 mt-1">
                <div className="h-10 w-10 rounded-full bg-cream flex items-center justify-center font-bold text-signal-deep text-sm">
                  {ann.createdByUserName ? ann.createdByUserName.charAt(0) : '?'}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-ink">{ann.title}</h3>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted mt-1">
                      <span>{ann.createdByUserName}</span>
                      <span>•</span>
                      <span>{new Date(ann.createdAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  {/* Hedef Kitle Rozeti */}
                  <div className={`px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 ${ann.targetRole === null ? 'bg-sage-soft text-sage-deep' : 'bg-terra-soft text-terra'}`}>
                    {ann.targetRole === null ? (
                      <><Users className="h-3 w-3" /> Herkese</>
                    ) : (
                      <><Briefcase className="h-3 w-3" /> Özel Rol</>
                    )}
                  </div>
                </div>
                <div className="text-sm text-ink whitespace-pre-wrap leading-relaxed mt-3 bg-paper p-4 rounded-xl">
                  {ann.body}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Yeni Duyuru Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface shadow-float overflow-hidden flex flex-col">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-signal-deep" />
                Yeni Duyuru Yayınla
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-faint hover:text-ink transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Başlık</label>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-line-strong px-4 py-2.5 text-sm focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20"
                    placeholder="Örn: Yeni Maaş Promosyonları Hakkında"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Mesajınız</label>
                  <textarea
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full rounded-xl border border-line-strong bg-surface text-ink px-4 py-3 text-sm focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 min-h-[120px] resize-none placeholder:text-faint"
                    placeholder="Duyuru içeriğini buraya yazın..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-muted mb-1">Hedef Kitle</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="w-full rounded-xl border border-line-strong px-4 py-2.5 text-sm focus:border-signal focus:outline-none focus:ring-2 focus:ring-signal/20 bg-surface"
                  >
                    <option value="all">Tüm Şube (Herkese)</option>
                    <option value={1}>Sadece Yöneticiler (Managers)</option>
                    <option value={2}>Sadece Mutfak/Bar Ekibi</option>
                  </select>
                  <p className="text-[11px] text-muted mt-1.5">
                    Seçtiğiniz kitleye anında bildirim (Notification) gönderilecektir (Fan-out).
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-line bg-paper flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-muted hover:bg-paper-deep transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-signal px-6 py-2.5 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white disabled:opacity-50 transition-all active:scale-95"
                >
                  {isSubmitting ? "Yayınlanıyor..." : "Yayınla"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
