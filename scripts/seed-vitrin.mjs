#!/usr/bin/env node
// VİTRİN tenant seed'i — pazarlama sitesi ekran görüntüleri için tekrarlanabilir,
// DOLU ve gerçekçi veri. Tur 17.
//
// ⚠️ YALNIZCA DEV İÇİNDİR. PROD'DA ASLA ÇALIŞTIRMA. (#vitrin-seed-prod)
//
// GÜVENLİK: Bu script mevcut veriye DOKUNMAZ — DELETE/toplu UPDATE yok. Yalnızca
// yeni bir "Vitrin Kahve" tenant'ı EKLER; psql adımındaki UPDATE de sadece bu yeni
// tenant'ın kendi personel satırlarıyla sınırlıdır (e-posta @vitrinkahve.example).
//
// KVKK: Tüm isimler uydurma, e-postalar rezerve .example TLD'sinde. Screenshot
// yayınlamak için güvenli.
//
// İki kanal birden kullanır:
//   1) API (http://localhost:5203) — tenant/şube/pozisyon/personel/vardiya/görev/checklist.
//   2) psql (DB: shift)          — API'nin üretemediği GEÇMİŞE DÖNÜK puantaj (TimeClock
//      clock-in "şimdi" damgalar, geçmiş girilemez) + davetli personeli aktifleştirme
//      (davet akışı e-postadaki token'ı ister; vitrin için owner'ın BCrypt hash'i
//      kopyalanır → tüm vitrin personelinin şifresi owner şifresiyle aynı olur).
//
// İDEMPOTENT: iki kez çalıştırmak çift kayıt üretmez (ada/e-postaya/saate göre atlar,
// SQL INSERT'ler NOT EXISTS korumalı).
//
// Çalıştır:  node scripts/seed-vitrin.mjs
//   (backend http://localhost:5203 açık ve psql PATH'te olmalı;
//    DB adı gerekirse: PGDATABASE=shift node scripts/seed-vitrin.mjs)

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const API = process.env.API_BASE_URL ?? "http://localhost:5203";
const DB = process.env.PGDATABASE ?? "shift";

const TENANT_NAME = "Vitrin Kahve";
const BRANCH_NAME = "Vitrin Kahve — Merkez";
const OWNER = {
  businessName: TENANT_NAME,
  businessType: 0, // Cafe
  fullName: "Nazlı Vural",
  email: "demo@vitrinkahve.example",
  password: "Vitrin1234",
};

const RoleType = { Manager: 1, Staff: 3 };

const POSITIONS = [
  { name: "Barista", hourlyRate: 90, colorCode: "#2563eb" },
  { name: "Kasiyer", hourlyRate: 85, colorCode: "#16a34a" },
  { name: "Komi", hourlyRate: 70, colorCode: "#f59e0b" },
  { name: "Müdür", hourlyRate: 130, colorCode: "#7c3aed" },
];

// Uydurma, Türkçe-doğal isimler. GERÇEK KİŞİ YOK.
const STAFF = [
  { key: "elif", fullName: "Elif Şahin", email: "elif.sahin@vitrinkahve.example", role: RoleType.Staff, position: "Barista" },
  { key: "mert", fullName: "Mert Aydın", email: "mert.aydin@vitrinkahve.example", role: RoleType.Staff, position: "Barista" },
  { key: "selin", fullName: "Selin Arslan", email: "selin.arslan@vitrinkahve.example", role: RoleType.Staff, position: "Barista" },
  { key: "deniz", fullName: "Deniz Koç", email: "deniz.koc@vitrinkahve.example", role: RoleType.Staff, position: "Kasiyer" },
  { key: "zeynep", fullName: "Zeynep Ateş", email: "zeynep.ates@vitrinkahve.example", role: RoleType.Staff, position: "Kasiyer" },
  { key: "emre", fullName: "Emre Doğan", email: "emre.dogan@vitrinkahve.example", role: RoleType.Staff, position: "Komi" },
  { key: "hakan", fullName: "Hakan Yıldız", email: "hakan.yildiz@vitrinkahve.example", role: RoleType.Manager, position: "Müdür" },
];

// ── İçinde bulunulan haftanın Pazartesi'si (yerel takvim) ──
function currentMonday() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dow = (d.getDay() + 6) % 7; // Pzt=0
  d.setDate(d.getDate() - dow);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const WEEK_START = currentMonday();

