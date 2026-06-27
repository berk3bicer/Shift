import { redirect } from "next/navigation";

// Kök: dashboard'a yönlendir. Oturum yoksa proxy /login'e çevirir.
export default function Home() {
  redirect("/dashboard");
}
