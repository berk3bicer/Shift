import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/session";

// Next 16: "Middleware" → "Proxy" (dosya proxy.ts, fonksiyon proxy). İşlev aynı.
// Rota koruması: oturum cookie'si yoksa korumalı sayfalar → /login. Oturum varken
// /login'e gidersen → /schedule. (Cookie httpOnly ama proxy/sunucu okuyabilir.)
export function proxy(req: NextRequest) {
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);
  const { pathname } = req.nextUrl;
  const isLogin = pathname === "/login";

  if (!hasSession && !isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasSession && isLogin) {
    const url = req.nextUrl.clone();
    url.pathname = "/schedule";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Statik dosyalar, API route'ları ve Next iç yollarını dışarıda tut.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
