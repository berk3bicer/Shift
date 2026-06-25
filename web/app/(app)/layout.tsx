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
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">Shift</span>
          <span className="text-sm text-gray-400">Yönetici</span>
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
