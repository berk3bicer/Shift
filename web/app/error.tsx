"use client"; // Error boundary'ler Client Component olmak zorunda.

import { useEffect } from "react";
import Link from "next/link";

// Kök hata sınırı (app segment). page.tsx / route grupları (auth/app/staff) kendi
// error.tsx'lerine sahip değil → yakalanmayan tüm render hataları buraya düşer.
// Asıl senaryo: kök sayfa getMe()/getBranches() ile backend'e (5203) gider; API
// kapalıysa fetch, ApiError DEĞİL bir network hatası (fetch failed / ECONNREFUSED)
// fırlatır. page.tsx yalnız 401'i login'e yönlendirir, gerisini throw eder → eskiden
// kullanıcı sonsuz "rendering"de asılı kalıyordu. Artık burada anlamlı mesaj + tekrar
// dene (unstable_retry, Next 16.2 — reset DEĞİL) + login'e dönüş gösteriyoruz.
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-line bg-surface p-8 shadow-card text-center">
        <div className="space-y-1">
          <h1 className="font-display text-xl font-bold text-ink">Sunucuya ulaşılamıyor</h1>
          <p className="text-sm text-muted">
            Uygulama sunucusuna (API) şu an bağlanılamıyor. Backend çalışıyor mu?
            Birkaç saniye sonra tekrar deneyin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => unstable_retry()}
          className="w-full rounded-lg bg-signal px-4 py-2.5 text-sm font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white"
        >
          Tekrar dene
        </button>

        <p className="text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-signal-deep hover:underline">
            Giriş ekranına dön
          </Link>
        </p>
      </div>
    </main>
  );
}
