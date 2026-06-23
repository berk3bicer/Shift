# Shift — Gün 7: İzin (Time Off) ve State Machine

> [!info] Bugünün hedefi Faz 1'e **İzin (Time Off)** modülünü eklemek: tek seferlik tarih aralığı + **onay akışı (state machine)**. Yan ürün olarak "login olan kullanıcıyı token'dan okuyan" altyapı (`ICurrentUserProvider`) kuruldu. ShiftRuleChecker'a "o tarihte onaylı izin var" uyarısı entegre edildi.

**Tarih:** 13 Haziran 2026 **Stack:** .NET 10, ASP.NET Core, PostgreSQL, EF Core, MediatR, FluentValidation, xUnit **Durum:** ✅ %100 tamamlandı — 20/20 test yeşil

---

## 1. Time Off vs Availability — kavramsal ayrım

İkisi de "personel ne zaman çalışamaz" der ama farklı kavramlardır. Bu ayrım vardiya planlamasının doğru çalışması için şarttır.

||**Availability (Müsaitlik)**|**Time Off (İzin)**|
|---|---|---|
|Tekrar|TEKRAR EDEN (her Salı)|TEK SEFERLİK (15–20 Temmuz)|
|Zaman|Gün + saat (tarihsiz)|Tarih aralığı (DateOnly)|
|Onay|Yok (tercih)|Var (taahhüt) — Pending/Approved/Rejected|
|Model|Blacklist (müsait-değil dilimleri)|Onaya tabi talep|

