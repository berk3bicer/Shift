"use client";

import { useState } from "react";
import type { ChecklistDto, ChecklistRunDto, ChecklistRunItemDto, BranchDto } from "@/lib/types";
import { startChecklistRun, checkChecklistItem, createChecklist, deleteChecklist, updateChecklist, uploadPhoto } from "@/lib/api-client";
import { Play, CheckSquare, Square, CheckCircle2, Clock, Plus, X, ListPlus, Trash2, Edit2, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
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
  // Lists
  const [runs, setRuns] = useState<ChecklistRunDto[]>(initialRuns);
  const [localChecklists, setLocalChecklists] = useState<ChecklistDto[]>(checklists);
  
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

  const handleStartRun = async (checklistId: string) => {
    if (isStarting) return;
    setError(null);
    setIsStarting(checklistId);
    
    const tpl = checklists.find(c => c.id === checklistId);
    if (tpl) {
      const newRun: ChecklistRunDto = {
        id: "mock-run-" + Date.now(),
        branchId: branch.id,
        checklistId: tpl.id,
        checklistName: tpl.name,
        runDate,
        startedAt: new Date().toISOString(),
        startedByUserId: "s1",
        startedByUserFullName: "Ahmet Yılmaz",
        completedAt: null,
        completedByUserId: null,
        completedByUserFullName: null,
        items: tpl.items.map(i => ({
          id: "ri-" + Date.now() + Math.random(),
          checklistRunId: "mock-run-" + Date.now(),
          text: i.text,
          orderIndex: i.orderIndex,
          isChecked: false,
          checkedAt: null,
          checkedByUserId: null,
          checkedByUserFullName: null
        }))
      };
      setRuns(prev => [...prev, newRun]);
    }

    try {
      await startChecklistRun({ branchId: branch.id, checklistId, runDate });
      // MOCK modda olduğumuz için router.refresh() yaparsak sunucudan [] gelir ve kaybolur.
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Başlatılamadı");
      setTimeout(() => setError(null), 3000);
      setRuns(runs); // Rollback
    } finally {
      setIsStarting(null);
    }
  };

  const handleToggleCheck = async (runId: string, item: ChecklistRunItemDto) => {
    // Optimistic Update
    const newIsChecked = !item.isChecked;
    const previousRuns = [...runs];

    const updatedRuns = runs.map(r => {
      if (r.id !== runId) return r;
      const updatedItems = r.items.map(i => i.id === item.id ? { ...i, isChecked: newIsChecked } : i);
      const isAllChecked = updatedItems.every(i => i.isChecked);
      return {
        ...r,
        items: updatedItems,
        completedAt: isAllChecked ? new Date().toISOString() : null,
      };
    });

    setRuns(updatedRuns);

    try {
      await checkChecklistItem(runId, item.id, newIsChecked);
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setRuns(previousRuns); // Rollback
      setError(err.message || "İşaretlenemedi");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = tplItems.filter(i => i.text.trim() !== "");
    if (validItems.length === 0) {
      setError("En az 1 geçerli madde girmelisiniz.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: tplName,
        type: tplType,
        items: validItems.map((v, idx) => ({ text: v.text, orderIndex: idx }))
      };

      if (editingId) {
        // Update
        await updateChecklist(editingId, payload);
        const updatedTpl: ChecklistDto = {
          id: editingId,
          name: tplName,
          type: tplType,
          isActive: true,
          items: payload.items.map(i => ({
            id: "mock-ci-" + Math.random(),
            checklistId: editingId,
            text: i.text,
            orderIndex: i.orderIndex
          }))
        };
        setLocalChecklists(prev => prev.map(c => c.id === editingId ? updatedTpl : c));
      } else {
        // Create
        const res = await createChecklist(payload);
        const newTpl: ChecklistDto = {
          id: res.checklistId,
          name: tplName,
          type: tplType,
          isActive: true,
          items: payload.items.map(i => ({
            id: "mock-ci-" + Math.random(),
            checklistId: res.checklistId,
            text: i.text,
            orderIndex: i.orderIndex
          }))
        };
        setLocalChecklists(prev => [...prev, newTpl]);
      }
      
      handleCloseModal();

      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "İşlem başarısız oldu");
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

    const previousChecklists = [...localChecklists];
    setLocalChecklists(prev => prev.filter(c => c.id !== id));

    try {
      await deleteChecklist(id);
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Şablon silinemedi");
      setTimeout(() => setError(null), 3000);
      setLocalChecklists(previousChecklists);
    }
  };

  const handlePhotoUpload = async (runId: string, item: ChecklistRunItemDto, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRunItemId(item.id);
    try {
      const url = await uploadPhoto(file, "checklist", item.id);
      setRuns(prev => prev.map(r => r.id === runId ? {
        ...r, 
        items: r.items.map(i => i.id === item.id ? { ...i, photoUrl: url } : i)
      } : r));
    } catch (err) {
      setError("Fotoğraf yüklenemedi.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingRunItemId(null);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kontrol Listeleri</h1>
          <p className="mt-1 text-sm text-slate-500">
            {branch.name} şubesi için rutin listeleri ({runDate})
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          <ListPlus className="h-4 w-4" />
          Yeni Şablon Ekle
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sol Taraf: Şablonlar */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Şablonlar</h2>
          
          {localChecklists.length === 0 && (
            <div className="text-sm text-slate-500 p-4 border border-dashed border-slate-200 rounded-lg text-center">
              Henüz bir şablon bulunmuyor.
            </div>
          )}

          {localChecklists.map(checklist => {
            const hasRunToday = runs.some(r => r.checklistId === checklist.id);

            return (
              <div key={checklist.id} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-slate-900">{checklist.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{checklist.items.length} Madde</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(checklist)}
                      className="text-slate-400 hover:text-indigo-600 p-1.5 rounded hover:bg-indigo-50"
                      title="Şablonu Düzenle"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(checklist.id)}
                      className="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-rose-50"
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
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
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
          <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">Aktif Listeler (Bugün)</h2>
          
          {runs.length === 0 && (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <p className="text-slate-500 font-medium">Bugün henüz bir kontrol listesi başlatılmadı.</p>
              <p className="text-sm text-slate-400 mt-1">Sol taraftaki şablonlardan birini başlatabilirsiniz.</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {runs.map(run => {
              const isCompleted = !!run.completedAt;
              const progress = Math.round((run.items.filter(i => i.isChecked).length / run.items.length) * 100);

              return (
                <div key={run.id} className={`bg-white rounded-xl border ${isCompleted ? 'border-emerald-300 shadow-emerald-100' : 'border-slate-200'} shadow-sm overflow-hidden flex flex-col`}>
                  
                  {/* Header */}
                  <div className={`p-4 border-b ${isCompleted ? 'bg-emerald-50/50' : 'bg-slate-50'} flex items-start justify-between`}>
                    <div>
                      <h3 className="font-bold text-slate-900">{run.checklistName}</h3>
                      <div className="flex items-center gap-2 mt-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {new Date(run.startedAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>•</span>
                        <span>{run.startedByUserFullName}</span>
                      </div>
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        Tamamlandı
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-100">
                    <div 
                      className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                      style={{ width: `${progress}%` }} 
                    />
                  </div>

                  {/* Items */}
                  <div className="p-2 space-y-1 bg-slate-50/50 flex-1">
                    {run.items.map(item => (
                      <div
                        key={item.id}
                        className={`w-full flex flex-col p-3 rounded-lg transition-colors ${
                          item.isChecked 
                            ? "bg-slate-100/50" 
                            : "bg-white hover:bg-slate-50 border border-slate-100 shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <button onClick={() => handleToggleCheck(run.id, item)} className={`mt-0.5 flex-shrink-0 ${item.isChecked ? 'text-emerald-500' : 'text-slate-300'}`}>
                            {item.isChecked ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5" />}
                          </button>
                          
                          <div className="flex-1 flex justify-between items-start gap-2">
                            <div>
                              <span className={`text-sm font-medium ${item.isChecked ? 'line-through text-slate-500 opacity-70' : 'text-slate-700'}`}>
                                {item.text}
                              </span>
                              {item.isChecked && item.checkedByUserFullName && (
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide font-semibold">
                                  {item.checkedByUserFullName} onayladı
                                </p>
                              )}
                            </div>

                            {/* Fotoğraf Yükleme İkonu */}
                            <div className="flex-shrink-0 flex flex-col items-center">
                              {uploadingRunItemId === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                              ) : (
                                <label className="cursor-pointer text-slate-300 hover:text-indigo-600 transition-colors" title="Kanıt Fotoğrafı Yükle">
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

                        {/* Fotoğraf Önizlemesi */}
                        {item.photoUrl && (
                          <div className="ml-8 mt-3 relative group rounded-lg overflow-hidden border border-slate-200 w-32">
                            <img src={item.photoUrl} alt="Kontrol Kanıtı" className="w-full h-20 object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-white shadow-sm" />
                            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Şablonu Düzenle" : "Yeni Şablon Oluştur"}</h2>
              <button type="button" onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTemplate} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Şablon Adı</label>
                  <input
                    required
                    type="text"
                    value={tplName}
                    onChange={(e) => setTplName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Örn: Haftalık Depo Sayımı"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Türü</label>
                  <select
                    value={tplType}
                    onChange={(e) => setTplType(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={0}>Açılış Listesi</option>
                    <option value={1}>Kapanış Listesi</option>
                    <option value={2}>Özel Liste</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700">Maddeler</label>
                    <button
                      type="button"
                      onClick={() => setTplItems([...tplItems, { id: Math.random().toString(), text: "" }])}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Madde Ekle
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {tplItems.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400 w-4">{index + 1}.</span>
                        <input
                          required
                          type="text"
                          value={item.text}
                          onChange={(e) => {
                            const updated = [...tplItems];
                            updated[index].text = e.target.value;
                            setTplItems(updated);
                          }}
                          className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          placeholder="Madde metni..."
                        />
                        {tplItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setTplItems(tplItems.filter(i => i.id !== item.id))}
                            className="text-slate-400 hover:text-rose-500 p-1"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
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