// Haftalık plan: gün (0=Pzt) → [kişi | null=AÇIK vardiya, pozisyon, başlangıç, bitiş].
// Saatler duvar saati (uygulama geleneği: "T08:00:00Z" → ekranda 08:00).
// Kişi başı günde tek vardiya (çakışma 400'ü tetiklenmesin).
const PLAN = [
  [["elif", 8, 16], ["hakan", 9, 17], ["deniz", 9, 17], ["emre", 12, 20], ["mert", 15, 23]],
  [["mert", 8, 16], ["zeynep", 9, 17], ["selin", 10, 18], ["elif", 15, 23]],
  [["elif", 8, 16], ["deniz", 9, 17], ["hakan", 9, 17], ["emre", 12, 20], ["mert", 15, 23]],
  [["selin", 8, 16], ["zeynep", 9, 17], ["elif", 12, 20], ["mert", 15, 23]],
  [["elif", 8, 16], ["hakan", 9, 17], ["deniz", 9, 17], ["selin", 12, 20], ["mert", 15, 23]],
  [["mert", 9, 17], ["zeynep", 10, 18], ["emre", 12, 20], ["elif", 14, 22], [null, "Barista", 16, 23]],
  [["deniz", 10, 18], ["selin", 11, 19], ["hakan", 11, 19], [null, "Komi", 12, 20]],
];

// Kanban — üç sütun da dolu; gerçek kafe jargonu.
// status: 0=Yapılacak 1=Devam 2=Tamam · priority: 0-3 · category: 0-5
const TASKS = [
  { title: "Vitrin buzdolabı ısı kontrolü", priority: 2, category: 4, assign: "emre", status: 0 },
  { title: "86 badem sütü — stok say", priority: 1, category: 3, assign: "zeynep", status: 0 },
  { title: "Yeni sezon menü kartlarını yerleştir", priority: 0, category: 1, assign: null, status: 0 },
  { title: "Espresso makinesi backflush", priority: 3, category: 4, assign: "mert", status: 1 },
  { title: "Teras masaları hazır", priority: 1, category: 1, assign: "emre", status: 1 },
  { title: "Kasa açılış sayımı", priority: 2, category: 1, assign: "deniz", status: 2 },
  { title: "Haftalık süt tedarik siparişi", priority: 1, category: 3, assign: "selin", status: 2 },
];

const CHECKLIST = {
  name: "Açılış Kontrol Listesi",
  type: 0, // Opening
  items: [
    "Espresso makinesi ısıtma + backflush",
    "Vitrin ürünlerini yerleştir",
    "Süt / badem sütü stok kontrolü",
    "Kasa açılış sayımı",
    "Tezgah ve masaların temizliği",
    "Teras düzeni ve menü kartları",
  ],
};

// ── Geçmiş ay puantajı (bordro için): geçen ayın tamamı, kişi başı haftalık desen ──
// Deterministik dakika sapması → idempotent (aynı çalıştırmada aynı damgalar üretilir).
function lastMonthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last = new Date(now.getFullYear(), now.getMonth(), 0);
  const p = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  return { from: iso(first), to: iso(last), days: last.getDate(), y: first.getFullYear(), m: first.getMonth() };
}

// kişi → hangi günler (0=Pzt..6=Paz) hangi saatlerde çalıştı.
// Elif'in 2. ve 4. haftasına Cumartesi eklenir → 45s aşımı → fazla mesai satırı doğar.
const CLOCK_PATTERN = {
  elif: { days: [0, 1, 2, 3, 4], start: 8, end: 16.5, extraSat: { start: 8, end: 14 } },
  mert: { days: [0, 1, 2, 3, 4], start: 15, end: 23 },
  deniz: { days: [1, 2, 3, 4, 5], start: 9, end: 17 },
  selin: { days: [0, 2, 4], start: 10, end: 16 },
  emre: { days: [1, 2, 3, 4, 5], start: 12, end: 20 },
};

const sqlEsc = (s) => s.replaceAll("'", "''");

