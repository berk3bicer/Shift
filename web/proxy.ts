import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Next 16: "Middleware" → "Proxy" (dosya proxy.ts, fonksiyon proxy). İşlev aynı.
// Rota koruması: oturum cookie'si yoksa korumalı sayfalar → /login. Oturum varken
// /login'e gidersen → / (kök role göre yönlendirir: yönetici /dashboard, Staff /today).
export function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const { pathname } = req.nextUrl;
  // Oturumsuz erişilebilir auth sayfaları: giriş + kayıt. Yeni sahibin henüz oturumu
  // yoktur → /register guard'ın DIŞINDA olmalı (yoksa kayıt ekranı /login'e sekerdi).
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (!hasSession && !isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    const url = req.nextUrl.clone();
    url.pathname = "/"; // kök role göre yönlendirir (Staff'ı /schedule'a düşürme)
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Statik dosyalar, API route'ları ve Next iç yollarını dışarıda tut.
// PWA varlıkları (manifest, service worker, ikonlar, offline fallback) auth guard'ının
// DIŞINDA olmalı: sw.js redirect'e düşerse SW kaydı reddedilir; manifest/ikonlar kurulum
// için oturumsuz da erişilebilmeli; /offline çevrimdışı fallback (oturum gerektirmez).
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|offline|icon-192x192.png|icon-512x512.png|icon.svg|apple-icon).*)",
  ],
};
