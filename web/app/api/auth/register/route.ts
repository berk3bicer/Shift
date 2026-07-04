import { NextResponse } from "next/server";
import { setSession } from "@/lib/session";
import type { LoginResponse, ProblemDetails } from "@/lib/types";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

// BFF register: tarayıcı buraya (same-origin) POST'lar → biz .NET'e /api/auth/register
// gönderir. Backend YALNIZ {tenantId, userId} döner (token DÖNMEZ) → başarıda aynı
// e-posta/şifre ile sessizce login çağırıp dönen token'ı httpOnly cookie'ye yazarız.
// Böylece kayıt sonrası kullanıcı otomatik oturumlu olur (login akışıyla birebir aynı yere).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.businessName || !body?.fullName || !body?.email || !body?.password) {
    return NextResponse.json({ title: "Zorunlu alanlar eksik." }, { status: 400 });
  }

  // 1) Kayıt (yeni Tenant + Owner User + Owner rolü)
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      businessName: body.businessName,
      businessType: body.businessType ?? 0,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
    }),
    cache: "no-store",
  });

  if (!regRes.ok) {
    const problem = (await regRes.json().catch(() => null)) as ProblemDetails | null;
    // Backend "Bu e-posta zaten kayıtlı." → InvalidOperationException → 400/500 gövdesi
    return NextResponse.json(
      { title: problem?.detail ?? problem?.title ?? "Kayıt başarısız.", detail: problem?.detail },
      { status: regRes.status },
    );
  }

  // 2) Otomatik oturum: aynı kimlikle login → token cookie'ye (login route ile aynı desen)
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });

  if (!loginRes.ok) {
    // Kayıt oldu ama otomatik giriş tıkandı → kullanıcı login'e düşer (hesap zaten var).
    return NextResponse.json(
      { title: "Kayıt tamam, ancak otomatik giriş yapılamadı. Lütfen giriş yapın." },
      { status: 502 },
    );
  }

  const data = (await loginRes.json()) as LoginResponse;
  await setSession(data.token); // token cookie'ye; gövdeye koymuyoruz

  return NextResponse.json({ ok: true });
}
