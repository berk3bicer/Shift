"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import ShiftleMark from "@/components/brand/ShiftleMark";
import Wordmark from "@/components/brand/Wordmark";

// Şifre sıfırlama: e-postadaki linkten gelinir (link 1 saat geçerli, tek kullanım).
export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Backend ResetPasswordValidator ile aynalı: en az 6 karakter.
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== passwordAgain) {
      setError("Şifreler aynı değil.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.title ?? "Şifre sıfırlanamadı.");
        return;
      }
      setDone(true);
      setTimeout(() => router.replace("/login"), 1500);
    } catch {
      setError("Sunucuya ulaşılamadı.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-line bg-surface p-8 shadow-card"
      >
        <div>
          <h1 className="flex items-center gap-2">
            <ShiftleMark className="h-8 w-8" />
            <Wordmark className="text-xl text-ink" />
          </h1>
          <p className="text-sm text-muted">Yeni şifrenizi belirleyin</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {done && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Şifre güncellendi! Girişe yönlendiriliyorsunuz…
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-muted">
            Yeni şifre
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal placeholder:text-faint"
            placeholder="En az 6 karakter"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="passwordAgain" className="text-sm font-medium text-muted">
            Yeni şifre (tekrar)
          </label>
          <input
            id="passwordAgain"
            type="password"
            required
            value={passwordAgain}
            onChange={(e) => setPasswordAgain(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal placeholder:text-faint"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading || done}
          className="w-full rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
        >
          {loading ? "Kaydediliyor…" : "Şifreyi güncelle"}
        </button>
      </form>
    </main>
  );
}
