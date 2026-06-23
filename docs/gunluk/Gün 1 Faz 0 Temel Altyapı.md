
> [!info] Bugünün hedefi Sıfırdan **multi-tenant + auth'lu** bir .NET 10 backend iskeleti kurmak. Faz 0'ın tamamı: solution iskeleti → multi-tenancy çekirdeği → roller → auth (register/login/refresh) → exception handling → izolasyon testi → API dokümantasyonu.

**Tarih:** 11 Haziran 2026 **Stack:** .NET 10, ASP.NET Core Web API, PostgreSQL, EF Core, MediatR **Durum:** ✅ Faz 0 %100 tamamlandı

---

## 1. Clean Architecture — 4 Katman

Proje 4 katmana bölündü. Her katman bir sınıf kütüphanesi (`classlib`), sadece API bir `webapi` (çalıştırılabilir olan).

```
API → Infrastructure → Application → Domain
```

Ok yönü "kim kime bağımlı"yı gösterir.

|Katman|İşi|Dış bağımlılık|
|---|---|---|
|**Domain**|Entity'ler, iş kuralları, interface tanımları|Sıfır (en saf)|
|**Application**|Use-case'ler (CQRS handler), iş akışı|Sadece Domain|
|**Infrastructure**|Dış dünya: EF Core, PostgreSQL, JWT, dosya|Application + Domain|
|**API**|HTTP girişi: controller, DI, middleware|Hepsi|

> [!important] Altın Kural **Bağımlılık hep içe akar, dışa asla.** Domain, Infrastructure'ın varlığından bile habersizdir. Bu sayede veritabanını veya framework'ü değiştirsen iş kuralların etkilenmez.

> [!question] Mülakat Sorusu **"Clean Architecture'da bağımlılık yönü neden içe doğrudur? Domain neden hiçbir şeye bağımlı değildir?"** Cevap: İş kurallarını (Domain) dış detaylardan (DB, framework, UI) izole etmek için. Dış katman değişse bile çekirdek bozulmaz. Domain en kararlı, en az değişen kısımdır; ona bağımlı olunur ama o kimseye bağımlı olmaz. (Dependency Inversion Principle)

---

## 2. Multi-Tenancy — Projenin Kalbi

**Tanım:** Tek veritabanı + tek uygulama, tüm işletmeler paylaşır ama hiçbiri diğerinin verisini göremez. Yaklaşım: **shared database, shared schema + `TenantId` kolonu**.

### Neden bu yaklaşım?

|Yaklaşım|İzolasyon|Karmaşıklık|Shift için|
|---|---|---|---|
|Database-per-tenant|En güçlü|Çok yüksek|❌|
|Schema-per-tenant|Güçlü|Yüksek|❌|
|**Shared DB + TenantId**|Yeterli|Düşük|✅|

Kafe/restoran SaaS'ı sağlık sektörü gibi ağır izolasyon gerektirmez. `TenantId` yeterli güvenliği en düşük karmaşıklıkla sağlar.

### Üç Parça (birlikte çalışır)

**1) `ITenantEntity` arayüzü** — "bu entity bir işletmeye aittir" etiketi.

```csharp
public interface ITenantEntity
{
    Guid TenantId { get; set; }
}
```

**2) Global Query Filter** — her okuma sorgusuna otomatik `WHERE TenantId = ...` ekler.

```csharp
modelBuilder.Entity<User>().HasQueryFilter(
    u => u.TenantId == _tenantProvider.GetTenantId());
```

> Sen handler'da `Where(...)` yazmayı unutsan bile, başka tenant'ın verisi sorguya **takılmaz**. Unutkanlığa karşı güvenlik.

**3) SaveChanges Interceptor** — her yeni kayda otomatik `TenantId` damgalar.

```csharp
foreach (var entry in ChangeTracker.Entries<ITenantEntity>())
    if (entry.State == EntityState.Added && tenantId.HasValue)
        entry.Entity.TenantId = tenantId.Value;
```

> [!important] TenantId NEREDEN gelir? **Asla client'tan değil — JWT token'ından.** Kullanıcı login olurken token'ın içine `tenantId` claim'i gömülür. Her istekte `ITenantProvider` bunu token'dan okur. Böylece bir kullanıcı başka tenant'ın verisini _isteyemez_ — token buna izin vermez.

