import "server-only";
import { getToken } from "./session";
import type { AvailabilityDto, BranchDto, MeResponse, PositionDto, ProblemDetails, ShiftDto, StaffDto, TaskItemDto, TimeOffRequestDto, TimeClockDto, OvertimeSettingsDto, OvertimeSummaryDto, OvertimeRecordDto, ChecklistDto, ChecklistRunDto, ChecklistRunSummaryDto, ShiftNoteDto, AnnouncementDto, NotificationDto, ShiftPoolItemDto } from "./types";

// SUNUCU tarafı API istemcisi. Server component / route handler buradan .NET'i DOĞRUDAN
// çağırır (server-to-server → CORS YOK; backend'e dokunmadan). Token httpOnly cookie'den.
const BASE_URL = process.env.API_BASE_URL ?? "http://localhost:5203";

export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: ProblemDetails | null,
    message: string,
  ) {
    super(message);
  }
}

// Token'lı temel istek. Oturum yoksa 401 fırlatır (çağıran login'e yönlendirir).
async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  if (!token) throw new ApiError(401, null, "Oturum yok.");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store", // auth'lu veri her zaman taze
  });

  if (!res.ok) {
    let problem: ProblemDetails | null = null;
    try {
      problem = (await res.json()) as ProblemDetails;
    } catch {
      // gövde JSON değilse yut
    }
    throw new ApiError(res.status, problem, problem?.title ?? `HTTP ${res.status}`);
  }

  // 204 vb. gövdesiz yanıtlar
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const getMe = () => apiFetch<MeResponse>("/api/auth/me");

export const getBranches = () => apiFetch<BranchDto[]>("/api/branches");

export const getStaff = () => apiFetch<StaffDto[]>("/api/staff");

export const getPositions = () => apiFetch<PositionDto[]>("/api/positions");

export const getTasks = (branchId: string) =>
  apiFetch<TaskItemDto[]>(`/api/tasks?branchId=${branchId}`);

export const getChecklists = () => apiFetch<ChecklistDto[]>("/api/checklists");

// Backend tek gün filtresini fromDate=toDate ile yapar (runDate param'ı YOK SAYILIYORDU).
// Liste hafif özet döner (madde yok) → maddeler için getChecklistRun detayına gidilir.
export const getChecklistRuns = (branchId: string, date: string) =>
  apiFetch<ChecklistRunSummaryDto[]>(
    `/api/checklistruns?branchId=${branchId}&fromDate=${date}&toDate=${date}`);

// Tek çalıştırmanın tam detayı (maddeler + kim/ne zaman + kanıt fotoğrafları).
export const getChecklistRun = (runId: string) =>
  apiFetch<ChecklistRunDto>(`/api/checklistruns/${runId}`);

export const getShiftNotes = (branchId: string, noteDate: string) =>
  // Backend gün filtresini fromDate/toDate aralığıyla yapar; tek günü iki uca da veriyoruz.
  apiFetch<ShiftNoteDto[]>(`/api/shiftnotes?branchId=${branchId}&fromDate=${noteDate}&toDate=${noteDate}`);

export const getAnnouncements = (branchId: string) =>
  apiFetch<AnnouncementDto[]>(`/api/announcements?branchId=${branchId}`);

export const getNotifications = () =>
  apiFetch<NotificationDto[]>(`/api/notifications`);

export function getShifts(branchId: string, rangeStartIso: string, rangeEndIso: string) {
  const qs = new URLSearchParams({
    branchId,
    rangeStart: rangeStartIso,
    rangeEnd: rangeEndIso,
  });
  return apiFetch<ShiftDto[]>(`/api/shifts?${qs.toString()}`);
}

// ── Staff self-read (JWT userId ile handler'da sınırlı; Owner/Manager listelerinden AYRI) ──

// Staff'ın kendi vardiyaları — GET /api/shifts/mine (yalnızca çağıranın vardiyaları).
export const getMyShifts = (rangeStartIso: string, rangeEndIso: string) => {
  const qs = new URLSearchParams({ rangeStart: rangeStartIso, rangeEnd: rangeEndIso });
  return apiFetch<ShiftDto[]>(`/api/shifts/mine?${qs.toString()}`);
};

// Staff'a atanmış görevler — GET /api/tasks/mine. status opsiyonel (0/1/2).
export const getMyTasks = (status?: number) => {
  const qs = status !== undefined ? `?status=${status}` : "";
  return apiFetch<TaskItemDto[]>(`/api/tasks/mine${qs}`);
};

// Vardiya havuzu — GET /api/shift-pool (caller'ın pozisyon+şubesine göre; param yok).
export const getShiftPool = () => apiFetch<ShiftPoolItemDto[]>(`/api/shift-pool`);

// Staff'ın kendi puantaj kayıtları — GET /api/timeclocks/mine (açık kayıt + geçmiş).
export const getMyTimeClocks = () => apiFetch<TimeClockDto[]>(`/api/timeclocks/mine`);

// Backend controller'ı AvailabilitiesController → route api/availabilities (çoğul).
export const getAvailabilities = (userId?: string) => {
  const qs = userId ? `?userId=${userId}` : "";
  return apiFetch<AvailabilityDto[]>(`/api/availabilities${qs}`);
};

export const getTimeOffRequests = () => apiFetch<TimeOffRequestDto[]>("/api/timeoffrequests/pending");

// Staff'ın kendi izin geçmişi — /mine (her yetkili çağırabilir, token'dan userId).
export const getMyTimeOffRequests = () => apiFetch<TimeOffRequestDto[]>("/api/timeoffrequests/mine");

export const getTimeClocks = (branchId: string, mineOnly: boolean = false) => {
  const qs = new URLSearchParams();
  if (branchId && !mineOnly) qs.set("branchId", branchId);
  return apiFetch<TimeClockDto[]>(`/api/timeclocks${mineOnly ? '/mine' : ''}?${qs.toString()}`);
};

export const getOvertimeSettings = () => apiFetch<OvertimeSettingsDto>("/api/overtime-settings");

// Backend tek personelin özetini döner (userId ZORUNLU; boşsa 400). Tek obje.
export const getOvertimeSummary = (userId: string, from: string, to: string) => {
  const qs = new URLSearchParams({ userId, from, to });
  return apiFetch<OvertimeSummaryDto>(`/api/overtime/summary?${qs.toString()}`);
};

export const getOvertimeRecords = (userId?: string, from?: string, to?: string) => {
  const qs = new URLSearchParams();
  if (userId) qs.set("userId", userId);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return apiFetch<OvertimeRecordDto[]>(`/api/overtime/records?${qs.toString()}`);
};
