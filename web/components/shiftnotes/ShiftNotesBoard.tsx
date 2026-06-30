"use client";

import { useState } from "react";
import type { ShiftNoteDto, BranchDto } from "@/lib/types";
import { createShiftNote, deleteShiftNote } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { Send, Trash2, Clock, AlertCircle } from "lucide-react";

export default function ShiftNotesBoard({
  initialNotes,
  branch,
  noteDate,
  currentUserId,
  currentUserRoles,
}: {
  initialNotes: ShiftNoteDto[];
  branch: BranchDto;
  noteDate: string;
  currentUserId: string;
  currentUserRoles: string[];
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<ShiftNoteDto[]>(initialNotes);
  const [newContent, setNewContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Gün 17 - Capability (Yetenek) Mantığı:
  // UI'da "silebilir mi?" kararını rol üzerinden türetiyoruz. Backend de aynısını yapacak.
  const canDeleteAny = currentUserRoles.includes("Owner") || currentUserRoles.includes("Manager");

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const tempId = "mock-sn-" + Date.now();
    const newNote: ShiftNoteDto = {
      id: tempId,
      branchId: branch.id,
      noteDate,
      content: newContent.trim(),
      createdByUserId: currentUserId,
      createdByUserName: "Siz (Mevcut Kullanıcı)", // optimistic geçici ad; refresh'te gerçek ad gelir
      createdAt: new Date().toISOString()
    };

    // Optimistic UI update: Yeni notu akışa ekle (Üste ekleyelim)
    setNotes(prev => [newNote, ...prev]);
    setNewContent("");

    try {
      await createShiftNote({
        branchId: branch.id,
        noteDate,
        content: newNote.content
      });

      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Not eklenemedi");
      // Rollback
      setNotes(prev => prev.filter(n => n.id !== tempId));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    const previousNotes = [...notes];
    
    // Optimistic Delete
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      await deleteShiftNote(id);
      if (process.env.NEXT_PUBLIC_USE_MOCK !== "true") {
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Not silinemedi");
      setTimeout(() => setError(null), 3000);
      setNotes(previousNotes); // Rollback
    }
  };

  // Notları tarihe göre yeniden eskiye (en son yazılan en üstte) sırala
  const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Başlık Alanı */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Vardiya Defteri</h1>
        <p className="mt-1 text-sm text-slate-500 flex items-center gap-2">
          {branch.name} şubesi operasyonel handoff notları • {noteDate}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 p-4 flex items-center gap-3 text-sm font-medium text-rose-800 border border-rose-200">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Yeni Not Ekleme Alanı (En üstte) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <form onSubmit={handleAddNote} className="flex flex-col gap-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Bir sonraki vardiya veya ekip arkadaşlarınız için not bırakın..."
            className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[100px] resize-none placeholder:text-slate-400"
            required
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400">
              Not: Yazılan notlar düzenlenemez. Yanlışsa silip yenisini ekleyin.
            </span>
            <button
              type="submit"
              disabled={isSubmitting || !newContent.trim()}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              Not Bırak
            </button>
          </div>
        </form>
      </div>

      {/* Akış (Feed) */}
      <div className="space-y-4 pt-4">
        {sortedNotes.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-500 font-medium">Bu tarihte henüz bir not bırakılmamış.</p>
          </div>
        ) : (
          sortedNotes.map(note => {
            const isMine = note.createdByUserId === currentUserId;
            const canDelete = canDeleteAny || isMine;

            return (
              <div key={note.id} className={`bg-white rounded-xl shadow-sm border ${isMine ? 'border-indigo-200' : 'border-slate-200'} p-5 relative group transition-all hover:shadow-md`}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${isMine ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                      {note.createdByUserName ? note.createdByUserName.charAt(0) : '?'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {note.createdByUserName ?? "Bilinmeyen kullanıcı"}
                      </h4>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Clock className="h-3 w-3" />
                        {new Date(note.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete Button */}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-md hover:bg-rose-50 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Notu Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed pl-11">
                  {note.content}
                </div>
                
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
