import type { ShiftDto } from "./types";

// Client (tarayıcı) tarafı mutation'lar — hepsi BFF proxy üzerinden (same-origin → CORS
// yok; token sunucuda eklenir). Server'daki api-server.ts'in client kardeşi.

export class ApiClientError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Vardiyayı günceller (gün-taşıma VEYA kişi-atama). PUT FULL update ister (patch değil)
// → ShiftDto'nun tüm alanlarını geri gönderir, yalnız overrides'taki alan(lar)ı değiştirir.
// userId null verilebilir (açık vardiya / atama kaldır). Dönüş: backend Warnings[]
// (İş Kanunu limitleri — engellemez). 4xx → throw (çakışma → çağıran geri alır).
export async function updateShift(
  shift: ShiftDto,
  overrides: { startTime?: string; endTime?: string; userId?: string | null },
): Promise<{ warnings: string[] }> {
  const res = await fetch(`/api/proxy/api/shifts/${shift.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      positionId: shift.positionId,
      // userId override'ı null OLABİLİR → 'in' kontrolüyle ayır (undefined=değişme).
      userId: "userId" in overrides ? overrides.userId : shift.userId,
      startTime: overrides.startTime ?? shift.startTime,
      endTime: overrides.endTime ?? shift.endTime,
      notes: shift.notes,
    }),
  });

  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(
      res.status,
      problem?.detail ?? problem?.title ?? `İşlem başarısız (${res.status}).`,
    );
  }

  const data = await res.json().catch(() => ({}));
  return { warnings: Array.isArray(data?.warnings) ? data.warnings : [] };
}
