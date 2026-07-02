import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe, getNotifications, getBranches, ApiError } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import { isManager } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import BranchSwitcher from "@/components/BranchSwitcher";
import type { BranchDto, NotificationDto } from "@/lib/types";

// Korumalı uygulama düzeni. Sunucuda /me ile kullanıcıyı çözer (token geçersizse
// 401 → login'e). Üst bar: marka + nav + şube seçici + kullanıcı + çıkış.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let name: string | null = null;
  let role = "";
  let notifications: NotificationDto[] = [];
  let branches: BranchDto[] = [];
  let currentBranchId = "";
  let staff = false;
  let needsOnboarding = false;
  try {
    const me = await getMe();
    // GUARD: Staff bu yönetici route grubuna girmemeli. getBranches/getStaff gibi
    // M/O-only uçları çağırmadan ÖNCE yönlendir — yoksa Staff'a 403 → 500 (eski bug).
    if (!isManager(me.roles)) {
      staff = true;
    } else {
      name = me.name;
      role = me.roles[0] ?? "";
      notifications = await getNotifications();
      branches = await getBranches();
      // Kurulum yapılmamış yönetici (0 şube) doğrudan /dashboard yazsa şube seçici boş
      // kalır → kuruluma yolla (Part C emniyet ağı; kök yönlendirmeyle aynı karar).
      if (branches.length === 0) {
        needsOnboarding = true;
      } else {
        currentBranchId = (await selectBranch(branches))?.id ?? "";
      }
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }
  if (staff) redirect("/today");
  if (needsOnboarding) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold text-gray-900">Shift</span>
            <span className="text-sm text-gray-400">Yönetici</span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-600 font-medium">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Ana Sayfa</Link>
            <Link href="/schedule" className="hover:text-gray-900 transition-colors">Çizelge</Link>
            
            <div className="group relative">
              <button className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none">
                Ekip & Puantaj
              </button>
              <div className="absolute left-0 mt-2 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <Link href="/timeclock" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Puantaj</Link>
                  <Link href="/timeoff" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">İzinler</Link>
                  <Link href="/availability" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Müsaitlik</Link>
                </div>
              </div>
            </div>

            <div className="group relative">
              <button className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none">
                Operasyon
              </button>
              <div className="absolute left-0 mt-2 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <Link href="/announcements" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Duyurular</Link>
                  <Link href="/shift-notes" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Vardiya Defteri</Link>
                  <Link href="/tasks" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Görevler</Link>
                  <Link href="/checklists" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Listeler</Link>
                </div>
              </div>
            </div>

            <div className="group relative">
              <button className="flex items-center gap-1 hover:text-gray-900 transition-colors focus:outline-none">
                Finans
              </button>
              <div className="absolute left-0 mt-2 w-40 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="py-1">
                  <Link href="/payroll" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Bordro</Link>
                  <Link href="/reports" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Raporlar</Link>
                </div>
              </div>
            </div>

            <Link href="/settings" className="hover:text-gray-900 transition-colors">Ayarlar</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <BranchSwitcher branches={branches} currentId={currentBranchId} />
          <NotificationBell initialNotifications={notifications} />
          <div className="h-6 w-px bg-gray-200"></div>
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
              {name ? name.charAt(0) : "?"}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold">{name}</span>
              {role && <span className="text-[10px] text-gray-400">{role}</span>}
            </div>
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
