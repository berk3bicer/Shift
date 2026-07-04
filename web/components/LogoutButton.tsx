"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
      className="rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-paper-deep hover:text-ink disabled:opacity-60"
    >
      Çıkış
    </button>
  );
}
