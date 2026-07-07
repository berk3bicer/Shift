"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { MARKETING_URL } from "@/lib/config";

// Davet kabulü: e-postadaki linkten gelinir, personel şifresini KENDİ belirler
// (yönetici hiç görmez). Başarıda hesap aktifleşir → login'e yönlendiririz.
export default function AcceptInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  // KVKK açık rızası: personelin kişisel verisi ilk bu adımda aktifleşir → kutu zorunlu.
  // Onay DB'ye yazılmıyor — kalıcı rıza kanıtı gap #kvkk-kalici-riza-kaniti.
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Backend AcceptInviteValidator ile aynalı: en az 6 karakter.
    if (password.length < 6) {
      setError("Şifre en az 6 karakter olmalı.");
      return;
    }
    if (password !== passwordAgain) {
      setError("Şifreler aynı değil.");
      return;
    }
    if (!consent) {
      setError("Devam etmek için KVKK aydınlatma metnini onaylamalısınız.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.title ?? "Davet kabul edilemedi.");
        return;
      }
      setDone(true);
      // Kısa onay gösterip login'e geç (link tek kullanımlık — geri dönüş yok).
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
          <h1 className="font-display text-xl font-bold text-ink">Shift<span className="text-signal">.</span></h1>
          <p className="text-sm text-muted">Ekibe davet edildiniz — şifrenizi belirleyin</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        {done && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            Hesabınız aktif! Girişe yönlendiriliyorsunuz…
          </div>
        )}

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-muted">
            Şifre
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
            Şifre (tekrar)
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

        {/* KVKK rızası — metin marketing sitesinde (/kvkk), ayrı origin olduğu için env-driven URL. */}
        <label className="flex items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            <a
              href={`${MARKETING_URL}/kvkk`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-signal-deep hover:underline"
            >
              KVKK Aydınlatma Metni
            </a>
            &rsquo;ni okudum, kişisel verilerimin işlenmesini kabul ediyorum.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || done}
          className="w-full rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
        >
          {loading ? "Kaydediliyor…" : "Şifreyi belirle ve hesabı aç"}
        </button>
      </form>
    </main>
  );
}
