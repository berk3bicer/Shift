import { NextResponse } from "next/server";
import type { ProblemDetails } from "@/lib/types";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

// Anonim BFF ucu: davet kabulü. Proxy kullanılamaz (oturum şartı var) — davetli
// henüz login OLAMAZ. Cookie yazılmaz; başarıda FE login'e yönlendirir.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.token || !body?.password) {
    return NextResponse.json({ title: "Token ve şifre gerekli." }, { status: 400 });
  }

  const res = await fetch(`${BASE_URL}/api/auth/accept-invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: body.token, password: body.password }),
    cache: "no-store",
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ProblemDetails | null;
    return NextResponse.json(
      { title: problem?.detail ?? problem?.title ?? "Davet kabul edilemedi." },
      { status: res.status },
    );
  }

  // { email } — login formunu doldurmak için (token içermez, sızdırma yok).
  return NextResponse.json(await res.json());
}
