import Link from "next/link";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/api-server";
import { ApiError } from "@/lib/api-server";
import LogoutButton from "@/components/LogoutButton";

// Korumalı uygulama düzeni. Sunucuda /me ile kullanıcıyı çözer (token geçersizse
// 401 → login'e). Üst bar: marka + kullanıcı + çıkış.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let name: string | null = null;
  let role = "";
  try {
    const me = await getMe();
    name = me.name;
    role = me.roles[0] ?? "";
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

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
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {name}
            {role && <span className="ml-1 text-gray-400">({role})</span>}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-6">{children}</main>
    </div>
  );
}
