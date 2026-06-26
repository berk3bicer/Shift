#!/usr/bin/env node
// Demo verisi seed — gerçekçi kafe ekibi, sadece kafe pozisyonları, Kadıköy Şubesi dolu hafta.
// DOĞRU KANAL: her şey mevcut API uçlarından (login / pozisyon / staff / vardiya).
// psql YOK (Test Sube 2 yeniden adlandırma ayrı bir manuel adım).
// IDEMPOTENT: var olanı kontrol eder, ikinci çalıştırmada çift veri üretmez.
//
// Çalıştır:  node scripts/seed-demo.mjs   (API http://localhost:5203 açık olmalı)

const API = process.env.API_BASE_URL ?? "http://localhost:5203";
const OWNER = { email: "berke@berkekahve.com", password: "Sifre1234" };
const STAFF_PW = "Sifre1234";
const WEEK_START = "2026-06-29"; // Pazartesi

const RoleType = { Manager: 1, Staff: 3 };

const POSITIONS = [
  { name: "Barista", hourlyRate: 90, colorCode: "#2563eb" },
  { name: "Kasiyer", hourlyRate: 85, colorCode: "#16a34a" },
  { name: "Komi", hourlyRate: 70, colorCode: "#f59e0b" },
  { name: "Müdür", hourlyRate: 130, colorCode: "#7c3aed" },
];

const STAFF = [
  { key: "ayse", fullName: "Ayşe Yılmaz", email: "ayse.yilmaz@berkekahve.com", role: RoleType.Staff, position: "Barista" },
  { key: "mehmet", fullName: "Mehmet Demir", email: "mehmet.demir@berkekahve.com", role: RoleType.Staff, position: "Barista" },
  { key: "zeynep", fullName: "Zeynep Kaya", email: "zeynep.kaya@berkekahve.com", role: RoleType.Staff, position: "Kasiyer" },
  { key: "can", fullName: "Can Öztürk", email: "can.ozturk@berkekahve.com", role: RoleType.Staff, position: "Kasiyer" },
  { key: "elif", fullName: "Elif Şahin", email: "elif.sahin@berkekahve.com", role: RoleType.Staff, position: "Komi" },
  { key: "burak", fullName: "Burak Çelik", email: "burak.celik@berkekahve.com", role: RoleType.Manager, position: "Müdür" },
];

// Haftalık plan: gün index (0=Pzt) → vardiyalar [kişi, başlangıç-saat, bitiş-saat].
// Her kişi günde en fazla 1 vardiya (çakışma=400 olmasın); sabah/akşam kayması.
const PLAN = [
  [["ayse", 8, 16], ["burak", 9, 17], ["zeynep", 10, 18], ["mehmet", 15, 23]],
  [["mehmet", 8, 16], ["can", 10, 18], ["elif", 12, 20], ["ayse", 15, 23]],
  [["ayse", 8, 16], ["zeynep", 9, 17], ["burak", 9, 17], ["mehmet", 15, 23]],
  [["mehmet", 8, 16], ["can", 10, 18], ["elif", 12, 20], ["zeynep", 15, 23]],
  [["ayse", 8, 16], ["burak", 9, 17], ["zeynep", 10, 18], ["mehmet", 15, 23], ["elif", 16, 22]],
  [["mehmet", 9, 17], ["can", 10, 18], ["ayse", 12, 20], ["elif", 14, 22]],
  [["zeynep", 10, 18], ["burak", 11, 19], ["mehmet", 14, 22]],
];

// Kanban görevleri (status: 0=Yapılacak, 1=Devam, 2=Tamamlandı; priority 0-3; category 0-5).
const TASKS = [
  { title: "Akşam kapanış temizliği", priority: 2, category: 0, assign: "elif", status: 1 },
  { title: "Süt/badem sütü stok kontrolü", priority: 1, category: 3, assign: "zeynep", status: 1 },
  { title: "Espresso makinesi bakımı", priority: 3, category: 4, assign: "mehmet", status: 2 },
  { title: "Yeni menü eğitimi", priority: 1, category: 5, assign: null, status: 0 },
  { title: "Vitrin düzenleme", priority: 0, category: 1, assign: "ayse", status: 0 },
];

const addDaysIso = (iso, n) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
};
const iso = (dayIso, hour) => `${dayIso}T${String(hour).padStart(2, "0")}:00:00Z`;

