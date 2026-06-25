import { redirect } from "next/navigation";

// Kök: çizelgeye yönlendir. Oturum yoksa proxy /login'e çevirir.
export default function Home() {
  redirect("/schedule");
}
