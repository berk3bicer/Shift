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
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-5 rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">Sunucuya ulaşılamıyor</h1>
          <p className="text-sm text-gray-500">
            Uygulama sunucusuna (API) şu an bağlanılamıyor. Backend çalışıyor mu?
            Birkaç saniye sonra tekrar deneyin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => unstable_retry()}
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Tekrar dene
        </button>

        <p className="text-center text-sm text-gray-500">
          <Link href="/login" className="font-medium text-gray-900 hover:underline">
            Giriş ekranına dön
          </Link>
        </p>
      </div>
    </main>
  );
}
