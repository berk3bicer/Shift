# Shift — Gün 18: Duyuru Modülü (Modül 8 [MVP]) — Faz 1 MVP Demo Çekirdeği Tamam

> [!info] Bugünün hedefi Spec Modül 8 "İletişim ve Duyuru"nun [MVP] kısmı: tek yönlü duyuru, yöneticiden role/ekibe, oluşturulunca hedef kullanıcılara **bildirim fan-out'u** (Gün 8 Notification altyapısı yeniden kullanılır). Bu, Faz 1 MVP'nin **demo çekirdeğini tamamlayan** son eksik parçaydı. Read-receipt ("kim okudu" listesi), iki yönlü mesajlaşma = [Faz 2], ertelendi.

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 18 %100 tamamlandı — 82/82 test yeşil

---

## 1. Fan-out: Tek Duyuru → N Bildirim

Duyurunun kalbi: bir `Announcement` kaydı yayınlanır, ardından hedef kullanıcı kümesine **birer `Notification` dağıtılır** (fan-out). İki ayrı kavram:

- **Announcement** = kanonik kayıt ("ne duyuruldu, kim, kime") — kalıcı, tekil.
- **Notification** = her hedef kullanıcının inbox'una düşen kopya — Gün 8'de kurulan altyapı.

Yeni bir bildirim altyapısı YAZMADIK; mevcut `Notification` + `NotificationType.AnnouncementPosted` (yeni enum değeri) + `RelatedEntityId = announcement.Id` (tıkla→duyuruya git) ile mevcut inbox'a bağladık. Personel duyuruyu zaten var olan bildirim listesinden görür.

> [!important] Altyapıyı yeniden kullan, çoğaltma Duyuru "yeni bir bildirim sistemi" gibi görünebilir ama aslında mevcut Notification'ın bir üreticisi. Yeni `Type` + `RelatedEntityId` ile bağlanır. Her "kullanıcıya haber ver" ihtiyacı aynı tabloya akar (vardiya yayını, görev atama, duyuru...) — tek inbox, tek okundu-bilgisi, tek liste ucu. Ortak mekanizmayı tanı, her olaya ayrı boru döşeme.

> [!question] Mülakat Sorusu **"Bir 'duyuru' özelliğini bildirim sisteminin üstüne mi kurarsın, ayrı mı?"** Cevap: Üstüne — duyuru, "birden çok kullanıcıya mesaj ulaştır" probleminin özel bir hâli; bu zaten bildirim sisteminin işi. Duyuruyu kanonik bir kayıt olarak saklar, sonra mevcut bildirim mekanizmasıyla fan-out yaparım. Ayrı bir kanal kurmak inbox'u böler, okundu/listeleme mantığını ikiye katlar.

---

## 2. Hedefleme: Şube ∩ Rol Kesişimi

`Announcement` iki nullable hedef boyutu taşır:
- `BranchId?` — null = tüm şubeler; set = o şubedeki kullanıcılar (`UserBranch` köprüsü).
- `TargetRole?` (RoleType) — null = tüm ekip; set = o role sahip kullanıcılar (`UserRole → Role.Type`).

Recipient çözümü, bu iki filtrenin **kesişimi** (ikisi de varsa AND), gönderen hariç:

```csharp
var recipients = _db.Users.AsQueryable();
if (branchId is {} b)  recipients = recipients.Where(u => _db.UserBranches.Any(ub => ub.UserId==u.Id && ub.BranchId==b));
if (role is {} r)      recipients = recipients.Where(u => _db.UserRoles.Any(ur => ur.UserId==u.Id && ur.Role.Type==r));
var ids = await recipients.Where(u => u.Id != senderId).Select(u => u.Id).ToListAsync(ct);
```

null/null → herkese (tüm ekip). Tüm sorgular global tenant filtresi altında → başka işletmeye sızmaz. Many-to-many köprüler (`UserBranch`, `UserRole`) üzerinden `Any()` ile filtreleme; `Users`'tan başladığımız için sonuç doğal olarak distinct (bir kullanıcı iki kez gelmez).

> [!tip] Gönderene bildirim gitmez `u.Id != senderId` küçük ama önemli: duyuruyu yapan yönetici kendi duyurusunu inbox'ında "okunmamış" görmemeli. Token'dan gelen gönderen kimliği fan-out'tan dışlanır.

> [!question] Mülakat Sorusu **"Çok boyutlu hedeflemeyi (şube + rol) nasıl sorgularsın?"** Cevap: Her boyutu opsiyonel bir `Where` olarak zincirlerim; verilmeyen boyut filtre eklemez (null = kısıtlama yok). Many-to-many ilişkilerde ana tablodan (Users) başlayıp köprülerde `Any()` ile süzerim — böylece sonuç distinct kalır ve verilen boyutların kesişimi (AND) doğal olarak oluşur.

---

## 3. Atomiklik: Duyuru + Tüm Bildirimler Tek SaveChanges

Announcement kaydı ve N bildirim **tek `SaveChanges`** içinde yazılır → ya hepsi gider ya hiçbiri. Yarı-yazılmış durum (duyuru var ama bildirimler yok, ya da tersi) olamaz. `announcement.Id` BaseEntity'de construct anında üretildiği için (Guid.NewGuid), bildirimlerin `RelatedEntityId`'si kaydetmeden önce bağlanabilir.

