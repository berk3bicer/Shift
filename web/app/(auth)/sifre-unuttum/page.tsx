"use client";

import { useState } from "react";
import Link from "next/link";

// Şifremi unuttum: e-posta girilir, backend kayıtlıysa sıfırlama linki yollar.
// Cevap her durumda aynı ("varsa gönderildi") — e-posta sistemde var mı bilgisi sızmaz.
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.title ?? "İstek gönderilemedi.");
        return;
      }
      setSent(true);
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
          <h1 className="font-display text-xl font-bold text-ink">Shift<span className="text-signal">.</span></h1>
          <p className="text-sm text-muted">Şifrenizi mi unuttunuz?</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {sent ? (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            E-posta adresiniz kayıtlıysa sıfırlama bağlantısı gönderildi.
            Gelen kutunuzu kontrol edin.
          </div>
        ) : (
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium text-muted">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal placeholder:text-faint"
              placeholder="ornek@kafe.com"
            />
          </div>
        )}

        {!sent && (
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
          >
            {loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
          </button>
        )}

        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-signal-deep hover:underline">
            Girişe dön
          </Link>
        </p>
      </form>
    </main>
  );
}
