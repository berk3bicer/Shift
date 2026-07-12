import { redirect } from "next/navigation";
import { getMe, getNotifications, ApiError } from "@/lib/api-server";
import { isManager } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import type { NotificationDto } from "@/lib/types";

// Personel (Staff) kabuğu — mobil öncelikli, sade. Yönetici üst-barından (çoklu menü,
// şube seçici) FARKLI: tek başlık + bildirim zili + çıkış. Bu düzen M/O-only uçları
// (getBranches/getStaff) ÇAĞIRMAZ — Staff onlara 403 alır.
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  let name: string | null = null;
  let notifications: NotificationDto[] = [];
  let manager = false;
  try {
    const me = await getMe();
    // GUARD: Yönetici bu Staff grubuna düşmemeli → kendi paneline.
    if (isManager(me.roles)) {
      manager = true;
    } else {
      name = me.name;
      notifications = await getNotifications();
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }
  if (manager) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface px-4">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-lg font-bold text-ink">
            Shiftle<span className="text-signal">.</span>
          </span>
          <span className="text-xs font-medium text-faint">{name ?? ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell initialNotifications={notifications} />
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-lg p-4">{children}</main>
    </div>
  );
}