> [!question] Mülakat Sorusu **"Bir ana kayıt + ona bağlı çok sayıda yan kaydı nasıl tutarlı yazarsın?"** Cevap: Hepsini tek transaction/SaveChanges'te. Ana kaydın kimliğini önceden üretip (client-side Guid) yan kayıtlara bağlar, sonra topluca kaydederim. Böylece ya bütün küme kalıcılaşır ya hiçbiri — "duyuru var, bildirim yok" gibi yarı durumlar imkânsız.

---

## 4. Faz Sınırı: Read-Receipt [Faz 2]

Berke'nin çizdiği sınır: "OkuyanlarListesi" (yöneticiye **kim okudu** raporu) = [Faz 2], modellenmedi. MVP'de `Notification.IsRead` var (kullanıcı kendi bildirimini okudu mu) ama yöneticiye "şu duyuruyu 5/8 kişi okudu" raporu YOK — o ayrı bir read-receipt tablosu (Announcement × User) gerektirir, Faz 2.

Aynı şekilde ertelenen: iki yönlü mesajlaşma (yönetici↔personel birebir), zamanlanmış/zorunlu-onaylı duyuru, pozisyon bazlı hedefleme ("tüm garsonlar" — şu an rol bazlı; roadmap pozisyon da diyor, gerekirse eklenir).

---

## 5. Faz 1 MVP — Demo Çekirdeği Tamam

Bu modülle Faz 1 MVP'nin gösterilebilir çekirdeği tamamlandı:
- **Vardiya & plan** (CRUD, iş kuralları, publish), müsaitlik, izin
- **Giriş-çıkış** (time clock), **mesai/bordro** (İş Kanunu 45s, fazla mesai, gece/hafta sonu primi, brüt, CSV export)
- **Görev/Kanban** (state machine), **kontrol listeleri** (şablon/çalıştırma + snapshot)
- **Vardiya notları** (handoff), **duyuru** (fan-out + bildirim)

Hepsi multi-tenant, JWT, rol bazlı yetki, 82 test yeşil.

---

## 6. Durum (Gün 18 sonu)

**Yeni dosyalar:**
- `Domain/Entities/Announcement.cs` — entity (hedef şube/rol, nullable)
- `Application/Features/Announcements/Create/` — Command+Result, Validator, Handler (**fan-out**)
- `Application/Features/Announcements/List/` — Query+DTO, Handler
- `Application/Features/Announcements/Get/` — Query, Handler
- `API/Controllers/AnnouncementsController.cs`
- `tests/Shift.Tests/AnnouncementTests.cs` — 5 test

**Değişen dosyalar:**
- `Domain/Entities/Notification.cs` — `NotificationType.AnnouncementPosted`
- `Application/Common/Interfaces/IShiftDbContext.cs` + `Infrastructure/.../ShiftDbContext.cs` — `Announcements` DbSet + config (Branch/CreatedByUser SetNull, tenant filter, maxlength)

**Migration:** `AddAnnouncements` (Announcements tablosu). DB'ye uygulandı.

**Test: 82/82 yeşil** (77 + 5 yeni: tüm ekibe, role, şubeye, rol∩şube, bildirim-duyuru bağı).

---

## 7. Açık Borçlar ve Sırada Ne Var (Gün 19)

> [!warning] Duyuru modülünde [Faz 2]'ye ertelenen Read-receipt (kim okudu raporu), iki yönlü mesajlaşma, zamanlanmış/zorunlu-onaylı duyuru, pozisyon bazlı hedefleme.

**Faz 1 MVP içi kalan küçük borçlar (demo'yu engellemez):**
- Resmi tatil çarpanı + TR tatil takvimi (mesai).
- Excel (.xlsx) export (bordro — CSV var).
- Checklist şablon Update/Delete; vardiya-kapatma guard'ı.
- Tekrarlayan görevler, fotoğraf ekleme.
- Personele pozisyon atama ucu (İK / Faz 3).

**Olası Gün 19 yönleri:** (a) Excel export — ClosedXML; (b) Tatil takvimi + çarpan (TR'ye özgü); (c) MVP içi cila/borç temizliği (checklist şablon düzenleme, vardiya-kapatma guard'ı); (d) Faz 2'ye geçiş (stok/tedarik/hijyen modüllerinden biri — spec'e bak). Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Duyuru = kanonik kayıt + bildirim fan-out (mevcut Notification altyapısı)
- [ ] Altyapıyı yeniden kullan: yeni Type + RelatedEntityId, yeni boru değil
- [ ] Hedefleme = şube ∩ rol (nullable boyutlar; null = kısıtlama yok)
- [ ] Many-to-many köprüde Any() ile süz, ana tablodan başla → distinct
- [ ] Gönderene bildirim gitmez (senderId hariç)
- [ ] Ana kayıt + N yan kayıt tek SaveChanges → atomik (yarı durum yok)
- [ ] Client-side Guid (BaseEntity) → kaydetmeden RelatedEntityId bağlanır
- [ ] Read-receipt ("kim okudu") = [Faz 2]; MVP'de sadece kullanıcının kendi IsRead'i
- [ ] Faz disiplini: modülde [MVP] çekirdek, [Faz 2] zenginlik ayrı
- [ ] Faz 1 MVP demo çekirdeği tamamlandı (82 test yeşil)

#shift #dotnet #backend #faz1 #duyuru #announcement #fan-out #notification #ef-core #clean-architecture
