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
        <h1 className="text-3xl font-bold text-slate-900">Günaydın, {userName.split(" ")[0]}! ☀️</h1>
        <p className="mt-2 text-slate-500 font-medium">
          {branch.name} şubesi için bugünün ({todayStr}) özetini inceliyorsunuz.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Bugün Kimler Çalışıyor? */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Bugünkü Vardiyalar
              </h2>
              <Link href="/schedule" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                Tüm Çizelgeyi Gör &rarr;
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {todayShifts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">Bugün için planlanmış bir vardiya bulunmuyor.</div>
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
                    <div key={shift.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                          {staff?.fullName.charAt(0) || "?"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{staff?.fullName || "Açık Vardiya"}</p>
                          <div className="flex items-center gap-2 text-xs font-medium mt-0.5">
                            <span className="px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: pos?.colorCode || '#64748b' }}>
                              {pos?.name || "Bilinmiyor"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-bold text-slate-700">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Son Vardiya Notları */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-sky-500" />
                Son Vardiya Notları
              </h2>
              <Link href="/shift-notes" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
                Deftere Git &rarr;
              </Link>
            </div>
            <div className="p-5 space-y-4 bg-slate-50/50">
              {recentNotes.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-4">Yakın zamanda not bırakılmamış.</p>
              ) : (
                recentNotes.slice(0, 3).map(note => (
                  <div key={note.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                        {note.createdByUserName ?? "Bilinmeyen"}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {new Date(note.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 line-clamp-2">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Dikkat Gerektirenler */}
        <div className="col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-rose-200 overflow-hidden">
            <div className="p-5 border-b border-rose-100 bg-rose-50/50 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <h2 className="text-lg font-bold text-rose-900">Bekleyen İzinler</h2>
            </div>
            <div className="p-1">
              {pendingTimeOffs.length === 0 ? (
                <div className="p-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">Bekleyen işlem yok.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {pendingTimeOffs.map(req => (
                    <div key={req.id} className="p-4 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-sm text-slate-900">{req.userFullName}</span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${req.type === 0 ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'}`}>
                          {req.type === 0 ? "Yıllık İzin" : "Mazeret İzni"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {req.startDate} {req.startDate !== req.endDate ? ` - ${req.endDate}` : ""}
                      </div>
                      <Link href="/timeoff" className="mt-2 w-full text-center text-xs font-bold text-rose-600 bg-rose-50 py-1.5 rounded hover:bg-rose-100 transition-colors">
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
