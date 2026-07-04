# Frontend Architecture & Progress Handoff (For Claude)

This document summarizes the frontend architecture, patterns, and modules implemented so far for the **Shift** project (a 7shifts-like employee scheduling and payroll application). You can use this as a reference to understand the current state of the codebase, the design decisions made, and how to build upon it.

## 1. Context & Architecture (Mock Mode)

We are building a Next.js (App Router) frontend. Currently, the real .NET backend is not yet fully integrated, so the application runs in a **Mock Mode**. 

### 1.1. Data Flow & Mocking
- **`lib/types.ts`**: Contains all TypeScript definitions for DTOs matching the backend models (e.g., `TimeClockDto`, `OvertimeRecordDto`, etc.).
- **`lib/api-server.ts`**: Handles server-side fetching (used in React Server Components like `page.tsx`). It intercepts specific endpoints based on URL paths and returns static mock arrays/objects.
- **`lib/api-client.ts`**: Handles client-side mutations (used in Client Components). It contains a flag `const isMockMode = true`. When true, functions like `clockIn()` or `closePeriod()` intercept the request, `console.log` the action, simulate a network delay (`setTimeout`), and resolve successfully without actually hitting a backend server.

### 1.2. The "Optimistic UI" Problem & Solution
Because `api-server.ts` returns static data on every page reload, standard Next.js `router.refresh()` calls after a mutation do not show updated data (the server just returns the hardcoded array again).
To solve this for a smooth demo experience, **all Client Components use Optimistic UI state**.
- Components receive `initialData` from the Server Component.
- They copy it into a local `useState` (e.g., `const [records, setRecords] = useState(initialRecords)`).
- When a mutation succeeds (e.g., closing a payroll period), the component manually updates the local `setRecords` state to reflect the change immediately, creating a flawless illusion of a working database.

---

## 2. Completed Modules

### 2.1. Availability (Müsaitlik)
- **Path:** `app/(app)/availability`
- **Features:** Staff can define their recurring weekly availability (e.g., available Mondays 09:00-17:00). 
- **Tech Details:** Uses a complex optimistic update hook to manage adding/removing time slots on the client side without relying on server persistence.

### 2.2. Time Off (İzinler)
- **Path:** `app/(app)/timeoff`
- **Features:** Staff can request time off. Managers can review and Approve/Reject requests.
- **Tech Details:** Implements a strict State Machine (`Pending` -> `Approved` or `Rejected`). Once moved out of `Pending`, the UI locks the action buttons. Optimistic UI is used to move rows from the "Pending" section to the "History" section instantly.

### 2.3. Time Clock (Puantaj / Giriş-Çıkış)
- **Path:** `app/(app)/timeclock`
- **Features:** Tracks actual worked hours. Staff can Clock In and Clock Out.
- **Tech Details:** 
  - Uses the "Open Record" pattern: If `checkOutTime` is `null`, the shift is currently active (staff is "Halen İçeride").
  - Includes an **Identity Selector** dropdown for demo purposes (since we don't have a real auth token, the user can select "I am acting as Ahmet" to test Ahmet's clock-in buttons).

### 2.4. Overtime Settings (Mesai Ayarları)
- **Path:** `app/(app)/settings`
- **Features:** Managers configure payroll rules.
  - Weekly Overtime Threshold (default 45 hours).
  - Multipliers (Overtime, Weekend, Night, Holiday).
  - **Grace Periods (Tolerans):** `earlyClockInToleranceMinutes` and `lateClockOutToleranceMinutes` (e.g., 15 mins). Small deviations from the shift schedule are rounded off to avoid micro-overtime pay.

### 2.5. Overtime Reports (Aylık Rapor)
- **Path:** `app/(app)/reports`
- **Features:** A read-only analytical view calculating normal and overtime hours for the month per employee, explaining the 45-hour/week legal rule.

### 2.6. Payroll & Timesheets (Bordro Kapatma)
- **Path:** `app/(app)/payroll`
- **Features:** Converts volatile Time Clock data into frozen (snapshot) `OvertimeRecord` entries ready for accounting export. Designed heavily inspired by **7shifts**.
- **Tech Details:**
  - **Bulk Close (Approve All):** A master-list grid displays all staff for a selected month. A single "Tümünü Kapat" button iterates over all unlocked staff and locks them simultaneously (simulated via local state loop).
  - **Audit & Unlock:** Records are never deleted. If a mistake is found, a specific row can be "Unlocked" (leaving an audit trail), modified, and then the "Approve All" button is clicked again to lock only the newly corrected row.

---

## 3. Design System & UX
- **Theme:** "Slate-900" with a clean, modern, enterprise SaaS aesthetic (vibrant action colors like Emerald and Rose, soft borders, rounded corners).
- **Icons:** `lucide-react`.
- **Framework:** Vanilla CSS + Tailwind classes (no external UI libraries like Shadcn/MUI were used, components are built from scratch).

## 4. How to Continue (For Claude)
If you are tasked with adding a new module (e.g., **Payroll Export to Excel** or **Shift Scheduling Board**):
1. **Define the Types:** Add the DTOs to `web/lib/types.ts`.
2. **Mock the Server:** Add a path interceptor in `web/lib/api-server.ts` to return dummy data for Server Components.
3. **Mock the Client:** Add a dummy mutation function in `web/lib/api-client.ts` wrapped in an `if (isMockMode)` block with a `setTimeout`.
4. **Build the UI:** Create the Server Component (`page.tsx`) that fetches the data and passes it to a Client Component (`Board.tsx`).
5. **Manage State:** Use `useState` initialized with the server props to handle optimistic UI updates when calling the client API.
