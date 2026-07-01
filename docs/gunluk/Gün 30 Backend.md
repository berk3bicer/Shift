# Shift — Gün 30: Faz 2 İnşa Turu #1 — Shift Pool (Vardiya Havuzu) Sıfırdan

> [!info] Bugünün hedefi Doğrulama fazı bitti (8/8); bu **inşa fazı**. Spec Modül 1.4 "Vardiya Havuzu" backend'de **SIFIRDI** — ne entity, ne handler, ne endpoint. Bu tur dikey dilim olarak sun/kap (Give/Take) MVP'sini sıfırdan inşa etti. Trade (takas) kapsam dışı (Faz 2, ayrı tur). Disiplin: entity → DbSet (concrete+interface) → migration Up() oku → handler → controller → test → **curl ile canlı DB doğrulaması** (derleme yeşili kanıt değil).

**Tarih:** 1 Temmuz 2026 **Stack:** .NET 10, EF Core, PostgreSQL, MediatR, FluentValidation, xUnit **Durum:** ✅ Gün 30 tamamlandı — Give/Take/Approve/Reject + onay modu + rol görünürlük + fan-out, uçtan uca curl+DB doğrulandı

---

## 1. Tasarım — Kullanıcıyla Onaylanan Kararlar

İki tasarım kararı DUR-ve-sor ile netleşti:

**(A) Onay modu nerede saklanır → tenant seviyesi.** `ShiftPoolSettings` entity'si `OvertimeSettings` deseniyle birebir: tenant başına TEK satır (TenantId unique index), lazy-default upsert (DB'de kayıt yoksa varsayılan `Open` döner, yazma UPSERT). Branch seviyesi reddedildi (kapsam; henüz branch-bazlı ayar emsali yok).

**(B) "Onay Gerekli" gerçek onay akışıyla mı → Evet.** ApprovalRequired modunda Give/Take hemen mutasyon yapmaz; `ShiftSwap.Status=Pending` kalır, yönetici `approve`/`reject` ile karar verir. Ayar var ama işlevsiz kalmasın.

**Sabitlenmiş ürün kararı — Give/ApprovalRequired = (b):** Personel ApprovalRequired'da vardiyasını sununca **Shift DEĞİŞMEZ ve Published kalır**; onay yalnızca havuza düşmeyi tetikler. 7shifts modeli + spec "yönetici kontrolü kaybetmeden esneklik". (a) anında-UpForGrabs reddedildi. → Curl'de doğrulandı: give → `shiftStatus:1` (Published), swap Pending.

