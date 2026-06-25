import "server-only";
import { cookies } from "next/headers";

// Oturum, httpOnly cookie'de tutulur — tarayıcı JS'i token'ı GÖRMEZ (XSS'e kapalı).
// Yalnız Next SUNUCUSU (route handler, server component, middleware) erişir.
const TOKEN_COOKIE = "shift_token";

// JWT erişim süresi 60 dk (backend Jwt:AccessTokenMinutes). Cookie ömrünü buna yaslıyoruz.
const MAX_AGE_SECONDS = 60 * 60;

export async function setSession(token: string): Promise<void> {
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production", // dev http'de cookie set edilebilsin
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function getToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(TOKEN_COOKIE)?.value ?? null;
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export const SESSION_COOKIE_NAME = TOKEN_COOKIE;
