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

// Vardiyayı başka güne taşı: tarih değişir, saat-of-day korunur. PUT FULL update ister
// (patch değil) → ShiftDto'daki diğer alanları aynen geri gönderiyoruz, sadece saatler yeni.
// Dönüş: backend Warnings[] (İş Kanunu limitleri vb. — engellemez). 4xx → throw (çakışma).
export async function updateShiftDay(
  shift: ShiftDto,
  newStartIso: string,
  newEndIso: string,
): Promise<{ warnings: string[] }> {
  const res = await fetch(`/api/proxy/api/shifts/${shift.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      positionId: shift.positionId,
      userId: shift.userId,
      startTime: newStartIso,
      endTime: newEndIso,
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
