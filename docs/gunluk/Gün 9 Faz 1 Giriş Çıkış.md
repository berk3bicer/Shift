# Shift — Gün 9: Giriş-Çıkış (Time Clock)

> [!info] Bugünün hedefi Personelin **gerçek** giriş-çıkışını kaydeden puantaj modülünü kurmak. Faz 1'in devamı. Tam akış: `TimeClock` entity → migration → ClockIn (açık kayıt + geç giriş + bildirim) → ClockOut (kaydı kapat) → List (kendi / şube) → controller → curl testi → 5 test. Mesai hesabının (Gün 10) ham verisi burada üretiliyor.

**Tarih:** 23 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), MediatR (CQRS), PostgreSQL, xUnit **Durum:** ✅ Tamamlandı — 31/31 test yeşil

---

## 1. Modül Neden Önce Geliyor? (Plan ≠ Gerçek)

Şu ana kadar elimizde sadece **planlanan** vardiya vardı (`Shift` entity'si). Ama plan ile gerçek aynı şey değildir: 09:00 vardiyasına personel 09:15'te gelebilir.

Mesai hesabı (Gün 10) **planlanan** saate göre değil, **gerçekte çalışılan** saate göre yapılır. Yani Time Clock, mesainin ham verisidir ve bağımlılık sırasında mesaiden önce gelmek zorundadır.

|Kavram|Ne tutar|Örnek|
|---|---|---|
|`Shift` (vardiya)|Planlanan zaman|"Berke 09:00–17:00 çalışacak"|
|`TimeClock` (puantaj)|Gerçekleşen zaman|"Berke 09:15'te girdi, 17:03'te çıktı"|

---

## 2. "Açık Kayıt" Deseni — Yeni Bir State Machine

> [!important] Günün ana kavramı TimeOff'taki state machine `Pending → Approved/Rejected` idi: **bir kaydın durum alanı** değişiyordu. Time Clock'ta farklı bir desen var: **tek bir kayıt iki aşamada dolar.**

- **ClockIn** bir satır oluşturur → `CheckOutTime = null` → kayıt **AÇIK**.
- **ClockOut** aynı satırı bulur → `CheckOutTime`'ı doldurur → kayıt **KAPALI**.

Yani "durum" ayrı bir enum kolonunda değil, `CheckOutTime`'ın **null olup olmamasında** saklı:

```
CheckOutTime == null  →  personel hâlâ içeride (açık)
CheckOutTime != null  →  vardiya bitmiş (kapalı)
```

### Kritik kural: Aynı anda yalnızca BİR açık kayıt

Bir personelin çıkış yapmadan ikinci kez giriş yapması **yasak**. Yoksa mükerrer/tutarsız puantaj oluşur (hangi giriş geçerli?). ClockIn bunu baştan engeller:

```csharp
var hasOpenRecord = await _db.TimeClocks
    .AnyAsync(tc => tc.UserId == userId.Value && tc.CheckOutTime == null, ct);
if (hasOpenRecord)
    throw new InvalidOperationException(
        "Zaten açık bir giriş kaydınız var. Önce çıkış yapmalısınız.");
```

Bu kuralın garantisi, ClockOut'u da basitleştirir: "açık kaydı bul" sorgusu en fazla **bir** sonuç döndürür, belirsizlik yoktur.

> [!tip] Index tasarımı buna göre `(UserId, CheckOutTime)` composite index koyduk. Çünkü en sık sorgu "bu personelin açık kaydı var mı?" — yani `WHERE UserId = ? AND CheckOutTime IS NULL`. Index tam bu sorguyu hızlandırır.

> [!question] Mülakat Sorusu **"Bir varlığın iki aşamalı yaşam döngüsünü (başladı / bitti) veritabanında nasıl modellersin? Ayrı bir durum kolonu mu, yoksa nullable bir bitiş alanı mı?"** Cevap: Duruma göre. İki net aşama varsa (giriş açık → kapalı), nullable bitiş alanı (`CheckOutTime`) hem durumu hem veriyi tek kolonda taşır — sade. Üç+ durum veya karmaşık geçişler varsa (Pending/Approved/Rejected gibi) ayrı bir enum durum kolonu daha açıktır. Burada "açık kayıt" için nullable alan yeterli; ayrıca "bir kişide en fazla bir açık kayıt" invariant'ını giriş anında kontrol ederek veri tutarlılığını koruyorum.

---

## 3. Giriş Anında Üç İş (ClockIn Handler)

ClockIn handler tek başına üç sorumluluğu sırayla yürütür:

### 3.1 Şube güvenliği (IDOR koruması)

Gelen `BranchId` gerçekten bizim tenant'ımıza mı ait? Global query filter altında `AnyAsync` → başka tenant'ın şubesine giriş yapılamaz. (TaskFlow'dan gelen "kimlik client'tan değil, kontrol sunucuda" prensibi.)

### 3.2 Açık kayıt kontrolü

Yukarıdaki state machine kuralı (Bölüm 2).

### 3.3 Geç giriş tespiti

Personele atanmış, o şubedeki, başlangıcı bugüne yakın **Published** vardiyayı bul. Giriş anı `vardiya başlangıcı + tolerans`'tan sonraysa → geç.

```csharp
private const int LateGraceMinutes = 5;   // tolerans (grace period)
...
var lateThreshold = todaysShift.StartTime.AddMinutes(LateGraceMinutes);
isLate = now > lateThreshold;
```

> [!note] Neden tolerans (grace period)? Tolerans olmasa 1 dakika geç bile "geç" sayılırdı — gürültülü ve adaletsiz. 5 dakikalık pencere makul bir varsayılan. **Vardiya yoksa** geç sayılmaz: kıyaslanacak referans yoktur (plansız giriş).

> [!warning] Borç notu: ±12 saat penceresi "Bugünün vardiyası"nı `now ± 12 saat` aralığında arıyoruz. Kafe için yeterli (kişi günde tek vardiya). Ama gece-aşan vardiyalarda (Gün 6'daki TimeOnly borcunun kuzeni) bu pencere rafine edilmeli. Şimdilik YAGNI.

---

## 4. Geç Girişte Bildirim — Hedefi Kim Belirliyor?

Geç girişte **yöneticilere** bildirim gider. Ama "yönetici" kim? İki grup:

- **(a)** Bu şubeye atanmış **Manager**'lar → `UserBranch` + `UserRole` join'i
- **(b)** Tüm **Owner**'lar → Owner `UserBranch`'te yer almaz (kapsamı tüm tenant), ayrı çekilir

```csharp
var branchManagerIds = await _db.UserBranches
    .Where(ub => ub.BranchId == branchId)
    .Join(_db.UserRoles, ub => ub.UserId, ur => ur.UserId,
          (ub, ur) => new { ub.UserId, ur.Role.Type })
    .Where(x => x.Type == RoleType.Manager)
    .Select(x => x.UserId)
    .Distinct().ToListAsync(ct);

var ownerIds = await _db.UserRoles
    .Where(ur => ur.Role.Type == RoleType.Owner)
    .Select(ur => ur.UserId)
    .Distinct().ToListAsync(ct);

var targetIds = branchManagerIds.Union(ownerIds)
    .Where(id => id != lateUserId)   // geç gelen kişi kendisi owner olsa bile, kendine bildirim gitmesin
    .ToList();
```

> [!important] Atomiklik Puantaj kaydı + bildirimler **aynı `SaveChangesAsync`'te** yazılır. Yani "kayıt oluştu ama bildirim gitmedi" gibi yarım durum olamaz — ikisi tek transaction.

`NotificationType` enum'una yeni değer ekledik: `LateClockIn = 1` (önceden sadece `ShiftPublished = 0` vardı). Her yeni olay türü buraya eklenir — spec'teki "olay → bildirim" tablosunun kod karşılığı.

---

## 5. Okuma Tarafı — Tek Query, İki Kullanım

`ListTimeClocksQuery` bir `Mine` bayrağıyla iki senaryoyu tek handler'da çözer:

- `Mine = true` → personel kendi geçmişini görür (kimlik token'dan, `BranchId` yok sayılır)
- `Mine = false` → yönetici bir şubenin tüm puantajını görür (`BranchId` ile filtre)

Tenant izolasyonunu global filter zaten sağlıyor; biz üstüne kullanım filtresi biniyoruz. Açık kayıtta `WorkedMinutes = null` (henüz çıkış yok), kapalıda dakika cinsinden süre.

> [!success] Beklenen EF tuzağı bu kez ÇIKMADI Gün 4'te `TimeSpan.TotalHours`'u EF SQL'e çeviremiyordu, belleğe çekip `Sum` yapmıştık. Burada `(CheckOutTime - CheckInTime).TotalMinutes` ifadesinin **List sorgusunda** (SQL'e çevrilmesi gereken yer) patlamasını bekliyordum. Ama **EF Core 10 + Npgsql bunu çevirebildi** — PostgreSQL'in `interval` desteği sağlam. Fix gerekmedi. (Not: ClockOut'taki süre zaten bellekte hesaplanıyor, orada sorun yoktu.)

---

## 6. Yetkilendirme Kararları (Controller)

|Endpoint|Kim erişebilir|Neden|
|---|---|---|
|`POST /clock-in`|Login olan herkes (Staff dahil)|Personel kendi girişini yapar; kimlik token'dan|
|`POST /clock-out`|Login olan herkes|Aynı; açık kayıt otomatik bulunur, parametre yok|
|`GET /mine`|Login olan herkes|Kendi puantajı (token'dan kimlik)|
|`GET /` (şube listesi)|Yalnızca `Owner,Manager`|Başkalarının puantajını görmek yönetici işi|

Prensip: kim olduğu **token'dan** geldiği için clock-in/out'ta ekstra rol kısıtı yok (TimeOff `Create`'teki mantığın aynısı). Sadece "başkasının verisini görme" işlemleri rol kapısıyla korunuyor.

---

## 7. Bugün Yaşanan Tuzak: InMemory + HasData Seed

> [!warning] Test 5 neden ilk seferde kırıldı? Geç-giriş bildirimi testinde Manager'a bildirim gitmesini bekledik ama `Actual: 0` geldi. Sebep: **EF Core InMemory provider, `HasData` (seed) verisini UYGULAMAZ.** Yani test veritabanında `Roles` tablosu boştu. `NotifyManagersAsync` içindeki `Join(... ur.Role.Type ...)` join'i Role kaydını bulamayınca boş döndü → hedef listesi boş → 0 bildirim.

**Kritik ayrım:** Bu bir **kod hatası değildi, test kurulum eksiğiydi.** Canlı PostgreSQL'de Role kayıtları migration ile seed'li (Gün 1'de kuruldu), gerçek API'de çalışıyor. Sadece InMemory testte rolü elle eklemek gerekti:

```csharp
// InMemory provider HasData seed'ini UYGULAMAZ → Manager rolünü elle ekle.
var managerRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
db.Roles.Add(new Role { Id = managerRoleId, Type = RoleType.Manager, Name = "Yönetici" });
```

> [!question] Mülakat Sorusu **"EF Core InMemory provider ile gerçek veritabanı arasında, test yazarken seni yakalayabilecek farklar nelerdir?"** Cevap: Birkaç önemli fark var. (1) InMemory `HasData` seed'ini uygulamaz — seed'e bağlı veriyi testte elle eklemek gerekir. (2) InMemory ilişkisel kısıtları (FK, unique constraint) gerçek DB gibi zorlamaz, bazı bütünlük hataları InMemory'de görünmez. (3) Bazı SQL'e özgü çeviriler (raw SQL, belirli fonksiyonlar) InMemory'de farklı davranır. Bu yüzden InMemory hızlı birim testler için iyidir ama gerçek DB davranışını kanıtlamaz; kritik sorgular için ek olarak gerçek (veya Testcontainers) DB ile entegrasyon testi gerekir. Bizim global query filter EF seviyesinde çalıştığı için izolasyon testleri InMemory'de anlamlı — ama seed'e bağlı senaryoları elle kurmak şart.

---

## 8. Test — 5 Yeni (Toplam 31/31)

`xUnit` + EF Core InMemory + `FakeTenantProvider` + `FakeCurrentUserProvider`:

1. **ClockIn açık kayıt oluşturur** — `CheckOutTime == null`, vardiya yokken `IsLate == false`
2. **Açık kayıt varken ikinci ClockIn engellenir** — state machine (throw)
3. **ClockOut açık kaydı kapatır** — aynı kayıt id, `CheckOutTime` dolu, süre ≥ 0
4. **Açık kayıt yokken ClockOut hata verir** — önce giriş şart
5. **Geç giriş → `IsLate` true + yöneticiye bildirim** — 1 saat geç vardiya + Manager'a `LateClockIn` bildirimi

> [!tip] ClockOut'un validator'ı yok ClockOut hiç parametre almıyor (kim olduğu token'dan, hangi kayıt "açık kayıt" olarak otomatik bulunuyor). Doğrulanacak girdi olmadığı için validator gereksiz. Her handler'a refleksle validator yazma — girdi yoksa gerek de yok.

---

## 9. Veritabanı Durumu (Gün 9 sonu)

Yeni tablo: **`TimeClocks`**

- `Id, TenantId, UserId, BranchId, CheckInTime (not null), CheckOutTime (nullable), Method (int/enum), IsLate (bool), CreatedAt, UpdatedAt`
- 2 FK: `User` ve `Branch` → ikisi de **Restrict** (personel/şube silinse de puantaj geçmişi = audit/bordro korunur)
- Index: `(UserId, CheckOutTime)` (açık kayıt sorgusu) + `(BranchId)` (EF otomatik FK index'i)
- Global tenant filter

Çalışan endpoint'ler (yeni): `POST /api/timeclocks/clock-in`, `POST /api/timeclocks/clock-out`, `GET /api/timeclocks/mine`, `GET /api/timeclocks?branchId=...`

---

## 10. Sırada Ne Var (Gün 10)

**Mesai Hesaplama (İş Kanunu).** Time Clock'un ürettiği ham puantajın üstüne biner:

- Gerçek çalışılan saatlerden otomatik mesai hesabı
- [TR] Haftalık 45 saat üstü → fazla mesai (%50 zamlı)
- [TR] Gece / hafta sonu / resmi tatil çarpanları (işletme bazlı)
- [TR] Türkiye resmi tatil takvimi
- Personel başına aylık mesai özeti

Burada `OvertimeRecord` entity'si (spec'te tanımlı) devreye girecek. ShiftRuleChecker'daki 11/45 sabitleriyle akraba mantık ama bu sefer **gerçek puantajdan**.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Plan ≠ gerçek: `Shift` planı, `TimeClock` gerçekleşeni tutar; mesai gerçeğe göre
- [ ] "Açık kayıt" deseni: tek kayıt iki aşamada dolar (`CheckOutTime` null → dolu)
- [ ] Invariant: bir kişide aynı anda en fazla 1 açık kayıt (giriş anında kontrol)
- [ ] Index `(UserId, CheckOutTime)` → "açık kayıt var mı?" sorgusu için
- [ ] Geç giriş = giriş anı > vardiya başı + grace period (5 dk, sabit → sonra Tenant ayarı)
- [ ] Vardiya yoksa geç sayılmaz (referans yok)
- [ ] Bildirim hedefi: şube Manager'ları (UserBranch+UserRole join) + tüm Owner'lar
- [ ] Kayıt + bildirim tek SaveChanges = atomik
- [ ] FK'ler Restrict → audit/bordro geçmişi korunur
- [ ] EF Core 10 + Npgsql interval'ı SQL'e çevirebildi (Gün 4'ün aksine)
- [ ] **TUZAK:** InMemory `HasData` seed'i uygulamaz → seed verisini testte elle ekle
- [ ] ClockOut'un validator'ı yok — girdi yoksa validator da yok

#shift #dotnet #backend #faz1 #time-clock #state-machine #notifications #ef-core #testing