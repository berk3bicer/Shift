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

  // Gövde arrayBuffer ile iletilir (JSON da binary de — foto upload bozulmasın; text()
  // binary'i korur etmez).
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const reqBody = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(url, {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`, // sunucu tarafı; client görmez
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body: reqBody && reqBody.byteLength > 0 ? reqBody : undefined,
    cache: "no-store",
  });

  // Yanıt da arrayBuffer ile yansıtılır (indirilen görsel/PDF binary bozulmasın).
  // Set-Cookie/token ASLA kopyalanmaz. 204/304/boş → body NULL (Response ctor patlamasın).
  const resBuf = await upstream.arrayBuffer();
  return new NextResponse(resBuf.byteLength === 0 ? null : resBuf, {
    status: upstream.status,
    headers: { "content-type": upstream.headers.get("content-type") ?? "application/json" },
  });
}

export const GET = forward;
export const POST = forward;
export const PUT = forward;
export const PATCH = forward;
export const DELETE = forward;