> [!question] Mülakat Sorusu **"Multi-tenant bir uygulamada bir kullanıcının başka bir tenant'ın verisine erişmesini nasıl engellersin?"** Cevap: TenantId'yi client'tan almam, JWT claim'inden okurum. EF Core global query filter ile her sorguya otomatik tenant filtresi eklenir. Yazma sırasında SaveChanges interceptor otomatik damgalar. Üçü birlikte: okumada sızıntı yok, yazmada yanlış tenant'a kayıt yok, kimlik token'dan geliyor (sahtelenemez).

> [!tip] İlişkili kavram: IDOR Bu mantık **IDOR (Insecure Direct Object Reference)** korumasının aynısı. "Kimlik bilgisini client'tan alma, token'dan oku" prensibi hem TenantId hem RequesterId için geçerli.

---

## 3. CQRS + MediatR

**CQRS** = Command Query Responsibility Segregation. Her işlemi ayrı bir nesne olarak modellersin.

Üç parça:

- **Command/Query** — "ne yapmak istiyorum" (veri taşıyıcı `record`)
- **Validator** — girdi geçerli mi (FluentValidation)
- **Handler** — işi yapan kod

**MediatR** = bu parçaları birbirine bağlayan kütüphane. Controller sadece `_mediator.Send(command)` der, gerisini MediatR halleder.

```csharp
public record RegisterCommand(string BusinessName, ...) : IRequest<RegisterResult>;

public class RegisterHandler : IRequestHandler<RegisterCommand, RegisterResult>
{
    public async Task<RegisterResult> Handle(RegisterCommand request, ...) { ... }
}
```

> [!note] Controller neden bu kadar ince? İş mantığı Application katmanında toplanır. Controller sadece HTTP↔command çevirisi yapar. Test edilebilirlik + düzen + tek sorumluluk.

