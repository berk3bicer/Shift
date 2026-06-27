import "server-only";
import { getToken } from "./session";
import type { AvailabilityDto, BranchDto, MeResponse, PositionDto, ProblemDetails, ShiftDto, StaffDto, TaskDto, TimeOffRequestDto, TimeClockDto, OvertimeSettingsDto, OvertimeSummaryDto, OvertimeRecordDto } from "./types";

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
  // MOCK DATA FALLBACK FOR UI TESTING
  const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK === "true"; 

  if (isMockMode) {
    console.log(`[MOCK] Intercepted ${path}`);
    if (path.includes("/api/auth/me")) return { id: "user1", email: "admin@shift.com", roles: ["Admin"], branchId: "b1", name: "Test Admin" } as any;
    if (path.includes("/api/branches")) return [{ id: "b1", name: "Kadıköy Merkez Şubesi" }] as any;
    if (path.includes("/api/positions")) return [{ id: "p1", name: "Barista", defaultColor: "bg-amber-500 text-white" }, { id: "p2", name: "Garson", defaultColor: "bg-blue-500 text-white" }] as any;
    if (path.includes("/api/staff")) return [
      { id: "s1", fullName: "Ahmet Yılmaz", positionName: "Barista", email: "ahmet@shift.com", branchId: "b1", role: 1 },
      { id: "s2", fullName: "Ayşe Demir", positionName: "Garson", email: "ayse@shift.com", branchId: "b1", role: 1 }
    ] as any;
    if (path.includes("/api/tasks")) return [
      { id: "t1", branchId: "b1", title: "Kahve makinesini temizle", description: "Gün sonu temizliği", priority: 2, category: 0, status: 0, assignedUserName: "Ahmet Yılmaz", assignedUserId: "s1" },
      { id: "t2", branchId: "b1", title: "Stok sayımı", description: "Süt ve kahve", priority: 1, category: 1, status: 1, assignedUserName: "Ayşe Demir", assignedUserId: "s2" },
      { id: "t3", branchId: "b1", title: "Masa 4 adisyon", description: "", priority: 0, category: 2, status: 2 }
    ] as any;
    if (path.includes("/api/shifts")) {
      const today = new Date();
      const start = new Date(today.setHours(9, 0, 0, 0));
      const end = new Date(today.setHours(17, 0, 0, 0));
      return [
        { id: "shift1", branchId: "b1", positionId: "p1", userId: "s1", startTime: start.toISOString(), endTime: end.toISOString(), notes: "Sabah vardiyası", status: 1 },
        { id: "shift2", branchId: "b1", positionId: "p2", userId: "s2", startTime: start.toISOString(), endTime: end.toISOString(), notes: "", status: 0 }
      ] as any;
    }
    if (path.includes("/api/availability")) return [
      { id: "a1", userId: "s1", userFullName: "Ahmet Yılmaz", dayOfWeek: 2, startTime: "13:00", endTime: "18:00", reason: "Okul" },
      { id: "a2", userId: "s1", userFullName: "Ahmet Yılmaz", dayOfWeek: 4, startTime: "09:00", endTime: "12:00", reason: "Kurs" },
    ] as any;
    if (path.includes("/api/timeoffrequests")) {
      const today = new Date();
      const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7);
      return [
        { id: "to1", userId: "s1", userFullName: "Ahmet Yılmaz", startDate: today.toISOString().split("T")[0], endDate: nextWeek.toISOString().split("T")[0], type: 0, status: 0, note: "Yıllık izin", decidedByUserId: null, decidedByUserFullName: null },
        { id: "to2", userId: "s2", userFullName: "Ayşe Demir", startDate: today.toISOString().split("T")[0], endDate: today.toISOString().split("T")[0], type: 1, status: 1, note: "Hastane randevusu", decidedByUserId: "user1", decidedByUserFullName: "Test Admin" },
      ] as any;
    }
    if (path.includes("/api/timeclocks")) {
      const today = new Date();
      const morning = new Date(today.setHours(9, 15, 0, 0));
      const evening = new Date(today.setHours(17, 10, 0, 0));
      const justNow = new Date();
      return [
        { id: "tc1", userId: "s1", userFullName: "Ahmet Yılmaz", branchId: "b1", checkInTime: morning.toISOString(), checkOutTime: evening.toISOString(), isLate: true, workedMinutes: 475 },
        { id: "tc2", userId: "s2", userFullName: "Ayşe Demir", branchId: "b1", checkInTime: justNow.toISOString(), checkOutTime: null, isLate: false, workedMinutes: null },
      ] as any;
    }
    if (path.includes("/api/overtime-settings")) {
      return {
        weeklyOvertimeThresholdHours: 45,
        overtimeMultiplier: 1.5,
        nightMultiplier: 1.0,
        weekendMultiplier: 1.0,
        holidayMultiplier: 1.0,
        earlyClockInToleranceMinutes: 15,
        lateClockOutToleranceMinutes: 15,
      } as any;
    }
    if (path.includes("/api/overtime/summary")) {
      return [
        { userId: "s1", userFullName: "Ahmet Yılmaz", periodStart: "2026-06-01T00:00:00.000Z", periodEnd: "2026-06-30T23:59:59.000Z", totalNormalHours: 160, totalOvertimeHours: 12, grandTotalHours: 172 },
        { userId: "s2", userFullName: "Ayşe Demir", periodStart: "2026-06-01T00:00:00.000Z", periodEnd: "2026-06-30T23:59:59.000Z", totalNormalHours: 180, totalOvertimeHours: 25, grandTotalHours: 205 },
      ] as any;
    }
    if (path.includes("/api/overtime/records")) {
      return [
        { id: "or1", userId: "s1", userFullName: "Ahmet Yılmaz", periodStart: "2026-05-01T00:00:00.000Z", periodEnd: "2026-05-31T23:59:59.000Z", totalHours: 190, normalHours: 180, overtimeHours: 10, appliedHourlyRate: 200, overtimeMultiplier: 1.5, nightPremium: 500, weekendPremium: 400, grossAmount: 39900, isLocked: true, lockedAt: "2026-06-01T10:00:00.000Z", unlockedAt: null },
        { id: "or2", userId: "s2", userFullName: "Ayşe Demir", periodStart: "2026-05-01T00:00:00.000Z", periodEnd: "2026-05-31T23:59:59.000Z", totalHours: 210, normalHours: 180, overtimeHours: 30, appliedHourlyRate: null, overtimeMultiplier: null, nightPremium: null, weekendPremium: null, grossAmount: null, isLocked: false, lockedAt: "2026-06-01T10:00:00.000Z", unlockedAt: "2026-06-02T15:30:00.000Z" }
      ] as any;
    }
    return [] as any; // default return array to prevent map errors
  }

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
  apiFetch<TaskDto[]>(`/api/tasks?branchId=${branchId}`);

