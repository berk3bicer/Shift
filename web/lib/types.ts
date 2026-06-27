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

// Removed old TaskDto

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

// ── İzin (Time Off) ──
export enum TimeOffStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export enum TimeOffType {
  Annual = 0, // Yıllık izin
  Sick = 1,   // Hastalık
  Excuse = 2, // Mazeret
}

export interface TimeOffRequestDto {
  id: string;
  userId: string;
  userFullName: string | null;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  type: TimeOffType;
  status: TimeOffStatus;
  note: string | null;
  decidedByUserId: string | null;
  decidedByUserFullName: string | null;
}

// ── Giriş-Çıkış (Time Clock) ──
export interface TimeClockDto {
  id: string;
  userId: string;
  userFullName: string | null;
  branchId: string;
  checkInTime: string; // ISO
  checkOutTime: string | null; // ISO (null = halen içeride/açık kayıt)
  isLate: boolean;
  workedMinutes: number | null; // checkOutTime doluysa hesaplanır
}

// ── Mesai Hesaplama (Overtime) ──
export interface OvertimeSettingsDto {
  weeklyOvertimeThresholdHours: number;
  overtimeMultiplier: number;
  nightMultiplier: number;
  weekendMultiplier: number;
  holidayMultiplier: number;
  earlyClockInToleranceMinutes: number; // Erken giriş toleransı (örn: 15 dk)
  lateClockOutToleranceMinutes: number; // Geç çıkış toleransı (örn: 15 dk)
}

export interface OvertimeSummaryDto {
  userId: string;
  userFullName: string | null;
  periodStart: string; // ISO
  periodEnd: string; // ISO
  totalNormalHours: number;
  totalOvertimeHours: number;
  grandTotalHours: number;
}

export interface OvertimeWeekSnapshotDto {
  weekStart: string;
  weekEnd: string;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
}

export interface OvertimeRecordDto {
  id: string;
  userId: string;
  userFullName: string | null;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  appliedHourlyRate: number | null;
  overtimeMultiplier: number | null;
  nightPremium: number | null;
  weekendPremium: number | null;
  grossAmount: number | null;
  isLocked: boolean;
  lockedAt: string | null;
  unlockedAt: string | null;
  weeks?: OvertimeWeekSnapshotDto[]; // Sadece detayda gelir (jsonb)
}

// -----------------------------------------------------------------------------
// Görevler (Tasks / Kanban) Modülü (Gün 15)
// -----------------------------------------------------------------------------

export type TaskItemStatus = "ToDo" | "InProgress" | "Done";
export type TaskPriority = "Low" | "Medium" | "High";
export type TaskCategory = "Kitchen" | "Service" | "Cleaning" | "Other";

export interface TaskItemDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskItemStatus;
  priority: TaskPriority;
  category: TaskCategory;
  
  // Atama (XOR)
  assignedUserId: string | null;
  assignedPositionId: string | null;
  
  // Projection için isimler
  assignedUserName: string | null;
  assignedPositionName: string | null;

  // Zaman damgaları
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  completedByUserId: string | null;
}

// -----------------------------------------------------------------------------
// Kontrol Listeleri (Checklists) Modülü (Gün 16)
// -----------------------------------------------------------------------------

export enum ChecklistType {
  Opening = 0, // Açılış
  Closing = 1, // Kapanış
  Custom = 2   // Diğer
}

export interface ChecklistItemDto {
  id: string;
  checklistId: string;
  text: string;
  orderIndex: number;
}

export interface ChecklistDto {
  id: string;
  name: string;
  type: ChecklistType;
  isActive: boolean;
  items: ChecklistItemDto[];
}

export interface ChecklistRunItemDto {
  id: string;
  checklistRunId: string;
  text: string; // Snapshot
  orderIndex: number;
  isChecked: boolean;
  checkedAt: string | null;
  checkedByUserId: string | null;
  checkedByUserFullName: string | null;
}

export interface ChecklistRunDto {
  id: string;
  branchId: string;
  checklistId: string;
  checklistName: string;
  runDate: string; // "YYYY-MM-DD"
  startedAt: string;
  startedByUserId: string | null;
  startedByUserFullName: string | null;
  completedAt: string | null;
  completedByUserId: string | null;
  completedByUserFullName: string | null;
  items: ChecklistRunItemDto[];
}

// -----------------------------------------------------------------------------
// Vardiya Defteri / Günlük Log (Shift Notes) Modülü (Gün 17)
// -----------------------------------------------------------------------------

export interface ShiftNoteDto {
  id: string;
  branchId: string;
  noteDate: string; // "YYYY-MM-DD" Operasyonel ait olduğu gün
  content: string;
  createdByUserId: string | null;
  createdByUserFullName: string | null;
  createdAt: string; // Gerçek yazıldığı UTC anı
}



