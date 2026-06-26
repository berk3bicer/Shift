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

// Pozisyon (GET /api/positions). Oluştur modal'ının dropdown'u + renk/ad lookup.
export interface PositionDto {
  id: string;
  name: string;
  colorCode: string | null;
  hourlyRate: number | null;
  isActive: boolean;
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

// ── Görev / Kanban (backend TaskItem) ──
export enum TaskItemStatus {
  ToDo = 0, // Yapılacak
  InProgress = 1, // Devam Ediyor
  Done = 2, // Tamamlandı
}

export enum TaskPriority {
  Low = 0,
  Medium = 1,
  High = 2,
  Urgent = 3,
}

export enum TaskCategory {
  Cleaning = 0,
  Service = 1,
  Kitchen = 2,
  Supply = 3,
  Technical = 4,
  Training = 5,
}

export interface TaskDto {
  id: string;
  branchId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: number;
  category: number;
  status: number;
  assignedUserId: string | null;
  assignedUserName: string | null;
  assignedPositionId: string | null;
  assignedPositionName: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ProblemDetails {
  status: number;
  title: string;
  detail?: string;
  errors?: string[];
}

// ── Müsaitlik (Availability) ──
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface AvailabilityDto {
  id: string;
  userId: string;
  userFullName: string | null;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm" veya "HH:mm:ss"
  endTime: string;
  reason: string | null;
}