let token;
async function api(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  // 1) Login (Owner)
  const login = await api("POST", "/api/auth/login", OWNER);
  if (!login.ok) throw new Error(`Login başarısız: ${login.status}`);
  token = login.data.token;
  console.log("✓ login");

  // 2) Kadıköy Şubesi
  const branches = (await api("GET", "/api/branches")).data;
  const kadikoy = branches.find((b) => b.name === "Kadıköy Şubesi");
  if (!kadikoy) throw new Error("Kadıköy Şubesi bulunamadı (önce şube olmalı).");
  console.log(`✓ şube: ${kadikoy.name} (${kadikoy.id.slice(0, 8)})`);

  // 3) Pozisyonlar (idempotent: ada göre)
  const existingPos = (await api("GET", "/api/positions")).data;
  const posByName = new Map(existingPos.map((p) => [p.name, p.id]));
  for (const p of POSITIONS) {
    if (posByName.has(p.name)) {
      console.log(`  · pozisyon var: ${p.name}`);
      continue;
    }
    const r = await api("POST", "/api/positions", p);
    if (!r.ok) throw new Error(`Pozisyon '${p.name}' eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
    posByName.set(p.name, r.data.positionId);
    console.log(`  + pozisyon eklendi: ${p.name} (${p.hourlyRate} TL)`);
  }

  // 4) Personel (idempotent: e-postaya göre; staff listesi tenant-içi)
  const staffList = (await api("GET", "/api/staff")).data;
  const idByEmail = new Map(staffList.map((s) => [s.email, s.id]));
  const userIdByKey = {};
  for (const s of STAFF) {
    let id = idByEmail.get(s.email);
    if (id) {
      console.log(`  · personel var: ${s.fullName}`);
    } else {
      const r = await api("POST", "/api/staff", {
        fullName: s.fullName,
        email: s.email,
        password: STAFF_PW,
        role: s.role,
        branchId: kadikoy.id,
        positionId: posByName.get(s.position),
      });
      if (!r.ok) throw new Error(`Personel '${s.fullName}' eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
      id = r.data.userId;
      console.log(`  + personel eklendi: ${s.fullName} — ${s.position}`);
    }
    userIdByKey[s.key] = id;
  }

  // 5) Vardiyalar (idempotent: aynı kişi+başlangıç saati varsa atla)
  const weekEnd = addDaysIso(WEEK_START, 7);
  const existingShifts = (await api(
    "GET",
    `/api/shifts?branchId=${kadikoy.id}&rangeStart=${WEEK_START}T00:00:00Z&rangeEnd=${weekEnd}T00:00:00Z`,
  )).data;
  const shiftKey = (userId, startIso) => `${userId}|${startIso.slice(0, 13)}`;
  const existingShiftKeys = new Set(existingShifts.map((s) => shiftKey(s.userId, s.startTime)));

  let created = 0, skipped = 0;
  for (let day = 0; day < PLAN.length; day++) {
    const dayIso = addDaysIso(WEEK_START, day);
    for (const [key, sh, eh] of PLAN[day]) {
      const userId = userIdByKey[key];
      const startTime = iso(dayIso, sh);
      if (existingShiftKeys.has(shiftKey(userId, startTime))) { skipped++; continue; }
      const staff = STAFF.find((s) => s.key === key);
      const r = await api("POST", "/api/shifts", {
        branchId: kadikoy.id,
        positionId: posByName.get(staff.position),
        userId,
        startTime,
        endTime: iso(dayIso, eh),
        notes: null,
      });
      if (!r.ok) throw new Error(`Vardiya eklenemedi (${key} ${dayIso} ${sh}): ${r.status} ${JSON.stringify(r.data)}`);
      created++;
    }
  }
  console.log(`✓ vardiyalar: +${created} eklendi, ${skipped} zaten vardı`);

  // 6) Görevler / Kanban (idempotent: başlığa göre; hedef sütuna taşı)
  const existingTasks = (await api("GET", `/api/tasks?branchId=${kadikoy.id}`)).data;
  const taskByTitle = new Map(existingTasks.map((t) => [t.title, t]));
  let tCreated = 0, tSkipped = 0;
  for (const t of TASKS) {
    let task = taskByTitle.get(t.title);
    if (!task) {
      const r = await api("POST", "/api/tasks", {
        branchId: kadikoy.id,
        title: t.title,
        description: null,
        dueDate: null,
        priority: t.priority,
        category: t.category,
        assignedUserId: t.assign ? userIdByKey[t.assign] : null,
        assignedPositionId: null,
      });
      if (!r.ok) throw new Error(`Görev '${t.title}' eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
      task = { id: r.data.taskId, status: 0 }; // yeni görev ToDo'da doğar
      tCreated++;
    } else {
      tSkipped++;
    }
    // Hedef sütuna taşı (gerekirse). 400 = "zaten o durumda" → yut.
    if (task.status !== t.status) {
      await api("POST", `/api/tasks/${task.id}/move`, { newStatus: t.status });
    }
  }
  console.log(`✓ görevler: +${tCreated} eklendi, ${tSkipped} zaten vardı`);

  console.log(`\nBitti. Demo: çizelge 'Kadıköy Şubesi' week=${WEEK_START} + Görevler panosu`);
}

main().catch((e) => { console.error("HATA:", e.message); process.exit(1); });
