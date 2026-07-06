import { NextResponse } from "next/server";
import type { ProblemDetails } from "@/lib/types";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

// Anonim BFF ucu: şifre sıfırlama (linkteki token + yeni şifre).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.token || !body?.newPassword) {
    return NextResponse.json({ title: "Token ve yeni şifre gerekli." }, { status: 400 });
  }

  const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: body.token, newPassword: body.newPassword }),
    cache: "no-store",
  });

  if (!res.ok) {
    const problem = (await res.json().catch(() => null)) as ProblemDetails | null;
    return NextResponse.json(
      { title: problem?.detail ?? problem?.title ?? "Şifre sıfırlanamadı." },
      { status: res.status },
    );
  }

  return NextResponse.json(await res.json());
}
