"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import type { NotificationDto } from "@/lib/types";
import { markNotificationAsRead, fetchNotifications } from "@/lib/api-client";
import { useRouter } from "next/navigation";

// Zili canlı tutan poll aralığı. SignalR/websocket bu turun kapsamı değil (#13 gap);
// yeni duyuru F5 olmadan makul gecikmeyle düşsün diye hafif polling yeterli.
const POLL_MS = 45_000;

// Backend NotificationType enum'ı (int) → kullanıcıya gösterilecek başlık + tıklama hedefi.
// 0=ShiftPublished, 1=LateClockIn, 2=TaskAssigned, 3=TaskCompleted, 4=AnnouncementPosted,
// 5=ShiftUpForGrabs, 6=ShiftPoolActionRequested, 7=ShiftTaken, 8=ShiftPoolApproved,
// 9=ShiftPoolRejected, 10=TimeOffRequested, 11=TimeOffApproved, 12=TimeOffRejected.
const NOTIFICATION_META: Record<number, { label: string; href: string }> = {
  0: { label: "Vardiya Programı", href: "/schedule" },
  1: { label: "Geç Giriş", href: "/timeclock" },
  2: { label: "Görev Atandı", href: "/tasks" },
  3: { label: "Görev Tamamlandı", href: "/tasks" },
  4: { label: "Yeni Duyuru", href: "/announcements" },
  5: { label: "Havuzda Açık Vardiya", href: "/schedule" },
  6: { label: "Vardiya Onayı Bekliyor", href: "/schedule" },
  7: { label: "Vardiya Dolduruldu", href: "/schedule" },
  8: { label: "Vardiya Talebin Onaylandı", href: "/schedule" },
  9: { label: "Vardiya Talebin Reddedildi", href: "/schedule" },
  10: { label: "İzin Talebi", href: "/timeoff" },
  11: { label: "İzin Onaylandı", href: "/timeoff" },
  12: { label: "İzin Reddedildi", href: "/timeoff" },
};

export default function NotificationBell({ initialNotifications }: { initialNotifications: NotificationDto[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);

  // Optimistic okundu işaretlerini poll ezmesin: yerel olarak okunmuş id'leri tut,
  // sunucudan gelen listeye uygula (backend commit'i yakalayana kadar flicker olmasın).
  const readIdsRef = useRef<Set<string>>(new Set());

  // Canlı tazeleme: sekme görünürken aralıkla bildirimleri yeniden çek. Sekme arka
  // plandayken durdur (gereksiz istek yok), hata sessiz geçilir.
  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      if (document.hidden) return;
      try {
        const fresh = await fetchNotifications();
        if (cancelled) return;
        setNotifications(
          fresh.map((n) => (readIdsRef.current.has(n.id) ? { ...n, isRead: true } : n)),
        );
      } catch {
        // Sessiz geç — zil kritik değil, bir sonraki tur yeniden dener.
      }
    }

    const timer = setInterval(refresh, POLL_MS);
    // Sekmeye geri dönünce hemen tazele (bekleyen aralığı bekleme).
    const onVisible = () => { if (!document.hidden) refresh(); };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notif: NotificationDto) => {
    if (!notif.isRead) {
      // Optimistic mark as read
      readIdsRef.current.add(notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try {
        await markNotificationAsRead(notif.id);
      } catch {
        // Rollback on fail silently
      }
    }

    setIsOpen(false);

    const target = NOTIFICATION_META[notif.type]?.href;
    if (target) {
      router.push(target);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Bildirimler"
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-paper-deep hover:text-ink focus:outline-none"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full border border-surface bg-signal-deep"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface shadow-float">
          <div className="flex items-center justify-between border-b border-line bg-paper p-3">
            <h3 className="text-sm font-bold text-ink">Bildirimler</h3>
            {unreadCount > 0 && (
              <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-signal-deep">
                {unreadCount} yeni
              </span>
            )}
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted">
                Hiç bildiriminiz yok.
              </div>
            ) : (
              <div className="divide-y divide-line">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full gap-3 p-4 text-left transition-colors hover:bg-paper ${!notif.isRead ? 'bg-cream/50' : ''}`}
                  >
                    {!notif.isRead && (
                      <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-signal" />
                    )}
                    <div className={!notif.isRead ? 'ml-0' : 'ml-5'}>
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-ink' : 'font-medium text-muted'}`}>
                        {NOTIFICATION_META[notif.type]?.label ?? "Bildirim"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {notif.message}
                      </p>
                      <p className="mt-2 text-[10px] font-semibold text-faint">
                        {new Date(notif.createdAt).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