### Veri modeli (spec ShiftSwap ile hizalı)
- `ShiftSwap : BaseEntity, ITenantEntity` — `ShiftId` (FK Cascade), `RequestedByUserId` (FK Restrict, audit), `TargetUserId?` (FK SetNull, **bu turda hep null** — Takas için ayrılmış yer tutucu), `Type` (Give/Take/**Trade=yer tutucu**), `Status` (Pending/Approved/Rejected).
- `Shift.Status` genişledi: `Draft, Published` → `+ UpForGrabs=2, Filled=3`. **`UserId=null` "açık vardiya" kavramına dokunulmadı** (ayrı kaldı). Enum int kolon → migration'da yalnızca 2 yeni tablo çıktı, Status için ALTER yok.
- `NotificationType` +5: `ShiftUpForGrabs=5, ShiftPoolActionRequested=6, ShiftTaken=7, ShiftPoolApproved=8, ShiftPoolRejected=9`.

> [!important] Withdraw — inşa bekliyor (tasarımda yer bırakıldı) "Sundum, kimse kapmadı, vazgeçtim" akışı bu turun DIŞINDA. Ama `Shift.Status` serbestçe geri yazılabilir (enum/şema `UpForGrabs → Published` dönüşünü engellemiyor) — yol kapatılmadı. `Shift.cs`'e açık NOT düşüldü. Ayrı Withdraw endpoint'i sonraki tur.

---

## 2. KRİTİK Ön-Koşul: Exception → HTTP Çevrimi (Şart 2)

Take/Approve yazılmadan ÖNCE çözüldü. Bulgu: `GlobalExceptionHandler` (IExceptionHandler, Program.cs'te `AddExceptionHandler`+`UseExceptionHandler`) zaten var. Switch: `InvalidOperationException→400`, `UnauthorizedAccessException→401`, `ValidationException→400`, `KeyNotFoundException→404`. `CreateShiftHandler` çakışma exception'ını **try/catch'siz** bırakıyor → global handler 400'e çeviriyor. Yani desen hazır — Take/Approve de `ShiftRuleChecker` çakışma exception'ını serbest bırakır, ekstra sarmalama yok.

**Eksik olan tek şey 403.** `UnauthorizedAccessException` 401'e gidiyor (semantik: "kimliksiz"), ama "başkasının vardiyası"/"kapalı mod"/"pozisyon uyuşmazlığı" **403** ("kimlikli ama yetkisiz") istiyor. Çözüm: yeni `ForbiddenAccessException : Exception` (standalone — **`UnauthorizedAccessException`'dan türemez**, yoksa switch'te üst-tip case onu yakalar, pattern matching tuzağı) + switch'e `ForbiddenAccessException → 403` case'i. Sadece ShiftPool handler'larında kullanılıyor.

> [!question] Mülakat Sorusu **"401 mi 403 mü — fark nedir, exception hiyerarşisi neden önemli?"** Cevap: 401 = kimlik yok/geçersiz (login gerek); 403 = kimlik var ama bu kaynağa yetkin yok. C# switch pattern matching üst tipi tutar: `ForbiddenAccessException` yanlışlıkla `UnauthorizedAccessException`'dan türeseydi, `UnauthorizedAccessException => 401` case'i onu da yakalar, 403 hiç dönmezdi. Standalone `: Exception` şart.

---

## 3. Handler'lar — İnce Köprü, Kural Servise

- **Give:** sahiplik kontrolü (`shift.UserId != caller` → 403) + state (`Published` değilse 400) + mod (Closed → 403). Open → `UpForGrabs` + uygun personele fan-out; ApprovalRequired → Pending + yöneticiye onay bildirimi (Shift değişmez).
- **Take:** state (açık `UserId=null,Published` **veya** `UpForGrabs`) + rol görünürlük (`caller.PositionId != shift.PositionId` → 403) + mod (Closed → 403) + **`ShiftRuleChecker.CheckAsync` (çakışma→throw→400)**. Open → `Filled` + `UserId` değişir + yöneticiye bilgi; ApprovalRequired → Pending (Shift değişmez).
- **Decide (Approve/Reject):** state machine (yalnız Pending karara açık — `DecideTimeOff` deseni). **Reject:** swap Rejected, Shift değişmez, talep edene bildirim. **Approve:** mutasyon **onay anında ilk defa** olur.

> [!important] ŞART 1 — Onay anında ShiftRuleChecker TEKRAR koşar ApprovalRequired'da talep Pending beklerken state kayabilir (talep edene başka vardiya atanmış, vardiya kapılmış). Gerçek mutasyon onay anında olduğundan checker **o an tekrar** koşmalı — ilk yeşil onay geçersiz olabilir ("DB'den tekrar oku, optimistic illüzyona güvenme" demir kuralı). Approve/Take'te hem state-drift kontrolü (`stillTakeable`) hem `CheckAsync` re-run. Give-approve'da da drift kontrolü (`shift hâlâ Published + sahibi mi`). **Unit test `Approve_Take_State_Drift_Onay_Aninda_Cakisma_Ile_Reddedilir` bunu kanıtlıyor:** take temiz geçer (Pending) → beklerken çakışan vardiya atanır → approve re-check çakışmayı yakalar → 400, swap Pending kalır, shift değişmez.

Fan-out `ShiftPoolNotifications` static helper'ında toplandı (üç handler'da aynı "şube yöneticileri + owner" ve "aynı pozisyon+şube personel" sorgusu tekrarını önler — `ClockInHandler.NotifyManagersAsync` deseni). SaveChanges çağıran handler'a ait; helper yalnız `Notifications.Add`.

---

## 4. Geçti Kriteri — curl + DB (derleme değil)

API canlı (localhost:5203, PostgreSQL demo veri), her mutasyon DB'den geri okundu:

| # | Senaryo | Sonuç | DB doğrulama |
|---|---------|-------|-------------|
| 1 | GET settings (varsayılan) | `{approvalMode:0}` | lazy default (kayıt yok) |
| 2 | **Mehmet, Ayşe'nin vardiyasını sunar** | **403** "Yalnızca kendi vardiyanızı..." | shift Published kaldı |
| 3 | Ayşe kendi vardiyasını sunar (Açık) | 200 `shiftStatus:2` | shift `Status=2`, swap Give/Approved |
| 4 | Mehmet (Barista) havuzu listeler | vardiyayı **görür** | pozisyon eşleşti |
| 5 | Zeynep (Kasiyer) listeler | **görmez** (0 kayıt) | rol filtresi |
| 6 | Fan-out | Mehmet'e `ShiftUpForGrabs` | Notifications DB'de |
| 7 | **Mehmet kapar (çakışan gün)** | **400** "zaten bir vardiyası var" | İş Kanunu hard-block (gerçek veri) |
| 8 | Mehmet kapar (temiz slot) | 200 `shiftStatus:3` | shift `Status=3` + `UserId=Mehmet` |
| 9 | Fan-out | Owner+Manager'a `ShiftTaken` | Notifications DB'de |
| 10 | **Kapalı mod → Ayşe sunar** | **403** "havuz kapalı" | swap yok |
| 11 | ApprovalRequired → Ayşe sunar | Pending `shiftStatus:1` | **shift Published kaldı** (karar b) |
| 12 | **Personel (Mehmet) onaylar** | **403** (rol auth) | — |
| 13 | Owner onaylar | Approved `shiftStatus:2` | mutasyon onay anında; Ayşe'ye `ShiftPoolApproved` |
| 14 | Onaylanmış swap tekrar reddet | **400** "zaten sonuçlanmış" | state machine |
| 15 | ApprovalRequired → Reject | Rejected `shiftStatus:1` | shift Published korundu; Ayşe'ye `ShiftPoolRejected` |

**Build:** dotnet 0 hata. **Test:** 95→**109 yeşil** (14 yeni ShiftPool testi; 0 regresyon). **Migration `AddShiftPool` Up() okundu:** 2 tablo (ShiftPoolSettings + ShiftSwaps), FK'ler (ShiftId Cascade / RequestedBy Restrict / Target SetNull), TenantId unique + Status/ShiftId index. `database update` uygulandı. Doğrulama sonrası havuz ayarı Açık(0) baseline'a döndürüldü.

> [!question] Mülakat Sorusu **"Optimistic mutasyona neden güvenmedin, onay anında niye tekrar kontrol?"** Cevap: ApprovalRequired'da talep ile onay arasında zaman geçer; o pencerede dünya değişir (personele başka vardiya atanır, vardiya kapılır). İlk kontrol "şu an geçerli"yi söyler, "onay anında geçerli"yi değil. Mutasyon onay anında olduğundan doğruluk penceresi de o an. `CheckAsync`'i orada tekrar koşmazsam çakışan vardiya atayabilirim — İş Kanunu ihlali. DB gerçeği tek kaynak.

---

## 5. Değişen/Eklenen Dosyalar

**Domain:** `ShiftSwap.cs` (yeni), `ShiftPoolSettings.cs` (yeni), `Shift.cs` (enum +UpForGrabs/Filled + Withdraw NOT'u), `Notification.cs` (enum +5).
**Application:** `Common/Exceptions/ForbiddenAccessException.cs` (yeni), `Common/Interfaces/IShiftDbContext.cs` (+2 DbSet), `Features/ShiftPool/{Give,Take,Decide,List,Pending}/` + `ShiftSwapDto` + `ShiftPoolNotifications`, `Features/ShiftPoolSettings/{Get,Update}/`.
**Infrastructure:** `ShiftDbContext.cs` (+2 DbSet, FK/index/filter config), migration `20260701215056_AddShiftPool`.
**API:** `GlobalExceptionHandler.cs` (+403 case), `ShiftPoolController.cs` (yeni), `ShiftPoolSettingsController.cs` (yeni).
**Tests:** `ShiftPoolTests.cs` (14 test).

---

## 6. Biriken Eksik Listesi (etiketli — bu turda güncellendi)

| # | Eksik | Etiket | Not |
|---|-------|--------|-----|
| 1 | ~~Shift Pool (ver/al)~~ | ~~inşa~~ | ✅ **KAPANDI (Gün 30)** — Give/Take MVP curl+DB doğrulandı |
| 2 | PWA | **inşa** | Staff web erişimi + push'a düğümlü |
| 3b | Task foto reload-persistence | **bug** | ChecklistRun deseniyle çözülebilir |
| 4 | Availability tüm-ekip ucu | **temizlik** | N+1 |
| 5 | İzin geçmişi görünümü | **kapsam** | |
| 6 | Kiosk PIN-identity | **kapsam** | |
| 7 | Geç-giriş bildirimi e2e | **doğrulama boşluğu** | |
| 8 | Mesai toleransı | **kapsam (Faz 2+)** | |
| 9 | Toplu kapanış ucu (bordro) | **temizlik** | |
| **10** | **Shift Pool Trade (takas)** | **inşa** | Spec Faz 2; TargetUserId + SwapType.Trade yer tutucu hazır |
| **11** | **Shift Pool Withdraw (geri alma)** | **inşa** | UpForGrabs→Published dönüşü şemaca açık, endpoint yok |
| **12** | **NotificationHandler `UnauthorizedAccess→403` semantik borcu** | **temizlik** | "Bildirim size ait değil" 401 dönüyor; 403 olmalı. Ayrı temizlik turu (Duyuru modülü yeni doğrulandı, regresyon riski) |
| **13** | **Shift Pool FE** | **inşa** | Bu tur backend-only; ekran yok |

---

## 7. Branch Durumu

- **Aktif dal:** `gemini/feature-workspace`.
- **Tamamlanan:** Schedule ✅, Kanban ✅, Müsaitlik+İzin ✅, Time Clock ✅, Mesai/Bordro ✅, Checklist ✅, Vardiya Notları ✅, Duyuru+Bildirim ✅ (doğrulama 8/8), **Shift Pool backend ✅ (Gün 30, inşa)**.
- **Sıradaki:** Shift Pool FE · PWA · Trade/Withdraw batch'i.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] İnşa turu "geçti"si = curl mutlu+hata yolları + her mutasyon DB'den geri okundu; derleme yeşili kanıt DEĞİL
- [ ] Yeni DbSet = HEM concrete (`ShiftDbContext`) HEM interface (`IShiftDbContext`) — yoksa CS1061
- [ ] Enum genişletme (int kolon) migration'da ALTER üretmez; yeni tablo üretir
- [ ] 401 (kimliksiz) ≠ 403 (kimlikli-yetkisiz); custom exception standalone `: Exception` olmalı (switch üst-tip tuzağı)
- [ ] Onay modu (ApprovalRequired) = mutasyon onay anında → `ShiftRuleChecker` o an TEKRAR koşar (state drift)
- [ ] Sabit ürün kararı: ApprovalRequired'da Give → Shift Published kalır, onay havuza düşürür (yönetici kontrolü öncelikli)
- [ ] Fan-out static helper'da toplanır (üç handler aynı hedef sorgusu); SaveChanges çağıran handler'a ait
- [ ] Kapsam disiplini: Trade/Withdraw/FE sessizce eklenmez → gap listesine etiketlenir

#shift #backend #dotnet #shift-pool #vardiya-havuzu #insa-fazi #cqrs #state-machine #is-kanunu #fan-out #403 #curl-dogrulama #gap-list
