import { NextResponse } from "next/server";
import { setSession } from "@/lib/session";
import type { LoginResponse, ProblemDetails } from "@/lib/types";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

// BFF login: tarayıcı buraya (same-origin) POST'lar → biz .NET'e gider, dönen token'ı
// httpOnly cookie'ye yazar. Token tarayıcı JS'ine HİÇ verilmez (gövdede dönmez).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ title: "E-posta ve şifre gerekli." }, { status: 400 });
  }

  // MOCK LOGIN FALLBACK FOR UI TESTING
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === "true";
  if (isMockMode) {
    console.log("[MOCK] Logging in with fake token");
    await setSession("fake-jwt-token-for-testing");
    return NextResponse.json({ ok: true });
  }

  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email, password: body.password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ProblemDetails | null;
    return NextResponse.json(
      { title: problem?.title ?? "Giriş başarısız", detail: problem?.detail },
      { status: res.status },
    );
  }

  const data = (await res.json()) as LoginResponse;
  await setSession(data.token); // token cookie'ye; gövdeye koymuyoruz

  return NextResponse.json({ ok: true });
}
