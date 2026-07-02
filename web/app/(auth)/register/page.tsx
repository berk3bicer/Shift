"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Backend validator ile aynı kurallar; sunucuya gitmeden önce kullanıcıyı uyar.
  function clientError(): string | null {
    if (!businessName.trim()) return "İşletme adı gerekli.";
    if (!fullName.trim()) return "Ad soyad gerekli.";
    if (!EMAIL_RE.test(email)) return "Geçerli bir e-posta girin.";
    if (password.length < 8) return "Şifre en az 8 karakter olmalı.";
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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Shift</h1>
          <p className="text-sm text-gray-500">İşletmeni kaydet, birkaç dakikada kur.</p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        <div className="space-y-1">
          <label htmlFor="businessName" className="text-sm font-medium text-gray-700">
            İşletme adı
          </label>
          <input
            id="businessName"
            type="text"
            required
            maxLength={150}
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
            placeholder="Berke Kahve"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="businessType" className="text-sm font-medium text-gray-700">
            İşletme tipi
          </label>
          <select
            id="businessType"
            value={businessType}
            onChange={(e) => setBusinessType(Number(e.target.value))}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900"
          >
            {BUSINESS_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
            Ad soyad
          </label>
          <input
            id="fullName"
            type="text"
            required
            maxLength={150}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
            placeholder="Berke Biçer"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
            placeholder="ornek@kafe.com"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            Şifre
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
            placeholder="En az 8 karakter"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
        >
          {loading ? "Kayıt oluşturuluyor…" : "Kayıt ol"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Zaten hesabın var mı?{" "}
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            Giriş yap
          </Link>
        </p>
      </form>
    </main>
  );
}
