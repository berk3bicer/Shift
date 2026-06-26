// Backend DTO'larının TypeScript karşılığı (System.Text.Json → camelCase).
// Tek gerçek kaynak backend; burada onu birebir yansıtıyoruz.

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  tenantId: string;
}

export interface MeResponse {
  userId: string;
  tenantId: string;
  name: string | null;
  roles: string[]; // ["Owner"] | ["Manager"] ...
}

export interface BranchDto {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
}

// Backend ShiftStatus enum: 0=Draft (taslak), 1=Published (yayında).
export enum ShiftStatus {
  Draft = 0,
  Published = 1,
}

export interface ShiftDto {
  id: string;
  branchId: string;
  userId: string | null; // null = açık vardiya (atanmamış)
  userFullName: string | null;
  positionId: string;
  positionName: string;
  positionColor: string | null;
  startTime: string; // ISO
  endTime: string; // ISO
  status: ShiftStatus;
  notes: string | null;
}

// Ekip üyesi (GET /api/staff). Atama dropdown'unu besler.
export interface StaffDto {
  id: string;
  fullName: string;
  email: string;
  positionId: string | null;
  positionName: string | null;
  roles: number[];
  isActive: boolean;
}

// Backend GlobalExceptionHandler'ın ProblemDetails çıktısı.
export interface ProblemDetails {
  status: number;
  title: string;
  detail?: string;
  errors?: string[];
}
