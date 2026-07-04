import type { BranchDto, ShiftDto, TimeOffRequestDto, ShiftNoteDto, StaffDto, PositionDto } from "@/lib/types";
import { Clock, Calendar, MessageSquare, AlertCircle, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function DashboardBoard({
  branch,
  todayShifts,
  pendingTimeOffs,
  recentNotes,
  staffList,
  positions,
  userName,
  todayStr
}: {
  branch: BranchDto;
  todayShifts: ShiftDto[];
  pendingTimeOffs: TimeOffRequestDto[];
  recentNotes: ShiftNoteDto[];
  staffList: StaffDto[];
  positions: PositionDto[];
  userName: string;
  todayStr: string;
}) {
  return (
    <div className="space-y-8">
      {/* Karşılama */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Günaydın, {userName.split(" ")[0]}! ☀️</h1>
        <p className="mt-2 text-muted font-medium">
          {branch.name} için bugünün ({todayStr}) özeti.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Bugün Kimler Çalışıyor? */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-2xl shadow-card border border-line overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Users className="h-5 w-5 text-signal-deep" />
                Bugünkü Vardiyalar
              </h2>
              <Link href="/schedule" className="text-sm font-semibold text-signal-deep hover:text-ink">
                Tüm Çizelgeyi Gör &rarr;
              </Link>
            </div>
            <div className="divide-y divide-line">
              {todayShifts.length === 0 ? (
                <div className="p-8 text-center text-muted">Bugün için planlanmış bir vardiya bulunmuyor.</div>
              ) : (
                todayShifts.map(shift => {
                  const staff = staffList.find(s => s.id === shift.userId);
                  const pos = positions.find(p => p.id === shift.positionId);
                  
                  // startTime ve endTime sadece saat kısmı (ISO'dan)
                  const formatTime = (iso: string) => {
                    const d = new Date(iso);
                    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
                  };

                  return (
                    <div key={shift.id} className="p-4 flex items-center justify-between hover:bg-paper transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-paper-deep flex items-center justify-center font-bold text-muted border border-line">
                          {staff?.fullName.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-ink">{staff?.fullName || "Açık Vardiya"}</p>
                          <div className="flex items-center gap-2 text-xs font-medium mt-0.5">
                            <span className="px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pos?.colorCode || '#a39889' }}>
                              {pos?.name || "Bilinmiyor"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-paper-deep px-3 py-1.5 rounded-lg text-sm font-bold text-muted">
                        <Clock className="h-4 w-4 text-faint" />
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Son Vardiya Notları */}
          <div className="bg-surface rounded-2xl shadow-card border border-line overflow-hidden">
            <div className="p-5 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-sage-deep" />
                Son Vardiya Notları
              </h2>
              <Link href="/shift-notes" className="text-sm font-semibold text-signal-deep hover:text-ink">
                Deftere Git &rarr;
              </Link>
            </div>
            <div className="p-5 space-y-4 bg-paper">
              {recentNotes.length === 0 ? (
                <p className="text-muted text-sm text-center py-4">Yakın zamanda not bırakılmamış.</p>
              ) : (
                recentNotes.slice(0, 3).map(note => (
                  <div key={note.id} className="bg-surface p-4 rounded-xl border border-line shadow-card relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-ink bg-paper-deep px-2 py-1 rounded">
                        {note.createdByUserName ?? "Bilinmeyen"}
                      </span>
                      <span className="text-[11px] font-semibold text-faint">
                        {new Date(note.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-muted line-clamp-2">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Dikkat Gerektirenler */}
        <div className="col-span-1 space-y-6">
          <div className="bg-surface rounded-2xl shadow-card border border-signal/30 overflow-hidden">
            <div className="p-5 border-b border-signal/20 bg-cream flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-signal-deep" />
              <h2 className="font-display text-lg font-bold text-ink">Bekleyen İzinler</h2>
            </div>
            <div className="p-1">
              {pendingTimeOffs.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-sage mx-auto mb-2" />
                  <p className="text-muted font-medium text-sm">Bekleyen işlem yok.</p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {pendingTimeOffs.map(req => (
                    <div key={req.id} className="p-4 flex flex-col gap-2 hover:bg-paper transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-ink">{req.userFullName}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${req.type === 0 ? 'bg-sage-soft text-sage-deep' : 'bg-terra-soft text-terra'}`}>
                          {req.type === 0 ? "Yıllık İzin" : "Mazeret İzni"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted">
                        <Calendar className="h-3.5 w-3.5 text-faint" />
                        {req.startDate} {req.startDate !== req.endDate ? ` - ${req.endDate}` : ""}
                      </div>
                      <Link href="/timeoff" className="mt-2 w-full rounded-lg bg-cream py-2 text-center text-xs font-bold text-signal-deep transition-colors hover:bg-signal hover:text-ink">
                        İncele
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
