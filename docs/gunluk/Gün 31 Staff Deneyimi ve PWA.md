# Shift — Gün 31: Faz 2 İnşa Turu #2 — Staff Deneyimi + PWA Kabuğu (Faz 1 MVP Kapanışı)

> [!info] Bugünün hedefi Spec Bölüm 11.2'ye göre Faz 1 MVP'nin son eksiği **Mobil PWA**. Ama teşhis şunu gösterdi: asıl eksik teknik PWA kabuğu değil — **personelin (Staff) kullanabileceği bir arayüzün hiç olmaması**. Tüm frontend tek `(app)` route grubu = Owner/Manager yönetici paneli; rol-bazlı yönlendirme YOK; Staff login olunca yönetici ekranına düşüp 500 alıyordu ("Ayşe → /schedule server error"). Doğru sıra: önce **Parça A (Staff deneyimi + rol guard)**, sonra **Parça B (PWA paketleme)**. Push EN SONA / kapsam dışı (gap #13).

**Tarih:** 2 Temmuz 2026 **Stack:** Next.js 16.2.9, React 19, TypeScript, .NET 10, PostgreSQL **Durum:** ✅ Gün 31 tamamlandı — Staff mobil kabuk (5 ekran) + rol guard + `/mine` self-read uçları + `/me` branch + Next 16 native PWA, uçtan uca tarayıcı+DB doğrulandı

---

## 1. Kritik Teşhis — "PWA eksik" değil, "Staff deneyimi hiç yok"

Frontend'in tamamı `web/app/(app)/` = yönetici paneli. `me.roles` yalnızca buton-gizlemede kullanılıyordu; **rol-bazlı yönlendirme yoktu**. Staff login → `/schedule` (hard-coded) → `(app)/layout.tsx` `getBranches`/`getMe` çağırıyor ama bunlar `Owner,Manager`-only → Staff'a **403 → 500**. Kök neden buydu.

Ayrıca brief "Staff ekranlarının backend uçları hazır" varsayıyordu; tarama **3 gerçek boşluk** buldu (hepsi yetki ya da context eksikliği): `GET /api/shifts` ve `GET /api/tasks` M/O-only (`/mine` yok), clock-in `branchId` ister ama Staff `GET /branches` çağıramaz + `/me` branch taşımaz. → DUR-ve-SOR ile kullanıcıya raporlandı, kararlar alındı.

> [!important] "Derleme yeşili" Staff'ın giremediğini gizler Yönetici paneli sorunsuz derlenir/çalışır; Staff rolüyle girilmeden fark edilmez. Gerçek "geçti" = **Staff kullanıcısıyla** login → kendi ekranı → gerçek mutasyon DB'den geri okundu. Rol-özel yolları rol-özel token'la sınamadan "çalışıyor" denemez.

---

## 2. Parça A — Staff Deneyimi (FE guard + backend self-read)

### Rol-bazlı yönlendirme + guard (FE-only)
- `lib/roles.ts`: `isManager(roles)` (Owner|Manager), `homePathFor(roles)` (yönetici→/dashboard, Staff→/today).
- `app/page.tsx`: kök artık role göre yönlendirir; login formu ve `proxy.ts` (logged-in `/login`) → `/` (role kararı orada).
- `(app)/layout.tsx`: Staff'ı `getBranches` çağrılmadan ÖNCE `/today`'e atar → eski 500 kapandı.
- Staff kabuğu: `(staff)/layout.tsx` (mobil üst-bar, şube seçici YOK, `getBranches` ÇAĞIRMAZ) + `(staff)/today/*`.

> [!important] Next route grubu tuzağı — `(app)` ve `(staff)` URL segmenti EKLEMEZ `(app)/timeoff` ve `(staff)/timeoff` ikisi de `/timeoff`'a çözülür → **"parallel pages" derleme hatası**. Route grupları yalnızca düzen/paylaşım içindir, path'i değiştirmez. Çözüm: Staff alt-sayfalarını `/today/*` altında namespace'ledim (`/today/shifts`, `/today/tasks`, `/today/pool`, `/today/timeoff`, `/today/clock`).

### Backend self-read uçları (kullanıcı kararı: migration YOK, mevcut uçlara DOKUNMA)
Ürün kararı iki sınırla sabitlendi: **(1)** mevcut `Owner,Manager` listeleme uçları DEĞİŞMEZ (Faz 1'de doğrulandı, yetki genişletmek regresyon açar); ayrı `/mine` uçları eklenir. **(2)** her `/mine`: `[Authorize]` (yetki değil) + handler'da `Where(x => x.UserId == currentUserId)` — **veri kendini sınırlar**, `currentUserId` JWT'den (`ICurrentUserProvider`), client'tan ALINMAZ (IDOR).
- `GET /api/shifts/mine` — `MyShiftsQuery/Handler` (ShiftDto yeniden kullanıldı; tarih aralığı + `UserId==caller`).
- `GET /api/tasks/mine` — `MyTasksQuery/Handler` (TaskDto; `AssignedUserId==caller` + opsiyonel status). "Görevi tamamla" (`move`) zaten Staff'a açıktı ama listeleme değildi — bu uç o **asimetriyi** kapatır.
- `GET /api/auth/me` — `branchId` (birincil şube) eklendi. Veri modeli çoğa-çok (`UserBranch`) ama **pratikte her Staff tek şubede** (psql: max=1) → tek şube kararı; ilk atanan (`CreatedAt`) deterministik projeksiyon. Owner UserBranch'te yer almaz → null. **Salt-okuma, şema değişmez.**

> [!question] Mülakat Sorusu **"Staff kendi vardiyasını görsün diye mevcut listeleme ucuna Staff rolü eklesen olmaz mı?"** Cevap: Olmaz. O uç şube bazlı TÜM ekibin vardiyalarını döner; Staff'a açmak "başkasının verisini gör" demek olur (yetki, veri kapsamını daraltmaz). Doğrusu ayrı `/mine` ucu: yetki herkese açık ama sorgu `UserId==token` ile veriyi çağırana kilitler. Yetki ≠ veri kapsamı; ikisini karıştırmak IDOR açar.

### Staff ekranları (client mutation'lar FE'de yeni)
Vardiyalarım (salt-okuma), Görevlerim (move ToDo→InProgress→Done), Vardiya Havuzu (Give kendi Yayında vardiyandan + Take havuzdan; `giveShift`/`takeShift` yeni), İzin (create + `/mine` geçmiş), Giriş-Çıkış (`clockIn`/`clockOut`, branchId `/me`'den).

---

## 3. Parça B — PWA Kabuğu (Next 16 native, `next-pwa` YOK)

AGENTS.md uyarısı ("bu bildiğin Next değil, docs oku") gereği önce `node_modules/next/dist/docs/.../progressive-web-apps.md` okundu. Next 16 resmi yolu: **native `app/manifest.ts`** (→`/manifest.webmanifest`) + **manuel `public/sw.js`** + register client component. Ekstra bağımlılık yok.
- `app/manifest.ts` (standalone, tema #4f46e5, 192/512 ikon any+maskable), `public/sw.js` (network-first navigasyon + cache-first statik + `/api` HİÇ cache + `/offline` fallback; **push YOK**), `app/offline/page.tsx`, `components/PwaRegistrar.tsx` (kök layout, global), `components/staff/InstallHint.tsx` (iOS add-to-home). İkonlar `qlmanage`+`sips` ile `icon.svg`'den üretildi.

> [!important] Next 16'da "Middleware" → **"Proxy"** (`proxy.ts`, fonksiyon `proxy`) Auth guard'ının matcher'ı PWA varlıklarını (`sw.js`, `manifest.webmanifest`, ikonlar, `/offline`) `/login`'e yönlendiriyordu. **sw.js redirect'e düşerse tarayıcı SW kaydını reddeder** ("script resource is behind a redirect"). matcher'a istisnalar eklendi → hepsi oturumsuz da 200.

> [!question] Mülakat Sorusu **"Service worker cache-first statik varlıkları eski kod servis etmez mi (deploy sonrası)?"** Cevap: Prod'da hayır — Next statik chunk'ları içerik-hash'li isimlendirir (`app_..._1c43g7x.js`); yeni build = yeni dosya adı = yeni URL = cache'te yok = taze çekilir. Dev'de hash HMR ile yönetilir; sert reload'da SW eski chunk'ı verebilir (bu turda `fmtDur` düzeltmesinden sonra bir kez yaşandı, cache temizlenince düzeldi). `/api/*` ise HİÇ cache'lenmez — auth/taze veri ve mutasyon asla bayatlamaz.

---

## 4. Geçti Kriteri — tarayıcı + curl + psql (derleme değil)

| # | Senaryo | Sonuç | Doğrulama |
|---|---------|-------|-----------|
| 1 | Staff (Ayşe) login | `/today`, **server error YOK** | tarayıcı |
| 2 | Staff → `/settings` (M/O-only) | temiz `/today` redirect, 500 değil | tarayıcı |
| 3 | Owner login | `/dashboard`, panel bütün | tarayıcı (regresyon yok) |
| 4 | İzin create | "Bekliyor" | DB read-back |
| 5 | Görev move | ToDo→InProgress, `StartedAt` | psql |
| 6 | Havuz Give | shift→UpForGrabs (Status=2) | psql |
| 7 | Havuz Take (happy) | açık shift→Filled (Status=3), UserId=Mehmet | psql |
| 8 | Havuz Take (çakışma) | 400, temiz UI (çökme yok) | İş Kanunu hard-block |
| 9 | `/shifts/mine` izolasyon | Ayşe=4 (psql=4), Mehmet=9 | curl+psql |
| 10 | `/tasks/mine` izolasyon | Ayşe=1 (psql=1) | curl+psql |
| 11 | `/me.branchId` | Kadıköy (Ayşe UserBranch ile eşleşti) | curl+psql |
| 12 | Clock-in | 200, TimeClock **doğru branchId** ile açıldı | psql |
| 13 | Clock-out | workedMinutes=120.37 (backdate 2h + gerçek) | psql |
| 14 | `/timeclocks/mine` izolasyon | yalnız Ayşe | curl |
| 15 | Regresyon | Staff `GET /shifts`+`/tasks`+`/timeclocks` → **403**; Owner → 200 | curl |
| 16 | PWA | manifest 200, SW state=activated (scope /), theme-color+apple-icon head'de, cache `shift-v1` (/offline+/today+static) | tarayıcı |

**Build:** tsc 0, dotnet 0. **Test:** 109→**114 yeşil** (5 yeni `MineQueryTests`; 0 regresyon). **Migration:** `has-pending-model-changes` = "No changes" (3 backend dokunuş — shifts/mine, tasks/mine, /me branch — hepsi salt-okuma projeksiyon, şema değişmedi). **Console:** temiz restart sonrası error seviyesi boş (önceki "parallel pages" hataları bayattı — dosyada çakışma yok).

---

## 5. Değişen/Eklenen Dosyalar

**Backend (3 dokunuş, migration YOK):** `Features/Shifts/Mine/{MyShiftsQuery,MyShiftsHandler}.cs` (yeni), `Features/Tasks/Mine/{MyTasksQuery,MyTasksHandler}.cs` (yeni), `Controllers/ShiftsController.cs` (+`mine`), `Controllers/TasksController.cs` (+`mine`), `Controllers/AuthController.cs` (`/me` +`branchId`, async + IShiftDbContext). **Test:** `tests/Shift.Tests/MineQueryTests.cs` (5 test).
**FE — routing/guard:** `lib/roles.ts` (yeni), `app/page.tsx`, `app/(auth)/login/page.tsx`, `proxy.ts` (matcher + `/login`→`/`), `app/(app)/layout.tsx` (Staff guard + NotificationDto tip).
**FE — Staff kabuğu:** `app/(staff)/layout.tsx` + `app/(staff)/today/{page,shifts,tasks,pool,timeoff,clock}/page.tsx`, `components/staff/{StaffTimeOff,StaffTasks,StaffPool,StaffClock,InstallHint}.tsx`.
**FE — PWA:** `app/manifest.ts`, `public/sw.js`, `app/offline/page.tsx`, `components/PwaRegistrar.tsx`, `app/layout.tsx` (metadata+viewport+registrar), `public/icon-{192,512}.png`, `public/icon.svg`.
**FE — veri katmanı:** `lib/types.ts` (MeResponse.branchId, ShiftPoolItemDto, ShiftSwapDto), `lib/api-server.ts` (getMyShifts/getMyTasks/getShiftPool/getMyTimeClocks/getMyTimeOffRequests), `lib/api-client.ts` (giveShift/takeShift).

---

## 6. Biriken Eksik Listesi (etiketli — bu turda güncellendi)

| # | Eksik | Etiket | Not |
|---|-------|--------|-----|
| 1 | ~~Staff deneyimi + rol guard~~ | ~~inşa~~ | ✅ **KAPANDI (Gün 31)** |
| 2 | ~~PWA kabuğu~~ | ~~inşa~~ | ✅ **KAPANDI (Gün 31)** — manifest+SW+offline (push hariç) |
| 13 | ~~Shift Pool FE~~ | ~~inşa~~ | ✅ **KAPANDI (Gün 31)** — Give/Take Staff kabuğunda |
| **X** | **Staff çok-şubeli olursa clock-in şube seçimi** | **kapsam** | Şu an /me birincil (ilk) şubeyi verir; çok-şube MVP dışı |
| 3b | Task foto reload-persistence | **bug** | ChecklistRun deseniyle çözülebilir |
| 4 | Availability tüm-ekip ucu | **temizlik** | N+1 |
| 5 | İzin geçmişi (yönetici) | **kapsam** | |
| 6 | Kiosk PIN-identity | **kapsam** | |
| 8 | Mesai toleransı | **kapsam (Faz 2+)** | |
| 10 | Shift Pool Trade (takas) | **inşa** | Faz 2, ayrı tur |
| 11 | Shift Pool Withdraw | **inşa** | |
| 12 | NotificationHandler `UnauthorizedAccess→403` | **temizlik** | |
| **13** | **Gerçek push (SignalR/FCM)** | **inşa** | PWA SW hazır; push ayrı altyapı turu |

---

## 7. Branch Durumu

- **Aktif dal:** `gemini/feature-workspace`.
- **Tamamlanan:** Schedule ✅, Kanban ✅, Müsaitlik+İzin ✅, Time Clock ✅, Mesai/Bordro ✅, Checklist ✅, Vardiya Notları ✅, Duyuru+Bildirim ✅, Shift Pool backend ✅ (Gün 30), **Staff Deneyimi + PWA ✅ (Gün 31) → Faz 1 MVP tamam**.
- **Sıradaki:** push altyapısı · Shift Pool Trade/Withdraw · `main`'e merge.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Rol-özel yolu rol-özel token'la sına — "yönetici paneli derleniyor" Staff'ın giremediğini gizler
- [ ] Yetki ≠ veri kapsamı; Staff self-read = ayrı `/mine` ucu + `Where(UserId==token)` (mevcut uca rol EKLEME → IDOR/regresyon)
- [ ] `currentUserId` JWT'den (`ICurrentUserProvider`), client'tan ASLA — TenantId gibi
- [ ] Next route grubu `(x)` URL segmenti eklemez → aynı leaf çakışır ("parallel pages"); namespace path segmentiyle
- [ ] Next 16: Middleware→Proxy (`proxy.ts`); PWA varlıkları (sw.js/manifest/offline) auth guard DIŞINDA olmalı (redirect→SW kaydı reddi)
- [ ] Next 16 native PWA: `app/manifest.ts` + manuel `public/sw.js`, `next-pwa` gerekmez
- [ ] SW cache-first statik prod'da güvenli (içerik-hash'li isim); `/api/*` HİÇ cache'lenmez
- [ ] Salt-okuma projeksiyon (branchId, /mine) migration üretmez — `has-pending-model-changes` ile doğrula

#shift #frontend #backend #nextjs #dotnet #staff #pwa #service-worker #rol-guard #mine-uclari #idor #route-grubu #faz1-mvp #gap-list