function buildClockRows() {
  const { days, y, m } = lastMonthRange();
  const rows = []; // {email, checkIn, checkOut, isLate}
  const keys = Object.keys(CLOCK_PATTERN);
  for (let day = 1; day <= days; day++) {
    const date = new Date(y, m, day);
    const dow = (date.getDay() + 6) % 7;
    const week = Math.ceil(day / 7);
    keys.forEach((key, ki) => {
      const pat = CLOCK_PATTERN[key];
      let hours = null;
      if (pat.days.includes(dow)) hours = { start: pat.start, end: pat.end };
      else if (pat.extraSat && dow === 5 && week % 2 === 0) hours = pat.extraSat;
      if (!hours) return;
      // deterministik ±4 dk sapma; deniz ayda bir belirgin geç kalır
      const jitter = ((day * 7 + ki * 13) % 9) - 4;
      const late = key === "deniz" && day === 17;
      const inMin = late ? 22 : jitter;
      const outMin = ((day * 11 + ki * 5) % 7) - 3;
      const p = (n) => String(n).padStart(2, "0");
      const dIso = `${y}-${p(m + 1)}-${p(day)}`;
      const t = (h, extraMin) => {
        const total = Math.round(h * 60) + extraMin;
        return `${dIso} ${p(Math.floor(total / 60))}:${p(total % 60)}:00+00`;
      };
      rows.push({
        email: STAFF.find((s) => s.key === key).email,
        checkIn: t(hours.start, inMin),
        checkOut: t(hours.end, outMin),
        isLate: late,
      });
    });
  }
  return rows;
}

function buildSql() {
  const rows = buildClockRows();
  const lines = [
    "-- seed-vitrin otomatik SQL'i — YALNIZCA Vitrin Kahve tenant'ına dokunur. DELETE YOK.",
    "BEGIN;",
    "",
    "-- 1) Davetli vitrin personelini aktifleştir: owner'ın hash'ini kopyala (aynı şifre).",
    "--    Yalnızca @vitrinkahve.example personel, yalnızca hâlâ şifresiz/pasif olanlar.",
    `UPDATE "Users" u SET "PasswordHash" = o."PasswordHash", "IsActive" = true, "UpdatedAt" = now()`,
    `FROM "Users" o`,
    `WHERE o."Email" = '${OWNER.email}'`,
    `  AND u."TenantId" = o."TenantId" AND u."Id" <> o."Id"`,
    `  AND u."Email" LIKE '%@vitrinkahve.example'`,
    `  AND (u."IsActive" = false OR u."PasswordHash" = '');`,
    "",
    "-- 2) Geçen ayın puantajı (kapalı kayıtlar) — bordro/mesai bunlardan hesaplanır.",
  ];
  for (const r of rows) {
    lines.push(
      `INSERT INTO "TimeClocks" ("Id","TenantId","UserId","BranchId","CheckInTime","CheckOutTime","Method","IsLate","CreatedAt")`,
      `SELECT gen_random_uuid(), u."TenantId", u."Id", b."Id", '${r.checkIn}', '${r.checkOut}', 0, ${r.isLate}, now()`,
      `FROM "Users" u JOIN "Branches" b ON b."TenantId" = u."TenantId" AND b."Name" = '${sqlEsc(BRANCH_NAME)}'`,
      `WHERE u."Email" = '${r.email}'`,
      `  AND NOT EXISTS (SELECT 1 FROM "TimeClocks" tc WHERE tc."UserId" = u."Id" AND tc."CheckInTime" = '${r.checkIn}');`,
    );
  }
  lines.push("", "COMMIT;", "");
  return { sql: lines.join("\n"), rowCount: rows.length };
}

