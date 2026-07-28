"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// tone: bu buton üç yerde render ediliyor — yönetici üst barı (ESPRESSO, tone="dark"),
// mobil hamburger paneli ve staff başlığı (ikisi de açık yüzey). Varsayılan "light"
// bilinçli: koyu zemin İSTİSNA, çağıran açıkça söyler; yeni açık yüzeyler kendiliğinden
// doğru kalır (latte/roast beyaz üstünde okunmaz).
export default function LogoutButton({ tone = "light" }: { tone?: "dark" | "light" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const dark = tone === "dark";

  async function onLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      onClick={onLogout}
      disabled={loading}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        dark
          ? "border-espresso-line text-latte hover:bg-roast hover:text-foam"
          : "border-line-strong text-muted hover:bg-paper-deep hover:text-ink"
      }`}
    >
      Çıkış
    </button>
  );
}
