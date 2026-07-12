"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MARKETING_URL } from "@/lib/config";

// İşletme tipleri backend BusinessType enum'una birebir (Cafe=0..FastFood=3).
// Register kafe odaklı MVP → Kafe varsayılan seçili.
const BUSINESS_TYPES = [
  { value: 0, label: "Kafe" },
  { value: 1, label: "Restoran" },
  { value: 2, label: "Fırın" },
  { value: 3, label: "Fast Food" },
];

// Client validation backend RegisterValidator ile aynalı: BusinessName/FullName NotEmpty,
// Email EmailAddress, Password MinimumLength(8), BusinessType 0..3.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // KVKK açık rızası: kutu işaretlenmeden submit backend'e gitmez (client-side gate).
  // Onayın kendisi henüz DB'ye yazılmıyor — kalıcı rıza kanıtı gap #kvkk-kalici-riza-kaniti.
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Backend validator ile aynı kurallar; sunucuya gitmeden önce kullanıcıyı uyar.
  function clientError(): string | null {
    if (!businessName.trim()) return "İşletme adı gerekli.";
    if (!fullName.trim()) return "Ad soyad gerekli.";
    if (!EMAIL_RE.test(email)) return "Geçerli bir e-posta girin.";
    if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
    if (!consent) return "Devam etmek için KVKK aydınlatma metnini onaylamalısınız.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const ce = clientError();
    if (ce) {
      setError(ce);
      return;
    }
    setLoading(true);
    try {
      // BFF register: kayıt + otomatik login tek çağrıda; token httpOnly cookie'ye yazılır.
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, businessType, fullName, email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.title ?? "Kayıt başarısız.");
        return;
      }
      // Oturum açıldı; henüz şube/pozisyon yok → kuruluma düş (dashboard'a DEĞİL).
      router.replace("/onboarding");
      router.refresh();
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
          <h1 className="font-display text-xl font-bold text-ink">Shiftle<span className="text-signal">.</span></h1>
          <p className="text-sm text-muted">İşletmeni kaydet, birkaç dakikada kur.</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1">
          <label htmlFor="businessName" className="text-sm font-medium text-muted">
            İşletme adı
          </label>
          <input
            id="businessName"
            type="text"
            required
            maxLength={150}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal placeholder:text-faint"
            placeholder="Berke Kahve"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="businessType" className="text-sm font-medium text-muted">
            İşletme tipi
          </label>
          <select
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(Number(e.target.value))}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium text-muted">
            Ad soyad
          </label>
          <input
            id="fullName"
            type="text"
            required
            maxLength={150}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal placeholder:text-faint"
            placeholder="Berke Biçer"
          />
        </div>

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

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-muted">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-signal placeholder:text-faint"
            placeholder="En az 8 karakter"
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
          disabled={loading}
          className="w-full rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
        >
          {loading ? "Kayıt oluşturuluyor…" : "Kayıt ol"}
        </button>

        <p className="text-center text-sm text-muted">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-semibold text-signal-deep hover:underline">
            Giriş yap
          </Link>
        </p>
      </form>
    </main>
  );
}
