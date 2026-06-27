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

// Ortak hata fırlatıcı — !ok ise ProblemDetails'i çözüp ApiClientError atar.
async function ensureOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;
  const problem = await res.json().catch(() => null);
  throw new ApiClientError(res.status, problem?.detail ?? problem?.title ?? `${fallback} (${res.status}).`);
}

// ── Vardiya (Shift) ──

export async function updateShift(
  shift: ShiftDto,
  overrides: { startTime?: string; endTime?: string; userId?: string | null },
): Promise<{ warnings: string[] }> {
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
  await ensureOk(res, "İşlem başarısız");
  const data = await res.json().catch(() => ({}));
  return { warnings: Array.isArray(data?.warnings) ? data.warnings : [] };
}

export async function createShift(payload: {
  branchId: string;
  positionId: string;
  userId: string | null;
  startTime: string;
  endTime: string;
  notes: string | null;
}): Promise<{ shiftId: string; warnings: string[] }> {
  const res = await fetch(`/api/proxy/api/shifts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Oluşturulamadı");
  const data = await res.json();
  return { shiftId: data.shiftId, warnings: Array.isArray(data?.warnings) ? data.warnings : [] };
}

export async function deleteShift(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/shifts/${id}`, { method: "DELETE" });
  await ensureOk(res, "Silinemedi");
}

export async function publishWeek(
  branchId: string,
  rangeStartIso: string,
  rangeEndIso: string,
): Promise<{ publishedCount: number; notifiedUserCount: number }> {
  const res = await fetch(`/api/proxy/api/shifts/publish-week`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId, rangeStart: rangeStartIso, rangeEnd: rangeEndIso }),
  });
  await ensureOk(res, "Yayınlanamadı");
  const data = await res.json();
  return { publishedCount: data.publishedCount ?? 0, notifiedUserCount: data.notifiedUserCount ?? 0 };
}

// ── Kanban görev ──
// Backend MoveTaskCommand TaskItemStatus enum'unu int olarak alır (0/1/2). newStatus number.
export async function moveTask(id: string, newStatus: number): Promise<void> {
  const res = await fetch(`/api/proxy/api/tasks/${id}/move`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ newStatus }),
  });
  await ensureOk(res, "Taşınamadı");
}

export async function createTask(payload: {
  branchId: string;
  title: string;
  description: string | null;
  priority: number;
  category: number;
  assignedUserId: string | null;
  assignedPositionId: string | null;
}): Promise<{ taskId: string }> {
  const res = await fetch(`/api/proxy/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, dueDate: null }),
  });
  await ensureOk(res, "Oluşturulamadı");
  const data = await res.json();
  return { taskId: data.taskId };
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/tasks/${id}`, { method: "DELETE" });
  await ensureOk(res, "Silinemedi");
}

// ── Kontrol Listeleri (Checklists) ──

