"use client";

import { useState } from "react";
import type { TaskItemDto, BranchDto, PositionDto, StaffDto } from "@/lib/types";
import { moveTask, createTask, deleteTask, uploadPhoto } from "@/lib/api-client";
import { Plus, Trash2, GripVertical, Camera, Image as ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function TasksBoard({
  initialTasks,
  branch,
  positions,
  staff,
}: {
  initialTasks: TaskItemDto[];
  branch: BranchDto;
  positions: PositionDto[];
  staff: StaffDto[];
}) {
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskItemDto[]>(initialTasks);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50");
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent, newStatus: number) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    const task = tasks.find((t) => t.id === taskId);
    
    if (!task || task.status === newStatus) return;

    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      await moveTask(taskId, newStatus);
      router.refresh();
    } catch (err: any) {
      setTasks(previousTasks); // rollback
      setError(err.message || "Görev taşınırken hata oluştu.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Bu görevi silmek istediğinize emin misiniz?")) return;
    
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== taskId));

    try {
      await deleteTask(taskId);
      router.refresh();
    } catch (err: any) {
      setTasks(previousTasks);
      setError(err.message || "Görev silinirken hata oluştu.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handlePhotoUpload = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTaskId(taskId);
    try {
      const url = await uploadPhoto(file, "task", taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, photoUrl: url } : t));
    } catch {
      setError("Fotoğraf yüklenemedi.");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingTaskId(null);
      e.target.value = '';
    }
  };

  // Create Task Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<number>(1);
  const [category, setCategory] = useState<number>(0);
  const [assigneeType, setAssigneeType] = useState<"none" | "user" | "position">("none");
  const [assigneeId, setAssigneeId] = useState<string>("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await createTask({
        branchId: branch.id,
        title,
        description: description || null,
        priority,
        category,
        assignedUserId: assigneeType === "user" ? assigneeId : null,
        assignedPositionId: assigneeType === "position" ? assigneeId : null,
      });
      setIsModalOpen(false);
      setTitle("");
      setDescription("");
      setAssigneeType("none");
      setAssigneeId("");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Oluşturulamadı");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: { id: number; label: string; bgColor: string }[] = [
    { id: 0, label: "Yapılacak", bgColor: "bg-slate-100" },
    { id: 1, label: "Devam Ediyor", bgColor: "bg-blue-50/50" },
    { id: 2, label: "Tamamlandı", bgColor: "bg-emerald-50/50" },
  ];

  const getPriorityLabel = (p: number) => {
    switch(p) {
      case 0: return { label: "Düşük", color: "text-slate-600 bg-slate-100" };
      case 1: return { label: "Orta", color: "text-amber-700 bg-amber-100" };
      case 2: return { label: "Yüksek", color: "text-rose-700 bg-rose-100" };
      case 3: return { label: "Acil", color: "text-white bg-red-600" };
      default: return { label: "Orta", color: "text-amber-700 bg-amber-100" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Görev Panosu</h1>
          <p className="mt-1 text-sm text-slate-500">
            {branch.name} şubesi için görev yönetimi
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Yeni Görev
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 text-sm font-medium text-rose-800 border border-rose-200">
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[600px] pb-6">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`flex flex-col rounded-xl border border-slate-200 ${col.bgColor}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className="p-4 border-b border-slate-200/50 flex items-center justify-between bg-white/50 rounded-t-xl">
              <h3 className="font-bold text-slate-800">{col.label}</h3>
              <span className="flex items-center justify-center h-6 min-w-6 px-1.5 rounded-full bg-white text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto space-y-3 relative">
              {tasks.filter(t => t.status === col.id).map(task => {
                const prio = getPriorityLabel(task.priority);
                const isDone = task.status === 2;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`group bg-white rounded-xl p-4 border ${isDone ? 'border-emerald-200/50 opacity-80' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative`}
                  >
                    {/* Drag Handle Icon */}
                    <div className="absolute top-4 right-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4" />
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2 pr-6">
                      <h4 className={`font-semibold leading-tight ${isDone ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                        {task.title}
                      </h4>
                    </div>
                    
                    {task.description && (
                      <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed">{task.description}</p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${prio.color}`}>
                        {prio.label}
                      </span>
                    </div>

                    {/* Fotoğraf Önizlemesi */}
                    {task.photoUrl && (
                      <div className="mb-4 relative group rounded-lg overflow-hidden border border-slate-200">
                        <img src={task.photoUrl} alt="Görev Kanıtı" className="w-full h-24 object-cover" />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-white shadow-sm" />
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        {task.assignedUserName ? (
                          <>
                            <div className="h-5 w-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px]">
                              {task.assignedUserName.charAt(0)}
                            </div>
                            <span className="text-slate-700">{task.assignedUserName}</span>
                          </>
                        ) : task.assignedPositionName ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            Rol: {task.assignedPositionName}
                          </span>
                        ) : (
                          <span className="text-slate-400">Atanmadı</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Fotoğraf Yükleme Butonu */}
                        {uploadingTaskId === task.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        ) : (
                          <label className="cursor-pointer text-slate-400 hover:text-indigo-600 transition-colors" title="Kanıt Fotoğrafı Yükle">
                            <Camera className="h-4 w-4" />
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handlePhotoUpload(task.id, e)} 
                            />
                          </label>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task.id);
                          }}
                          className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {tasks.filter(t => t.status === col.id).length === 0 && (
                <div className="absolute inset-4 flex items-center justify-center border-2 border-dashed border-slate-300/50 rounded-xl pointer-events-none">
                  <span className="text-sm font-medium text-slate-400">Görev sürükleyin</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Yeni Görev</h2>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Başlık</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="Örn: Mutfak derin temizliği"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama (İsteğe bağlı)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Öncelik</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={0}>Düşük</option>
                    <option value={1}>Orta</option>
                    <option value={2}>Yüksek</option>
                    <option value={3}>Acil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value={0}>Temizlik</option>
                    <option value={1}>Servis</option>
                    <option value={2}>Mutfak</option>
                    <option value={3}>Tedarik</option>
                    <option value={4}>Teknik</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kime Atanacak?</label>
                <select
                  value={assigneeType}
                  onChange={(e) => {
                    setAssigneeType(e.target.value as any);
                    setAssigneeId("");
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 mb-2"
                >
                  <option value="none">Atanmamış (Havuz)</option>
                  <option value="user">Bir Personele</option>
                  <option value="position">Bir Pozisyona (Tüm Garsonlar vb.)</option>
                </select>

                {assigneeType === "user" && (
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Personel Seçin</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                  </select>
                )}

                {assigneeType === "position" && (
                  <select
                    required
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">Pozisyon Seçin</option>
                    {positions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Oluşturuluyor..." : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