> [!question] Mülakat Sorusu **"CQRS nedir, ne fayda sağlar? MediatR'ın rolü nedir?"** Cevap: Komut (yazma) ve sorgu (okuma) sorumluluklarını ayırmak. Her işlem izole, test edilebilir, tek sorumluluklu. MediatR bir "in-process mediator"dür; controller ile handler arasındaki bağı gevşetir (controller hangi handler'ın çalışacağını bilmez), pipeline behavior'larla cross-cutting concern'leri (validation, logging) merkezi yönetir.

---

## 4. Pipeline Behavior (Cross-Cutting Concern)

`ValidationBehavior` — her command handler'a **varmadan önce** araya giren ara katman. İlgili validator'ı çalıştırır, hata varsa handler hiç çalışmaz.

```csharp
public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse> { ... }
```

> [!tip] Neden değerli? Bir kez yazarsın, **tüm** command'lerde otomatik çalışır. Validation'ı her handler'a tek tek yazmazsın. İleride logging, caching, performance ölçümü de aynı desenle eklenir. Buna "cross-cutting concern" (kesişen ilgi) denir.

> [!question] Mülakat Sorusu **"Cross-cutting concern nedir? Validation'ı her handler'a yazmak yerine nasıl merkezi hale getirirsin?"** Cevap: Birçok yeri kesen ortak ihtiyaçlar (loglama, validation, auth, caching). MediatR pipeline behavior ile bir kez yazıp tüm isteklere uygularım — tekrarı önler, tutarlılık sağlar.

---

## 5. Authentication & Authorization

### Şifre Güvenliği

- Şifre **asla düz metin** tutulmaz → **BCrypt** ile hash'lenir.
- BCrypt yavaş + tuzlu (salt) → kaba kuvvet saldırısını zorlaştırır.
- Hash geri çözülmez; doğrulama `BCrypt.Verify(girilen, hash)` ile yapılır.

### JWT (Access Token)

- Kısa ömürlü (60 dk). İçinde claim'ler: `userId`, `tenantId`, roller, isim, email.
- Gizli anahtarla imzalanır. İçeriği değişirse imza bozulur → sahte token reddedilir.
- JWT içeriği **şifreli değil, sadece imzalı** → hassas veri konmaz (base64 ile okunabilir).

### Refresh Token + Rotasyon

- Uzun ömürlü (7 gün). Veritabanında **hash'li** saklanır (ham değil).
- Access token ölünce, refresh ile sessizce yeni access alınır (tekrar login yok).
- **Rotasyon:** her kullanımda eski refresh token iptal edilir (`IsRevoked = true`), yeni çift verilir.

> [!important] Rotasyon neden kritik? Bir refresh token tek kullanımlık olur. Çalınıp **tekrar** kullanılırsa, zaten iptal edilmiş olduğu için reddedilir → **replay saldırısına karşı koruma**.

### İki Yetki Katmanı

|Katman|Soru|Nasıl|
|---|---|---|
|**RBAC (Rol bazlı)**|"Bu role bu endpoint açık mı?"|`[Authorize(Roles="Manager")]` — kaba erişim|
|**Resource-based**|"Bu kullanıcı BU kaynağın sahibi mi?"|Handler içinde kontrol — ince erişim|

> [!question] Mülakat Sorusu **"Access token ve refresh token farkı nedir? Neden ikisi birden?"** Cevap: Access token kısa ömürlü, her istekte gider, çalınsa az zarar verir (kısa sürede ölür), doğrulaması hızlı (DB'ye sormaz, imzaya bakar). Refresh token uzun ömürlü, DB'de saklanır → çalınsa sunucudan iptal edilebilir, rotasyonla tek kullanımlık yapılır. İkisi birlikte: hem güvenlik hem iyi UX (kullanıcı sürekli login olmaz).

> [!question] Mülakat Sorusu **"JWT'ye hassas veri koyar mısın? Neden?"** Cevap: Hayır. JWT imzalıdır ama şifreli değildir — payload base64 ile herkesçe okunabilir. Sadece kimlik/yetki claim'leri konur, şifre/kart gibi sırlar asla.

> [!question] Mülakat Sorusu **"RBAC ile resource-based authorization farkı nedir?"** Cevap: RBAC kaba: "yöneticiler bu endpoint'e girebilir". Resource-based ince: "bu yönetici sadece KENDİ şubesinin vardiyasını düzenleyebilir". İkisi birlikte çalışır — rol kapıyı açar, resource kontrolü hangi veriye dokunabileceğini sınırlar.

### Davet Tabanlı Kayıt

- Personel kendi başına hesap **oluşturamaz**; yöneticiden davet alır.
- İstisna: yeni işletme sahibi ilk kez kaydolurken yeni bir `Tenant` yaratır (sahip akışı).
- Multi-tenant güvenliğin temeli: rastgele biri bir işletmeye sızamaz.

---

## 6. EF Core & Migration Döngüsü

**Code First:** Entity'leri C#'ta yazarsın, EF onlardan tabloları üretir.

Döngü:

```bash
# 1. Migration üret (SQL planını yaz, henüz DB'ye dokunmaz)
dotnet ef migrations add <Ad> --project ...Infrastructure --startup-project ...API

# 2. DB'ye uygula
dotnet ef database update --project ...Infrastructure --startup-project ...API

# Hatalı migration'ı geri al (henüz uygulanmadıysa)
dotnet ef migrations remove --project ...Infrastructure --startup-project ...API
```

> [!warning] Bugün yaşanan tuzak: Dinamik Seed Değeri `BaseEntity`'de `CreatedAt = DateTime.UtcNow` vardı. Seed (`HasData`) verisinde bu her build'de yeniden hesaplanınca EF "model sürekli değişiyor" sandı ve `PendingModelChangesWarning` fırlattı. **Çözüm:** Seed verilerine **sabit, hardcoded** tarih ver (`new DateTime(2026,1,1,...,DateTimeKind.Utc)`). Seed ID'leri de sabit `Guid` olmalı.

> [!question] Mülakat Sorusu **"EF Core'da seed data (HasData) kullanırken nelere dikkat edersin?"** Cevap: Değerler deterministik (sabit) olmalı — `DateTime.UtcNow`, `Guid.NewGuid()` gibi dinamik değerler kullanılmaz, yoksa model her build'de "değişti" sayılır. ID ve tarihleri hardcode ederim.

> [!note] `--project` vs `--startup-project` `--project` = migration dosyalarının yazılacağı yer (DbContext nerede → Infrastructure). `--startup-project` = bağlantı/DI'ın okunacağı yer (uygulama nereden ayağa kalkar → API). Clean Architecture'da bu ikisi ayrıdır.

---

## 7. Global Exception Handling

Handler'lar iş kuralı ihlalinde exception fırlatır. Merkezi `IExceptionHandler` bunları temiz HTTP cevabına çevirir.

```
UnauthorizedAccessException → 401
ValidationException         → 400
InvalidOperationException   → 400
(bilinmeyen)                → 500
```

Cevap formatı **ProblemDetails** (RFC 7807 standardı):

```json
{"title":"Yetkisiz","status":401,"detail":"Geçersiz veya süresi dolmuş oturum."}
```

> [!important] Neden önemli? Ham stack trace client'a **sızmamalı** — hem çirkin hem güvenlik açığı (iç yapıyı ifşa eder). Merkezi handler tek yerden tüm hataları yönetir.

> [!question] Mülakat Sorusu **"Bir API'de exception'ları nasıl yönetirsin? Stack trace'i kullanıcıya gösterir misin?"** Cevap: Asla. Merkezi bir exception handler ile exception tiplerini uygun HTTP kodlarına map'lerim, ProblemDetails formatında temiz cevap dönerim. Stack trace sadece log'a gider, client'a değil.

---

## 8. Test — İzolasyonun Kanıtı

**xUnit** + **EF Core InMemory** ile multi-tenancy izolasyonu test edildi.

İki test:

1. "Tenant A bağlamında sorgu → sadece A'nın kullanıcısı görünür"
2. "Tenant A, B'nin verisini sorgulayamaz → null döner"

`FakeTenantProvider` ile tenant elle değiştirilip "Berke iken Ayşe'yi görebiliyor muyum?" sınandı.

> [!tip] Neden InMemory? Gerçek PostgreSQL'e bağlanmadan, bellekte izole/hızlı test. Global query filter EF Core seviyesinde çalıştığı için InMemory'de de devrede → izolasyon testi anlamlı.

> [!question] Mülakat Sorusu **"Multi-tenant izolasyonu nasıl test edersin?"** Cevap: İki tenant'a veri yazarım, sonra bir tenant bağlamında sorgu yapıp diğerinin verisinin görünmediğini assert ederim. InMemory provider ile hızlı ve izole; global query filter EF seviyesinde olduğu için InMemory'de de geçerli.

---

## 9. Bir İsteğin Yolculuğu (Özet Akış)

```
HTTP İstek
  → Controller (ince, sadece _mediator.Send)
    → MediatR
      → ValidationBehavior (girdi kontrol)
        → Handler (iş mantığı)
          → IShiftDbContext (Application interface'i)
            → ShiftDbContext (Infrastructure implementasyonu)
              → PostgreSQL
```

Bu yol boyunca **otomatik** devrede:

- Multi-tenancy (TenantId token'dan, global filter)
- Auth (JWT doğrulama, [Authorize])
- Exception handling (hata → temiz HTTP cevabı)

> [!success] Anahtar Çıkarım İskelet bir kez kuruldu. Bundan sonra her modül (Branch, Vardiya, Görev, Stok...) sadece **yeni entity + yeni command/handler + yeni endpoint** eklemek. Zor kısım bitti.

---

## 10. Veritabanı Durumu (Gün 1 sonu)

Oluşan tablolar:

- `Tenants` — işletmeler
- `Users` — kullanıcılar (TenantId + unique email per tenant)
- `Roles` — 5 rol seed'li (Sahip, Yönetici, Asistan Yönetici, Personel, Tedarikçi)
- `UserRoles` — çoğa-çok (bir kullanıcı birden çok rol — spec gereği)
- `RefreshTokens` — hash'li, rotasyonlu
- `__EFMigrationsHistory` — EF'in migration takibi

Çalışan endpoint'ler: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me` API dokümantasyonu: `http://localhost:5203/scalar/v1`

---

## 11. Sırada Ne Var (Gün 2)

Faz 1: MVP — Çekirdek Operasyon. Sıra:

1. **Branch (Şube)** — vardiya bir şubeye ait olacak (spec: "TenantId ile başla, BranchId hemen ardından")
2. **RBAC** — `[Authorize(Roles=...)]` (vardiyayı sadece yönetici oluşturabilsin)
3. **Vardiya** — "ilk vay be" modülü (drag-drop takvim)

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Clean Architecture: bağımlılık içe akar, Domain en saf
- [ ] Multi-tenancy: ITenantEntity + global filter + SaveChanges interceptor
- [ ] TenantId token'dan gelir, client'tan asla
- [ ] CQRS: Command + Validator + Handler, MediatR bağlar
- [ ] Pipeline behavior: cross-cutting concern (validation merkezi)
- [ ] BCrypt (şifre) vs SHA256 (refresh token) — neden farklı
- [ ] Access vs Refresh token + rotasyon (replay koruması)
- [ ] RBAC vs resource-based authorization
- [ ] EF seed: deterministik değer şart
- [ ] Global exception handler → ProblemDetails
- [ ] İzolasyon testi: InMemory + FakeTenantProvider

#shift #dotnet #backend #faz0 #multi-tenancy #auth #clean-architecture