import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";

// Oturumu kapat: cookie'yi sil. (Refresh token iptali ileride backend'e bağlanır.)
export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
