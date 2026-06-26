import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "@/lib/session";

const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

// Genel yetkilendirilmiş BFF proxy: client (same-origin) buraya çağırır, biz cookie'deki
// token'ı Bearer olarak EKLEYİP .NET'e iletiriz. Token YALNIZ sunucuda kullanılır —
// response'a/cookie'ye HİÇ sızdırılmaz; client'a sadece backend gövdesi + status döner.
async function forward(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ title: "Oturum yok." }, { status: 401 });
  }

  const { path } = await ctx.params;
  const url = `${BASE_URL}/${path.join("/")}${req.nextUrl.search}`;

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.text() : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`, // sunucu tarafı; client görmez
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body,
    cache: "no-store",
  });

  // Yalnız gövde + content-type yansıtılır. Set-Cookie/token ASLA kopyalanmaz.
  // 204/304 (ve boş gövde) için body NULL olmalı — yoksa Response ctor patlar (→500).
  const text = await upstream.text();
  return new NextResponse(text === "" ? null : text, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
