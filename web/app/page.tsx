import { redirect } from "next/navigation";
import { getMe, getBranches, ApiError } from "@/lib/api-server";
import { homePathFor, isManager } from "@/lib/roles";

// Kök: role göre yönlendir. Yönetici → /dashboard, Staff → /today.
// Kurulum tespiti (Part C, saf frontend): yönetici + 0 şube → henüz kurulmamış →
// /onboarding. Şube > 0 ise normal panel. Backend'e sıfır dokunuş (migration yok).
// Staff bu dala girmez (davetle gelir, şubesi vardır → getBranches çağrılmaz).
// Oturum yoksa (401) login'e. redirect() try dışında çağrılır (NEXT_REDIRECT throw'unu
// catch yutmasın diye).
export default async function Home() {
  let target: string;
  try {
    const me = await getMe();
    if (isManager(me.roles)) {
      const branches = await getBranches();
      target = branches.length === 0 ? "/onboarding" : "/dashboard";
    } else {
      target = homePathFor(me.roles);
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }
  redirect(target);
}