export function getShifts(branchId: string, rangeStartIso: string, rangeEndIso: string) {
  const qs = new URLSearchParams({
    branchId,
    rangeStart: rangeStartIso,
    rangeEnd: rangeEndIso,
  });
  return apiFetch<ShiftDto[]>(`/api/shifts?${qs.toString()}`);
}

export const getAvailabilities = (userId?: string) => {
  const qs = userId ? `?userId=${userId}` : "";
  return apiFetch<AvailabilityDto[]>(`/api/availability${qs}`);
};

export const getTimeOffRequests = () => apiFetch<TimeOffRequestDto[]>("/api/timeoffrequests");

export const getTimeClocks = (branchId: string, mineOnly: boolean = false) => {
  const qs = new URLSearchParams();
  if (branchId && !mineOnly) qs.set("branchId", branchId);
  return apiFetch<TimeClockDto[]>(`/api/timeclocks${mineOnly ? '/mine' : ''}?${qs.toString()}`);
};

export const getOvertimeSettings = () => apiFetch<OvertimeSettingsDto>("/api/overtime-settings");

export const getOvertimeSummary = (userId?: string, from?: string, to?: string) => {
  const qs = new URLSearchParams();
  if (userId) qs.set("userId", userId);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return apiFetch<OvertimeSummaryDto[]>(`/api/overtime/summary?${qs.toString()}`);
};

export const getOvertimeRecords = (userId?: string, from?: string, to?: string) => {
  const qs = new URLSearchParams();
  if (userId) qs.set("userId", userId);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  return apiFetch<OvertimeRecordDto[]>(`/api/overtime/records?${qs.toString()}`);
};