// ── API yardımcıları ──
let token;
async function api(method, path, body, useToken = token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(useToken ? { Authorization: `Bearer ${useToken}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-json */ }
  return { ok: res.ok, status: res.status, data };
}

async function login(email, password) {
  const r = await api("POST", "/api/auth/login", { email, password }, null);
  return r.ok ? r.data.token : null;
}

async function main() {
  // ── 1) Tenant: varsa login, yoksa register ──
  token = await login(OWNER.email, OWNER.password);
  if (token) {
    console.log(`✓ tenant zaten var: ${TENANT_NAME} (login başarılı)`);
  } else {
    const reg = await api("POST", "/api/auth/register", OWNER, null);
    if (!reg.ok) throw new Error(`Register başarısız: ${reg.status} ${JSON.stringify(reg.data)}`);
    token = await login(OWNER.email, OWNER.password);
    if (!token) throw new Error("Register sonrası login başarısız.");
    console.log(`+ tenant kuruldu: ${TENANT_NAME} / owner ${OWNER.email}`);
  }

  // ── 2) Şube ──
  const branches = (await api("GET", "/api/branches")).data;
  let branch = branches.find((b) => b.name === BRANCH_NAME);
  if (branch) {
    console.log(`  · şube var: ${branch.name}`);
  } else {
    const r = await api("POST", "/api/branches", { name: BRANCH_NAME, address: "Örnek Cad. 12, Kadıköy", latitude: null, longitude: null });
    if (!r.ok) throw new Error(`Şube eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
    branch = { id: r.data.branchId ?? r.data.id, name: BRANCH_NAME };
    console.log(`  + şube eklendi: ${BRANCH_NAME}`);
  }

  // ── 3) Pozisyonlar ──
  const existingPos = (await api("GET", "/api/positions")).data;
  const posByName = new Map(existingPos.map((p) => [p.name, p.id]));
  for (const p of POSITIONS) {
    if (posByName.has(p.name)) { console.log(`  · pozisyon var: ${p.name}`); continue; }
    const r = await api("POST", "/api/positions", p);
    if (!r.ok) throw new Error(`Pozisyon '${p.name}' eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
    posByName.set(p.name, r.data.positionId);
    console.log(`  + pozisyon: ${p.name} (${p.hourlyRate} TL)`);
  }

  // ── 4) Personel (davet ucu — pasif doğar, psql adımı aktifleştirir) ──
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
        role: s.role,
        branchId: branch.id,
        positionId: posByName.get(s.position),
      });
      if (!r.ok) throw new Error(`Personel '${s.fullName}' eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
      id = r.data.userId;
      console.log(`  + personel: ${s.fullName} — ${s.position}`);
    }
    userIdByKey[s.key] = id;
  }

  // ── 5) Vardiyalar: içinde bulunulan hafta, dolu + 2 açık vardiya ──
  const weekEndExclusive = (() => {
    const [y, m, d] = WEEK_START.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + 7));
    return dt.toISOString().slice(0, 10);
  })();
  const existing = (await api(
    "GET",
    `/api/shifts?branchId=${branch.id}&rangeStart=${WEEK_START}T00:00:00Z&rangeEnd=${weekEndExclusive}T00:00:00Z`,
  )).data;
  const shiftKey = (userId, startIso) => `${userId ?? "open"}|${startIso.slice(0, 13)}`;
  const have = new Set(existing.map((s) => shiftKey(s.userId, s.startTime)));
  let created = 0, skipped = 0;
  for (let day = 0; day < PLAN.length; day++) {
    const [y, m, d] = WEEK_START.split("-").map(Number);
    const dayIso = new Date(Date.UTC(y, m - 1, d + day)).toISOString().slice(0, 10);
    for (const entry of PLAN[day]) {
      const open = entry[0] === null;
      const [keyOrNull, posOrStart, startOrEnd, endMaybe] = entry;
      const positionName = open ? posOrStart : STAFF.find((s) => s.key === keyOrNull).position;
      const startH = open ? startOrEnd : posOrStart;
      const endH = open ? endMaybe : startOrEnd;
      const userId = open ? null : userIdByKey[keyOrNull];
      const startTime = `${dayIso}T${String(startH).padStart(2, "0")}:00:00Z`;
      if (have.has(shiftKey(userId, startTime))) { skipped++; continue; }
      const r = await api("POST", "/api/shifts", {
        branchId: branch.id,
        positionId: posByName.get(positionName),
        userId,
        startTime,
        endTime: `${dayIso}T${String(endH).padStart(2, "0")}:00:00Z`,
        notes: null,
      });
      if (!r.ok) throw new Error(`Vardiya eklenemedi (${keyOrNull ?? "AÇIK"} ${dayIso} ${startH}): ${r.status} ${JSON.stringify(r.data)}`);
      created++;
    }
  }
  console.log(`✓ vardiyalar: +${created}, ${skipped} zaten vardı (hafta ${WEEK_START})`);

  // Haftayı yayınla (Draft → Published; personel /today'de görsün). Tekrarında 0 yayınlar.
  const pub = await api("POST", "/api/shifts/publish-week", {
    branchId: branch.id,
    rangeStart: `${WEEK_START}T00:00:00Z`,
    rangeEnd: `${weekEndExclusive}T00:00:00Z`,
  });
  if (pub.ok) console.log(`✓ hafta yayınlandı (${pub.data.publishedCount ?? 0} vardiya)`);

  // ── 6) Kanban görevleri ──
  const existingTasks = (await api("GET", `/api/tasks?branchId=${branch.id}`)).data;
  const taskByTitle = new Map(existingTasks.map((t) => [t.title, t]));
  let tCreated = 0;
  for (const t of TASKS) {
    let task = taskByTitle.get(t.title);
    if (!task) {
      const r = await api("POST", "/api/tasks", {
        branchId: branch.id,
        title: t.title,
        description: null,
        dueDate: null,
        priority: t.priority,
        category: t.category,
        assignedUserId: t.assign ? userIdByKey[t.assign] : null,
        assignedPositionId: null,
      });
      if (!r.ok) throw new Error(`Görev '${t.title}' eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
      task = { id: r.data.taskId, status: 0 };
      tCreated++;
    }
    if (task.status !== t.status) await api("POST", `/api/tasks/${task.id}/move`, { newStatus: t.status });
  }
  console.log(`✓ görevler: +${tCreated} (3 sütun dolu)`);

  // ── 7) Checklist şablonu ──
  const lists = (await api("GET", "/api/checklists")).data;
  let checklist = lists.find((c) => c.name === CHECKLIST.name);
  if (!checklist) {
    const r = await api("POST", "/api/checklists", { type: CHECKLIST.type, name: CHECKLIST.name, items: CHECKLIST.items });
    if (!r.ok) throw new Error(`Checklist eklenemedi: ${r.status} ${JSON.stringify(r.data)}`);
    checklist = { id: r.data.checklistId };
    console.log(`  + checklist şablonu: ${CHECKLIST.name}`);
  } else {
    console.log(`  · checklist var: ${CHECKLIST.name}`);
  }

  // ── 8) psql adımı: personel aktivasyonu + geçen ay puantajı ──
  const { sql, rowCount } = buildSql();
  const sqlPath = join(tmpdir(), "seed-vitrin.sql");
  writeFileSync(sqlPath, sql);
  try {
    execFileSync("psql", ["-d", DB, "-v", "ON_ERROR_STOP=1", "-q", "-f", sqlPath], { stdio: "inherit" });
    console.log(`✓ psql: personel aktif + ${rowCount} puantaj satırı hedeflendi (varsa atlandı)`);
  } catch (e) {
    console.error(`✗ psql adımı başarısız. Elle çalıştır:  psql -d ${DB} -f ${sqlPath}`);
    throw e;
  }

  // ── 9) Bugünün açılış checklist'ini Elif olarak doldur (kim+saat gerçekçi olsun) ──
  const elifToken = await login(STAFF[0].email, OWNER.password);
  if (!elifToken) throw new Error("Elif login başarısız — psql aktivasyonu çalışmadı mı?");
  const today = new Date();
  const p2 = (n) => String(n).padStart(2, "0");
  const todayIso = `${today.getFullYear()}-${p2(today.getMonth() + 1)}-${p2(today.getDate())}`;
  const runs = (await api("GET", `/api/checklistruns?branchId=${branch.id}&fromDate=${todayIso}&toDate=${todayIso}`)).data;
  let runId = runs.find((r) => r.checklistName === CHECKLIST.name)?.id;
  if (!runId) {
    const r = await api("POST", "/api/checklistruns", { checklistId: checklist.id, branchId: branch.id, runDate: todayIso }, elifToken);
    if (!r.ok) throw new Error(`Checklist run başlatılamadı: ${r.status} ${JSON.stringify(r.data)}`);
    runId = r.data.runId;
  }
  const run = (await api("GET", `/api/checklistruns/${runId}`)).data;
  let checked = 0;
  for (const item of run.items ?? []) {
    if (item.isChecked) continue;
    const r = await api("POST", `/api/checklistruns/${runId}/items/${item.id}/check`, { runId, itemId: item.id, isChecked: true, note: null }, elifToken);
    if (r.ok) checked++;
  }
  console.log(`✓ açılış checklist'i: run ${runId.slice(0, 8)} — ${checked} madde işaretlendi (Elif Şahin)`);

  // ── 10) Geçen ay dönem kapanışı → bordro tablosunda hesaplanmış satırlar ──
  const { from, to } = lastMonthRange();
  const recs = (await api("GET", `/api/overtime/records?from=${from}&to=${to}`)).data ?? [];
  const hasRecord = new Set(recs.map((r) => r.userId));
  let closed = 0;
  for (const key of Object.keys(CLOCK_PATTERN)) {
    const uid = userIdByKey[key];
    if (hasRecord.has(uid)) continue;
    const r = await api("POST", "/api/overtime/close", { userId: uid, from, to });
    if (!r.ok) throw new Error(`Dönem kapatılamadı (${key}): ${r.status} ${JSON.stringify(r.data)}`);
    closed++;
  }
  console.log(`✓ bordro: ${closed} dönem kapatıldı (${from} → ${to}), ${hasRecord.size} zaten kapalıydı`);

  console.log(`\nBitti. Panel girişleri:`);
  console.log(`  Yönetici: ${OWNER.email} / ${OWNER.password}`);
  console.log(`  Personel: ${STAFF[0].email} / ${OWNER.password} (tüm vitrin personeli aynı şifre)`);
}

main().catch((e) => { console.error("HATA:", e.message); process.exit(1); });
