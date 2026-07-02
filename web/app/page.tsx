import { redirect } from "next/navigation";
import { getMe, ApiError } from "@/lib/api-server";
import { homePathFor } from "@/lib/roles";

// Kök: role göre yönlendir. Yönetici → /dashboard, Staff → /today.
// Oturum yoksa (401) login'e. redirect() try dışında çağrılır (NEXT_REDIRECT throw'unu
// catch yutmasın diye).
export default async function Home() {
  let roles: string[];
  try {
    const me = await getMe();
    roles = me.roles;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }
  redirect(homePathFor(roles));
}