export async function startChecklistRun(payload: {
  branchId: string;
  checklistId: string;
  runDate: string; // YYYY-MM-DD
}): Promise<{ runId: string }> {
  const res = await fetch(`/api/proxy/api/checklistruns`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Başlatılamadı");
  const data = await res.json();
  return { runId: data.runId };
}

// Backend route: checklistruns/{runId}/items/{itemId}/check  (check-item DEĞİL).
export async function checkChecklistItem(
  runId: string,
  itemId: string,
  isChecked: boolean,
): Promise<void> {
  const res = await fetch(`/api/proxy/api/checklistruns/${runId}/items/${itemId}/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ isChecked }),
  });
  await ensureOk(res, "İşaretlenemedi");
}

export async function createChecklist(payload: {
  name: string;
  type: number;
  items: { text: string; orderIndex: number }[];
}): Promise<{ checklistId: string }> {
  const res = await fetch(`/api/proxy/api/checklists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Şablon oluşturulamadı");
  const data = await res.json();
  return { checklistId: data.checklistId };
}

export async function updateChecklist(id: string, payload: {
  name: string;
  type: number;
  items: { text: string; orderIndex: number }[];
}): Promise<void> {
  const res = await fetch(`/api/proxy/api/checklists/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Liste güncellenemedi");
}

export async function deleteChecklist(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/checklists/${id}`, { method: "DELETE" });
  await ensureOk(res, "Liste silinemedi");
}

// ── Vardiya Defteri (Shift Notes) ──

export async function createShiftNote(payload: {
  branchId: string;
  noteDate: string;
  content: string;
}): Promise<{ noteId: string }> {
  const res = await fetch(`/api/proxy/api/shiftnotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Not eklenemedi");
  const data = await res.json();
  return { noteId: data.noteId };
}

export async function deleteShiftNote(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/shiftnotes/${id}`, { method: "DELETE" });
  await ensureOk(res, "Not silinemedi");
}

// ── İletişim ve Duyuru (Announcements) ──

export async function createAnnouncement(payload: {
  branchId: string;
  title: string;
  content: string;
  targetRole: number | null;
}): Promise<{ announcementId: string }> {
  const res = await fetch(`/api/proxy/api/announcements`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Duyuru paylaşılamadı");
  const data = await res.json();
  return { announcementId: data.announcementId };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/notifications/${id}/read`, { method: "PUT" });
  await ensureOk(res, "Bildirim okundu işaretlenemedi");
}

// ── Müsaitlik (Availability) — route api/availabilities (çoğul) ──

export async function createAvailability(payload: {
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  reason: string | null;
}): Promise<{ id: string }> {
  const res = await fetch(`/api/proxy/api/availabilities`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Eklenemedi");
  const data = await res.json();
  return { id: data.id };
}

export async function deleteAvailability(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/availabilities/${id}`, { method: "DELETE" });
  await ensureOk(res, "Silinemedi");
}

// ── İzin (Time Off) ──

export async function createTimeOffRequest(payload: {
  userId: string;
  startDate: string;
  endDate: string;
  type: number;
  note: string | null;
}): Promise<{ id: string }> {
  const res = await fetch(`/api/proxy/api/timeoffrequests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Talep oluşturulamadı");
  const data = await res.json();
  return { id: data.id };
}

export async function decideTimeOffRequest(
  id: string,
  decision: "Approve" | "Reject",
  note?: string,
): Promise<void> {
  const path = decision === "Approve" ? "approve" : "reject";
  const res = await fetch(`/api/proxy/api/timeoffrequests/${id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  await ensureOk(res, "Karar işlenemedi");
}

// ── Giriş-Çıkış (Time Clock) ──

export async function clockIn(branchId: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/timeclocks/clock-in`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ branchId }),
  });
  await ensureOk(res, "Giriş yapılamadı");
}

export async function clockOut(): Promise<void> {
  const res = await fetch(`/api/proxy/api/timeclocks/clock-out`, { method: "POST" });
  await ensureOk(res, "Çıkış yapılamadı");
}

// ── Mesai Ayarları (Overtime) ──

export async function updateOvertimeSettings(payload: {
  weeklyOvertimeThresholdHours: number;
  overtimeMultiplier: number;
  nightMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  earlyClockInToleranceMinutes: number;
  lateClockOutToleranceMinutes: number;
}): Promise<void> {
  const res = await fetch(`/api/proxy/api/overtime-settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Ayarlar güncellenemedi");
}

// ── Bordro (Payroll / OvertimeRecord) ──

export async function closePeriod(payload: {
  userId: string;
  periodStart: string;
  periodEnd: string;
}): Promise<void> {
  const res = await fetch(`/api/proxy/api/overtime/close`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  await ensureOk(res, "Dönem kapatılamadı");
}

export async function unlockRecord(id: string): Promise<void> {
  const res = await fetch(`/api/proxy/api/overtime/records/${id}/unlock`, { method: "POST" });
  await ensureOk(res, "Kilit açılamadı");
}

// ── Fotoğraf eki (presigned URL akışı) ──
// AttachmentOwnerType: Task=0, ChecklistRunItem=1.
// 1) upload-url al → 2) dosyayı (proxy üzerinden) yükle → 3) confirm ile kalıcı kaydet.
// Anlık önizleme için objectURL döner (reload'da List+downloadUrl ile gelir — Adım C).
export async function uploadPhoto(
  file: File,
  entityType: "task" | "checklist",
  entityId: string,
): Promise<string> {
  const ownerType = entityType === "task" ? 0 : 1;

  const urlRes = await fetch(`/api/proxy/api/attachments/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerType, ownerId: entityId, contentType: file.type, fileName: file.name }),
  });
  await ensureOk(urlRes, "Yükleme adresi alınamadı");
  const { key, uploadUrl, method } = await urlRes.json();

  // Mock presigned URL backend'in kendi ucuna işaret eder (localhost:5203) → CORS'tan
  // kaçınmak için proxy üzerinden gönder (mutlak adresi /api/proxy önekine çevir).
  const proxied = uploadUrl.replace(/^https?:\/\/[^/]+/, "/api/proxy");
  const putRes = await fetch(proxied, { method: method ?? "PUT", headers: { "Content-Type": file.type }, body: file });
  if (!putRes.ok) throw new ApiClientError(putRes.status, "Dosya yüklenemedi.");

  const confirmRes = await fetch(`/api/proxy/api/attachments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerType, ownerId: entityId, storageKey: key, contentType: file.type, fileName: file.name }),
  });
  await ensureOk(confirmRes, "Fotoğraf kaydedilemedi");

  return URL.createObjectURL(file);
}
