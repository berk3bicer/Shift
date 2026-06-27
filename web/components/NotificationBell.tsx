"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import type { NotificationDto } from "@/lib/types";
import { markNotificationAsRead } from "@/lib/api-client";
import { useRouter } from "next/navigation";

export default function NotificationBell({ initialNotifications }: { initialNotifications: NotificationDto[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationDto[]>(initialNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = async (notif: NotificationDto) => {
    if (!notif.isRead) {
      // Optimistic mark as read
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
      try {
        await markNotificationAsRead(notif.id);
      } catch {
        // Rollback on fail silently
      }
    }
    
    setIsOpen(false);
    
    if (notif.type === 1) {
      router.push("/announcements");
    } else if (notif.type === 2) {
      router.push("/schedule");
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none transition-colors rounded-full hover:bg-gray-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-sm font-bold text-gray-900">Bildirimler</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                {unreadCount} yeni
              </span>
            )}
          </div>
          
          <div className="max-h-[300px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">
                Hiç bildiriminiz yok.
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(notif => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-3 ${!notif.isRead ? 'bg-indigo-50/30' : ''}`}
                  >
                    {!notif.isRead && (
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0" />
                    )}
                    <div className={!notif.isRead ? 'ml-0' : 'ml-5'}>
                      <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2 font-semibold">
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
