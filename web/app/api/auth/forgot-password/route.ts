import { NextResponse } from "next/server";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

// Anonim BFF ucu: şifremi unuttum. Backend e-posta kayıtlı olsa da olmasa da
// aynı 200'ü döner (enumeration koruması) — biz de aynen yansıtırız.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email) {
    return NextResponse.json({ title: "E-posta gerekli." }, { status: 400 });
  }

  const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: body.email }),
    cache: "no-store",
  });

  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
