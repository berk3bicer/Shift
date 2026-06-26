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

const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === "true";

// Vardiyayı günceller
export async function updateShift(
  shift: ShiftDto,
  overrides: { startTime?: string; endTime?: string; userId?: string | null },
): Promise<{ warnings: string[] }> {
  if (isMockMode) {
    console.log("[MOCK] Shift updated");
    await new Promise(r => setTimeout(r, 400));
    return { warnings: [] };
  }

  const res = await fetch(`/api/proxy/api/shifts/${shift.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      positionId: shift.positionId,
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

// ── Kanban görev ──

// Görevi başka kolona taşı (status değişir). Backend serbest hareket + Done yan etkileri.
// Sonuç warnings taşımaz; hata (nadir 400 / ağ) → throw → hook geri alır.
export async function moveTask(id: string, newStatus: number): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Task ${id} moved to status ${newStatus}`);
    await new Promise(r => setTimeout(r, 300)); // Simulate network latency
    return;
  }

  const res = await fetch(`/api/proxy/api/tasks/${id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newStatus }),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Taşınamadı (${res.status}).`);
  }
}

// Yeni görev oluştur (her zaman ToDo'da doğar). Dönüş: { taskId }.
export async function createTask(payload: {
  branchId: string;
  title: string;
  description: string | null;
  priority: number;
  category: number;
  assignedUserId: string | null;
  assignedPositionId: string | null;
}): Promise<{ taskId: string }> {
  if (isMockMode) {
    console.log("[MOCK] Task created", payload);
    await new Promise(r => setTimeout(r, 500)); // Simulate network latency
    return { taskId: "mock-task-" + Date.now() };
  }

  const res = await fetch(`/api/proxy/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, dueDate: null }),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Oluşturulamadı (${res.status}).`);
  }
  const data = await res.json();
  return { taskId: data.taskId };
}

// Yeni vardiya oluştur. userId null = açık vardiya. Dönüş: { shiftId, warnings }.
// Çakışma → 4xx throw (modal'da gösterilir).
export async function createShift(payload: {
  branchId: string;
  positionId: string;
  userId: string | null;
  startTime: string;
  endTime: string;
  notes: string | null;
}): Promise<{ shiftId: string; warnings: string[] }> {
  if (isMockMode) {
    console.log("[MOCK] Shift created", payload);
    await new Promise(r => setTimeout(r, 500));
    return { shiftId: "mock-shift-" + Date.now(), warnings: [] };
  }

  const res = await fetch(`/api/proxy/api/shifts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Oluşturulamadı (${res.status}).`);
  }
  const data = await res.json();
  return { shiftId: data.shiftId, warnings: Array.isArray(data?.warnings) ? data.warnings : [] };
}

// Vardiya sil (HARD delete — geri alınamaz). 204 döner.
export async function deleteShift(id: string): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Shift ${id} deleted`);
    await new Promise(r => setTimeout(r, 300));
    return;
  }

  const res = await fetch(`/api/proxy/api/shifts/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Silinemedi (${res.status}).`);
  }
}

// Haftanın TÜM Draft vardiyalarını yayınla. Backend kişi başına tek özet bildirim atar.
export async function publishWeek(
  branchId: string,
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<{ publishedCount: number; notifiedUserCount: number }> {
  if (isMockMode) {
    console.log(`[MOCK] Week published`);
    await new Promise(r => setTimeout(r, 600));
    return { publishedCount: 5, notifiedUserCount: 2 };
  }

  const res = await fetch(`/api/proxy/api/shifts/publish-week`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId, rangeStart: rangeStartIso, rangeEnd: rangeEndIso }),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Yayınlanamadı (${res.status}).`);
  }
  const data = await res.json();
  return {
    publishedCount: data.publishedCount ?? 0,
    notifiedUserCount: data.notifiedUserCount ?? 0,
  };
}

// ── Müsaitlik (Availability) ──

export async function createAvailability(payload: {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: string | null;
}): Promise<{ id: string }> {
  if (isMockMode) {
    console.log("[MOCK] Availability created", payload);
    await new Promise(r => setTimeout(r, 400));
    return { id: "mock-avail-" + Date.now() };
  }

  const res = await fetch(`/api/proxy/api/availability`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Eklenemedi (${res.status}).`);
  }
  const data = await res.json();
  return { id: data.id };
}

export async function deleteAvailability(id: string): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Availability ${id} deleted`);
    await new Promise(r => setTimeout(r, 300));
    return;
  }

  const res = await fetch(`/api/proxy/api/availability/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Silinemedi (${res.status}).`);
  }
}

// ── İzin (Time Off) ──
export async function createTimeOffRequest(payload: {
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: number;
  note: string | null;
}): Promise<{ id: string }> {
  if (isMockMode) {
    console.log("[MOCK] Time Off created", payload);
    await new Promise(r => setTimeout(r, 400));
    return { id: "mock-to-" + Date.now() };
  }

  const res = await fetch(`/api/proxy/api/timeoffrequests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Talep oluşturulamadı (${res.status}).`);
  }
  const data = await res.json();
  return { id: data.id };
}

export async function decideTimeOffRequest(
  id: string,
  decision: "Approve" | "Reject",
  note?: string
): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Time Off ${id} decided as ${decision} with note: ${note}`);
    await new Promise(r => setTimeout(r, 400));
    return;
  }

  const path = decision === "Approve" ? "approve" : "reject";
  const res = await fetch(`/api/proxy/api/timeoffrequests/${id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Karar işlenemedi (${res.status}).`);
  }
}

// ── Giriş-Çıkış (Time Clock) ──
export async function clockIn(branchId: string): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Clocked in at branch ${branchId}`);
    await new Promise(r => setTimeout(r, 400));
    return;
  }

  const res = await fetch(`/api/proxy/api/timeclocks/clock-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId }),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Giriş yapılamadı (${res.status}).`);
  }
}

export async function clockOut(): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Clocked out`);
    await new Promise(r => setTimeout(r, 400));
    return;
  }

  const res = await fetch(`/api/proxy/api/timeclocks/clock-out`, { method: "POST" });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Çıkış yapılamadı (${res.status}).`);
  }
}

// ── Mesai Hesaplama (Overtime) ──
export async function updateOvertimeSettings(payload: {
  weeklyOvertimeThresholdHours: number;
  overtimeMultiplier: number;
  nightMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  earlyClockInToleranceMinutes: number;
  lateClockOutToleranceMinutes: number;
}): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Updated Overtime Settings`, payload);
    await new Promise(r => setTimeout(r, 400));
    return;
  }

  const res = await fetch(`/api/proxy/api/overtime-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Ayarlar güncellenemedi (${res.status}).`);
  }
}

// ── Bordro (Payroll / OvertimeRecord) ──
export async function closePeriod(payload: {
  userId: string;
  periodStart: string; // ISO date only
  periodEnd: string; // ISO date only
}): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Closed period for user ${payload.userId}`);
    await new Promise(r => setTimeout(r, 400));
    return;
  }

  const res = await fetch(`/api/proxy/api/overtime/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Dönem kapatılamadı (${res.status}).`);
  }
}

export async function unlockRecord(id: string): Promise<void> {
  if (isMockMode) {
    console.log(`[MOCK] Unlocked record ${id}`);
    await new Promise(r => setTimeout(r, 400));
    return;
  }

  const res = await fetch(`/api/proxy/api/overtime/records/${id}/unlock`, {
    method: "POST"
  });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `Kilit açılamadı (${res.status}).`);
  }
}
