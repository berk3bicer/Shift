import "server-only";
import { getToken } from "./session";
import type { BranchDto, MeResponse, PositionDto, ProblemDetails, ShiftDto, StaffDto } from "./types";

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

export function getShifts(branchId: string, rangeStartIso: string, rangeEndIso: string) {
  const qs = new URLSearchParams({
    branchId,
    rangeStart: rangeStartIso,
    rangeEnd: rangeEndIso,
  });
  return apiFetch<ShiftDto[]>(`/api/shifts?${qs.toString()}`);
}
