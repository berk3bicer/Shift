import { redirect } from "next/navigation";
import { getMe, getNotifications, getBranches, ApiError } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import { isManager } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";
import NotificationBell from "@/components/NotificationBell";
import BranchSwitcher from "@/components/BranchSwitcher";
import AppNav from "@/components/AppNav";
import ShiftleMark from "@/components/brand/ShiftleMark";
import Wordmark from "@/components/brand/Wordmark";
import type { BranchDto, NotificationDto } from "@/lib/types";

// Korumalı uygulama düzeni. Sunucuda /me ile kullanıcıyı çözer (token geçersizse
// 401 → login'e). Üst bar: marka + nav (AppNav, aktif sekme + mobil menü) + şube
// seçici + bildirim + kullanıcı + çıkış.
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
    <div className="min-h-screen bg-paper">
      {/* Üst bar espresso (Tur "Sıcak Kahve") — içerik AÇIK kalır (main + bg-paper).
          Koyu kabuk panele "ürün" ağırlığı verir ve pazarlama sitesiyle aynı dili konuşur. */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-espresso-line bg-espresso px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ShiftleMark className="h-7 w-7" variant="onDark" />
            <Wordmark className="text-lg text-foam" />
            <span className="hidden text-xs font-medium text-latte sm:inline">Yönetici</span>
          </div>
          <div className="hidden lg:block">
            <AppNav />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <BranchSwitcher branches={branches} currentId={currentBranchId} tone="dark" />
          </div>
          <NotificationBell initialNotifications={notifications} tone="dark" />
          <div className="hidden h-6 w-px bg-espresso-line sm:block" />
          <span className="hidden items-center gap-2 text-sm md:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-signal text-xs font-bold text-espresso">
              {name ? name.charAt(0) : "?"}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-semibold text-foam">{name}</span>
              {role && <span className="text-[10px] text-latte">{role}</span>}
            </span>
          </span>
          <div className="hidden sm:block">
            <LogoutButton tone="dark" />
          </div>
          {/* Mobil: hamburger (menü içinde şube seçici + çıkış da var) */}
          <div className="lg:hidden">
            <AppNav
              mobileExtras={
                /* Mobil menü paneli AÇIK zemin — varsayılan (light) ton doğru olan. */
                <div className="flex items-center justify-between gap-3">
                  <BranchSwitcher branches={branches} currentId={currentBranchId} />
                  <LogoutButton />
                </div>
              }
            />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-4 sm:p-6">{children}</main>
    </div>
  );
}
