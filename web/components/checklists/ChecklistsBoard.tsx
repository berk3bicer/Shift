"use client";

import { useState, useEffect } from "react";
import type { ChecklistDto, ChecklistRunDto, ChecklistRunItemDto, BranchDto } from "@/lib/types";
import { startChecklistRun, checkChecklistItem, createChecklist, deleteChecklist, updateChecklist, uploadPhoto } from "@/lib/api-client";
import { Play, CheckSquare, Square, CheckCircle2, Clock, Plus, X, ListPlus, Trash2, Edit2, Camera, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ChecklistsBoard({
  checklists,
  initialRuns,
  branch,
  runDate
}: {
  checklists: ChecklistDto[];
  initialRuns: ChecklistRunDto[];
  branch: BranchDto;
  runDate: string;
}) {
  const router = useRouter();

  // Optimistic UX için local state, ama prop değişince (router.refresh sonrası server
  // taze veriyle render eder) DB gerçeğine RESYNC ederiz — useState tek başına ilk
  // mount'tan sonra prop'u yok sayardı (bayatlama). Kaynak nihai olarak DB.
  const [runs, setRuns] = useState<ChecklistRunDto[]>(initialRuns);
  const [localChecklists, setLocalChecklists] = useState<ChecklistDto[]>(checklists);
  useEffect(() => { setRuns(initialRuns); }, [initialRuns]);
  useEffect(() => { setLocalChecklists(checklists); }, [checklists]);

  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingRunItemId, setUploadingRunItemId] = useState<string | null>(null);
  const [tplName, setTplName] = useState("");
  const [tplType, setTplType] = useState<number>(0);
  const [tplItems, setTplItems] = useState<{ id: string; text: string }[]>([
    { id: "1", text: "" }
  ]);

  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 3000);
  };

  // Çalıştırma başlat: sahte optimistic YOK. Gerçek uç → router.refresh → DB'den oku.
  const handleStartRun = async (checklistId: string) => {
    if (isStarting) return;
    setError(null);
    setIsStarting(checklistId);
    try {
      await startChecklistRun({ branchId: branch.id, checklistId, runDate });
      router.refresh(); // yeni run + maddeleri DB'den gelir
    } catch (err: any) {
      flashError(err.message || "Başlatılamadı");
    } finally {
      setIsStarting(null);
    }
  };

  // Madde işaretle: optimistic flip (snappy) + gerçek uç; başarıda DB'den tazele
  // (kim/ne zaman + tamamlanma damgası gerçek gelsin), hatada geri al.
  const handleToggleCheck = async (runId: string, item: ChecklistRunItemDto) => {
    const newIsChecked = !item.isChecked;
    const previousRuns = runs;

    setRuns(prev => prev.map(r => {
      if (r.id !== runId) return r;
      const items = r.items.map(i => i.id === item.id ? { ...i, isChecked: newIsChecked } : i);
      const allChecked = items.every(i => i.isChecked);
      return { ...r, items, completedAt: allChecked ? new Date().toISOString() : null };
    }));

    try {
      await checkChecklistItem(runId, item.id, newIsChecked);
      router.refresh();
    } catch (err: any) {
      setRuns(previousRuns); // rollback
      flashError(err.message || "İşaretlenemedi");
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = tplItems.map(i => i.text.trim()).filter(t => t !== "");
    if (items.length === 0) {
      flashError("En az 1 geçerli madde girmelisiniz.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      // Backend madde metinlerini string[] bekler (sıra = indeks).
      const payload = { name: tplName, type: tplType, items };
      if (editingId) {
        await updateChecklist(editingId, payload);
      } else {
        await createChecklist(payload);
      }
      handleCloseModal();
      router.refresh(); // şablon listesi DB'den tazelensin
    } catch (err: any) {
      flashError(err.message || "İşlem başarısız oldu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTplName("");
    setTplType(0);
    setTplItems([{ id: "1", text: "" }]);
    setIsModalOpen(true);
  };

  const openEditModal = (checklist: ChecklistDto) => {
    setEditingId(checklist.id);
    setTplName(checklist.name);
    setTplType(checklist.type);
    setTplItems(checklist.items.map(i => ({ id: Math.random().toString(), text: i.text })));
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!window.confirm("Bu şablonu silmek istediğinize emin misiniz? (Geçmiş çalıştırmalar etkilenmez)")) return;

    const previous = localChecklists;
    setLocalChecklists(prev => prev.filter(c => c.id !== id)); // optimistic

    try {
      await deleteChecklist(id);
      router.refresh();
    } catch (err: any) {
      setLocalChecklists(previous); // rollback
      flashError(err.message || "Şablon silinemedi");
    }
  };

  // Foto kanıt: uploadPhoto presigned+confirm ile Attachment'ı DB'ye YAZAR. Sonra
  // router.refresh → run detayı attachments[]'i presigned URL ile geri okur (reload'da
  // kalıcı). Anlık önizleme için dönen objectURL'i optimistic ekleriz.
  const handlePhotoUpload = async (runId: string, item: ChecklistRunItemDto, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRunItemId(item.id);
    try {
      const previewUrl = await uploadPhoto(file, "checklist", item.id);
      setRuns(prev => prev.map(r => r.id === runId ? {
        ...r,
        items: r.items.map(i => i.id === item.id
          ? { ...i, attachments: [...i.attachments, { id: "temp-" + Date.now(), fileName: file.name, contentType: file.type, downloadUrl: previewUrl }] }
          : i)
      } : r));
      router.refresh(); // kalıcı presigned URL ile resync
    } catch {
      flashError("Fotoğraf yüklenemedi.");
    } finally {
      setUploadingRunItemId(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Kontrol Listeleri</h1>
          <p className="mt-1 text-sm text-muted">
            {branch.name} için rutin listeleri ({runDate})
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-signal px-4 py-2 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white transition-colors"
        >
          <ListPlus className="h-4 w-4" />
          Yeni Şablon Ekle
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-800 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Sol Taraf: Şablonlar */}
        <div className="col-span-1 space-y-4">
          <h2 className="font-display text-lg font-bold text-ink border-b pb-2">Şablonlar</h2>

          {localChecklists.length === 0 && (
            <div className="text-sm text-muted p-4 border border-dashed border-line rounded-lg text-center">
              Henüz bir şablon bulunmuyor.
            </div>
          )}

          {localChecklists.map(checklist => {
            const hasRunToday = runs.some(r => r.checklistId === checklist.id);

            return (
              <div key={checklist.id} className="bg-surface rounded-xl p-5 border border-line shadow-card flex flex-col gap-4 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-ink">{checklist.name}</h3>
                    <p className="text-sm text-muted mt-1">{checklist.items.length} Madde</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(checklist)}
                      className="text-faint hover:text-signal-deep p-1.5 rounded hover:bg-cream"
                      title="Şablonu Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(checklist.id)}
                      className="text-faint hover:text-red-500 p-1.5 rounded hover:bg-red-50"
                      title="Şablonu Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleStartRun(checklist.id)}
                  disabled={hasRunToday || isStarting === checklist.id}
                  className={`flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    hasRunToday
                      ? "bg-paper-deep text-faint cursor-not-allowed"
                      : "bg-sage-soft text-sage-deep hover:bg-sage/25 border border-sage/40"
                  }`}
                >
                  {isStarting === checklist.id ? (
                    "Başlatılıyor..."
                  ) : hasRunToday ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" /> Bugün Başlatıldı
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" /> Yeni Başlat
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Sağ Taraf: Aktif Çalıştırmalar (Runs) */}
        <div className="col-span-1 lg:col-span-2 space-y-4">
          <h2 className="font-display text-lg font-bold text-ink border-b pb-2">Aktif Listeler (Bugün)</h2>

          {runs.length === 0 && (
            <div className="bg-paper border-2 border-dashed border-line rounded-xl p-8 text-center">
              <p className="text-muted font-medium">Bugün henüz bir kontrol listesi başlatılmadı.</p>
              <p className="text-sm text-faint mt-1">Sol taraftaki şablonlardan birini başlatabilirsiniz.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runs.map(run => {
              const isCompleted = !!run.completedAt;
              const progress = run.items.length
                ? Math.round((run.items.filter(i => i.isChecked).length / run.items.length) * 100)
                : 0;

              return (
                <div key={run.id} className={`bg-surface rounded-xl border ${isCompleted ? 'border-sage/50 shadow-card' : 'border-line'} shadow-card overflow-hidden flex flex-col`}>

                  {/* Header */}
                  <div className={`p-4 border-b ${isCompleted ? 'bg-sage-soft/60' : 'bg-paper'} flex items-start justify-between`}>
                    <div>
                      <h3 className="font-bold text-ink">{run.checklistName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(run.startedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {run.startedByUserName && (
                          <>
                            <span>•</span>
                            <span>{run.startedByUserName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 bg-sage-soft text-sage-deep px-2 py-1 rounded text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        Tamamlandı
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-paper-deep">
                    <div
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-sage' : 'bg-signal'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Items */}
                  <div className="p-2 space-y-1 bg-paper flex-1">
                    {run.items.map(item => (
                      <div
                        key={item.id}
                        className={`w-full flex flex-col p-3 rounded-lg transition-colors ${
                          item.isChecked
                            ? "bg-paper-deep"
                            : "bg-surface hover:bg-paper border border-line shadow-card"
                        }`}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <button onClick={() => handleToggleCheck(run.id, item)} className={`mt-0.5 flex-shrink-0 ${item.isChecked ? 'text-sage' : 'text-faint'}`}>
                            {item.isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </button>

                          <div className="flex-1 flex justify-between items-start gap-2">
                            <div>
                              <span className={`text-sm font-medium ${item.isChecked ? 'line-through text-muted opacity-70' : 'text-ink'}`}>
                                {item.text}
                              </span>
                              {item.isChecked && item.checkedByUserName && (
                                <p className="text-[10px] text-faint mt-1 uppercase tracking-wide font-semibold">
                                  {item.checkedByUserName} onayladı
                                  {item.checkedAt && ` • ${new Date(item.checkedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`}
                                </p>
                              )}
                            </div>

                            {/* Fotoğraf Yükleme İkonu */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                              {uploadingRunItemId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-signal-deep" />
                              ) : (
                                <label className="cursor-pointer text-faint hover:text-signal-deep transition-colors" title="Kanıt Fotoğrafı Yükle">
                                  <Camera className="h-4 w-4" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handlePhotoUpload(run.id, item, e)}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Fotoğraf Kanıtları (reload'da kalıcı — attachments[]) */}
                        {item.attachments.length > 0 && (
                          <div className="ml-8 mt-3 flex flex-wrap gap-2">
                            {item.attachments.map(att => (
                              <a
                                key={att.id}
                                href={att.downloadUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="relative block rounded-lg overflow-hidden border border-line w-32"
                                title={att.fileName ?? "Kanıt"}
                              >
                                <img src={att.downloadUrl} alt="Kontrol Kanıtı" className="w-full h-20 object-cover" />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Şablon Ekleme Modalı */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface shadow-float overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-ink">{editingId ? "Şablonu Düzenle" : "Yeni Şablon Oluştur"}</h2>
              <button type="button" onClick={handleCloseModal} className="text-faint hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Şablon Adı</label>
                  <input
                    required
                    type="text"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                    placeholder="Örn: Haftalık Depo Sayımı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1">Türü</label>
                  <select
                    value={tplType}
                    onChange={(e) => setTplType(Number(e.target.value))}
                    className="w-full rounded-lg border border-line-strong px-3 py-2 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                  >
                    <option value={0}>Açılış Listesi</option>
                    <option value={1}>Kapanış Listesi</option>
                    <option value={2}>Özel Liste</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-muted">Maddeler</label>
                    <button
                      type="button"
                      onClick={() => setTplItems([...tplItems, { id: Math.random().toString(), text: "" }])}
                      className="text-xs font-semibold text-signal-deep hover:text-ink flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Madde Ekle
                    </button>
                  </div>

                  <div className="space-y-2">
                    {tplItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-faint w-4">{index + 1}.</span>
                        <input
                          required
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const updated = [...tplItems];
                            updated[index].text = e.target.value;
                            setTplItems(updated);
                          }}
                          className="flex-1 rounded-lg border border-line-strong px-3 py-1.5 text-sm focus:border-signal focus:outline-none focus:ring-1 focus:ring-signal"
                          placeholder="Madde metni..."
                        />
                        {tplItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTplItems(tplItems.filter(i => i.id !== item.id))}
                            className="text-faint hover:text-red-500 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-line bg-paper flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-muted hover:bg-paper-deep transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-signal px-6 py-2 text-sm font-bold text-ink shadow-card hover:bg-signal-deep hover:text-white disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