> [!important] Neden DateOnly, TimeOnly değil? İzin "gün" mantığında çalışır — kimse "14:30'a kadar izinliyim" demez. `DateOnly` → Postgres `date` kolonu. (Availability'de `TimeOnly` kullanmıştık çünkü o saat-bazlıydı.)

---

## 2. State Machine — projedeki ilk durum geçiş kontrolü

İzin talebinin yaşam döngüsü bir **state machine**'dir: izinli geçişler bellidir, gerisi yasak.

```
Pending ──approve──> Approved (terminal)
   │
   └────reject────> Rejected (terminal)
```

- Talep her zaman `Pending` **doğar** (entity'de default; handler set etmez bile).
- Yalnızca `Pending` bir talep karara açıktır.
- `Approved`/`Rejected` = **terminal** durum; tekrar karara alınamaz.

Kontrolün kalbi tek satır:

```csharp
if (timeOff.Status != TimeOffStatus.Pending)
    throw new InvalidOperationException("Bu talep zaten sonuçlanmış...");
```

Bu `InvalidOperationException` → global handler'da **400 ProblemDetails**'e map olur (Gün 1 altyapısı).

> [!question] Mülakat Sorusu **"Bir kaydın durumunu neden enum + geçiş kontrolüyle yönetirsin, serbest bir string/bool değil?"** Cevap: Geçersiz durum geçişlerini iş kuralı seviyesinde engellemek için. Zaten onaylanmış bir talebi tekrar reddetmek gibi tutarsız geçişler enum + guard ile bloklanır; veri her zaman geçerli bir durumda kalır. String olsa "Aproved" gibi typo'lar ve tanımsız durumlar sızar.

> [!tip] İki ayrı enum: Status vs Decision Domain'de `TimeOffStatus` (3 değer: Pending/Approved/Rejected). API komutunda `TimeOffDecision` (2 değer: Approve/Reject). AYRI tutuldu — dışarıdan "bu talebi tekrar Pending yap" gibi bir karar gönderilemesin. Domain durumu ≠ API'ye açık eylem.

---

## 3. ICurrentUserProvider — "login olan kim?" token'dan

Şimdiye dek `ITenantProvider` vardı (TenantId'yi JWT'den okur). Time Off'ta "talebi kim oluşturdu?" lazım oldu → aynı desenin kardeşi `ICurrentUserProvider` (UserId'yi JWT'den okur).

```csharp
// Application katmanı: interface (HttpContext'ten habersiz)
public interface ICurrentUserProvider { Guid? GetUserId(); }

// Infrastructure katmanı: implementasyon (HttpContext'ten "userId" claim'i)
var claim = _httpContextAccessor.HttpContext?.User?.FindFirst("userId")?.Value;
```

> [!important] Neden UserId client'tan DEĞİL token'dan? IDOR koruması. Eğer talebi oluştururken `userId`'yi request body'sinden alsaydık, Ali kendini Veli gösterip Veli adına izin açabilirdi. Token'dan okuyunca kimlik **sahtelenemez** — TaskFlow'dan gelen "kimlik bilgisini client'tan alma" prensibi.

> [!question] Mülakat Sorusu **"Interface'i neden Application'a, implementasyonu Infrastructure'a koydun?"** Cevap: Bağımlılık içe akar (Clean Architecture). Handler'lar (Application) "current user kim?" diye sormak ister ama HttpContext'in (web detayı) varlığından habersiz olmalı. Interface Application'da durur; Infrastructure onu HttpContext ile doldurur. Web framework'ü değişse Application bozulmaz.

---

## 4. İki ayrı FK, aynı tabloya (self-reference benzeri)

`TimeOffRequest`'in iki `User` ilişkisi var, ikisi de `Users` tablosuna bakar:

- `User` / `UserId` — talebi oluşturan personel (zorunlu)
- `DecidedByUser` / `DecidedByUserId` — kararı veren yönetici (nullable, karar öncesi boş)

EF'e ikisini **açıkça** ayırmazsan tek ilişki sanıp karıştırır:

```csharp
modelBuilder.Entity<TimeOffRequest>()
    .HasOne(t => t.User).WithMany()
    .HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Restrict);

modelBuilder.Entity<TimeOffRequest>()
    .HasOne(t => t.DecidedByUser).WithMany()
    .HasForeignKey(t => t.DecidedByUserId).OnDelete(DeleteBehavior.Restrict);
```

> [!note] Neden ikisi de Restrict? Kullanıcı silinince izin **geçmişi (audit)** uçmasın. "Bu izni kim onayladı?" sorusu sonradan da cevaplanabilmeli. Shift'te User→Shift `SetNull`'dı (açık vardiyaya döner); burada Restrict çünkü izin kaydı kime ait olduğunu kaybetmemeli.

> [!question] Mülakat Sorusu **"Aynı tabloya iki FK olduğunda EF'te ne yaparsın?"** Cevap: Her ilişkiyi ayrı `HasOne().WithMany().HasForeignKey()` ile açıkça tanımlarım. Yoksa EF navigation property'leri eşleştiremez (shadow FK üretir veya hata verir). Navigation isimlerini ayrı tutarım (User / DecidedByUser).

---

## 5. ShiftRuleChecker'a izin entegrasyonu

Vardiya atanırken, vardiyanın günü **onaylı** bir iznin tarih aralığına düşüyorsa **uyarı** (engelleme yok — yönetici override edebilir, 7shifts modeli).

```csharp
var shiftDate = DateOnly.FromDateTime(startTime);
var approvedLeaves = await _db.TimeOffRequests
    .Where(t => t.UserId == uid
             && t.Status == TimeOffStatus.Approved   // sadece Approved!
             && t.StartDate <= shiftDate
             && t.EndDate >= shiftDate)
    .ToListAsync(ct);
```

> [!important] Neden sadece Approved? `Pending` henüz taahhüt değil (reddedilebilir), `Rejected` zaten geçersiz. Yalnızca onaylı izin "bu kişi o gün yok" anlamı taşır.

---

## 6. REST tasarımı: action endpoint'leri

Onay/red için ayrı path'ler ama **tek handler**:

```
POST /api/timeoffrequests/{id}/approve   → DecideTimeOffCommand(id, Approve, note)
POST /api/timeoffrequests/{id}/reject    → DecideTimeOffCommand(id, Reject, note)
```

- `id` ve `decision` URL'den (otorite), sadece opsiyonel `note` body'den.
- İki işlemin mantığı %95 aynı → tek handler, tekrar yok.
- Controller `id`'yi URL'den alır; body'deki id'yi ezer (IDOR — Update'teki `with` mantığı).

---

## 7. Yetki tasarımı

|İşlem|Yetki|Neden|
|---|---|---|
|Create (talep aç)|Sadece `[Authorize]` (login yeter)|Staff dahil herkes KENDİ iznini ister|
|List|`Owner, Manager`|Yönetici onay için görür|
|Approve / Reject|`Owner, Manager`|Karar yönetici işi|

---

## 8. Yapılanlar (dosya dökümü)

**Yeni entity:** `TimeOffRequest` (+ `TimeOffType`, `TimeOffStatus` enum'ları) **Yeni altyapı:** `ICurrentUserProvider` (Application) + `CurrentUserProvider` (Infrastructure) + DI kaydı **Yeni feature'lar:** `TimeOff/Create`, `TimeOff/List`, `TimeOff/Decide` **Yeni controller:** `TimeOffRequestsController` (POST / GET / {id}/approve / {id}/reject) **Değişen:** `ShiftDbContext` + `IShiftDbContext` (DbSet + 2 FK + index + filter), `ShiftRuleChecker` (izin uyarısı) **Migration:** `AddTimeOffRequests` (date kolonları, 2 FK Restrict, index UserId+Status) **Test:** `FakeCurrentUserProvider` + `TimeOffRuleTests` (3) + `DecideTimeOffTests` (2) → toplam 20/20

---

## 9. Borç notları

- [ ] **Enum lokalizasyonu:** uyarıda `Excuse` görünüyor, ideali "Mazeret". Tüm enum'ları (TimeOffType, RoleType...) kapsayan ayrı bir Türkçe etiket eşlemesi; frontend gelince tek yerden. (YAGNI — şimdi değil.)
- [ ] **İzin–vardiya çakışması:** şu an onaylı izin sadece UYARI. İleride "izinli güne vardiya atanınca otomatik açık vardiyaya çevir" düşünülebilir.
- [ ] **"Benim izinlerim" endpoint'i:** personelin kendi taleplerini gördüğü ayrı GET (UserId token'dan). Şu an sadece yönetici listeliyor.
- [ ] (Devam) Gece-aşan vardiya TimeOnly kesişimi; ShiftRuleChecker'daki sabit 11/45 → Tenant ayarına.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Time Off = tek seferlik tarih aralığı + onay; Availability = tekrar eden + tercih
- [ ] State machine: Pending → Approved/Rejected, terminal'den geçiş yasak
- [ ] Status (domain, 3) ≠ Decision (API, 2) — ayrı enum
- [ ] ICurrentUserProvider: UserId token'dan (IDOR), ITenantProvider'ın kardeşi
- [ ] Interface Application'da, implementasyon Infrastructure'da (bağımlılık içe akar)
- [ ] Aynı tabloya 2 FK → her ilişki ayrı HasOne/WithMany/HasForeignKey
- [ ] Audit için DecidedByUserId Restrict (geçmiş uçmasın)
- [ ] ShiftRuleChecker izin uyarısı: yalnızca Approved, engelleme yok (override)
- [ ] DateOnly → Postgres date kolonu

#shift #dotnet #backend #faz1 #timeoff #state-machine #auth #clean-architecture