# Shift — Gün 2: Faz 1 Başlangıcı (Şube + RBAC)

> [!info] Bugünün hedefi Faz 0 iskeletinin üzerine **ikinci kapsam katmanını** (Branch/Şube) eklemek ve **RBAC**'i (rol bazlı yetki) ilk kez devreye sokmak. Akış: Branch entity → DbContext kaydı (ilişki + query filter + unique index) → migration → CreateBranch (Command) + ListBranches (Query) → BranchesController + `[Authorize(Roles=...)]` → uçtan uca curl testi.

**Tarih:** 11 Haziran 2026 **Stack:** .NET 10, ASP.NET Core Web API, PostgreSQL, EF Core, MediatR **Durum:** ✅ Branch modülü + RBAC tamam · Sırada: Vardiya

---

## 1. İki Seviyeli Kapsam: `TenantId` vs `BranchId`

Faz 0'da `TenantId` ile **izolasyon** kurmuştuk. Şimdi `BranchId` ile **kapsam** ekliyoruz. İkisi farklı işler:

|Kavram|Sorusu|Doğası|
|---|---|---|
|**TenantId**|"Hangi işletme?"|**Güvenlik sınırı** — asla aşılamaz, başka tenant'ın verisi görünmez|
|**BranchId**|"O işletmenin hangi şubesi?"|**Yetki kapsamı** — role göre esner (sahip tüm şubeleri, personel kendi şubesini görür)|

> [!important] Kritik incelik `Branch` entity'si `TenantId` **taşır** (bir şube bir işletmeye aittir) ama `BranchId` **taşımaz** (bir şube kendi kendinin şubesi olamaz). `BranchId`, şubeye ait alt entity'lerde (Shift, Task, Checklist...) görünecek. Branch'in kendisi tenant seviyesinde yaşar.

> [!question] Mülakat Sorusu **"Multi-tenant bir SaaS'ta tenant izolasyonu ile şube (branch) kapsamı arasındaki fark nedir?"** Cevap: Tenant izolasyonu mutlak bir güvenlik sınırıdır — hiçbir kullanıcı başka tenant'ın verisine erişemez, JWT claim + global query filter ile zorlanır. Branch kapsamı ise aynı tenant _içinde_ role göre değişen bir görünürlük katmanıdır; sahip tüm şubeleri görür, personel sadece kendi şubesini. Biri güvenlik (aşılamaz), diğeri yetkilendirme (role göre esner).

---

## 2. Veri Modeli Genişletme: Branch Entity

`Branch : BaseEntity, ITenantEntity`. `ITenantEntity` olduğu için global query filter ona da uygulandı → bir tenant başka tenant'ın şubelerini göremez (Faz 0'daki User/UserRole/RefreshToken ile aynı muamele).

```csharp
public class Branch : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public double? Latitude { get; set; }   // geofence (Faz 2)
    public double? Longitude { get; set; }
    public bool IsActive { get; set; } = true; // soft-delete mantığı
}
```

> [!tip] Tasarım kararları
> 
> - **GPS alanları şimdiden ama nullable:** İleride giriş-çıkış geofence doğrulaması kullanacak. Alan eklemek bedava; nullable çünkü şube açarken GPS zorunlu olmamalı.
> - **`IsActive` (soft delete):** Kapatılan şube **silinmez**, pasifleştirilir. Çünkü o şubenin geçmiş vardiya/mesai/bordro kayıtları durmalı (yasal kayıt). Hard delete bunları uçururdu.

> [!important] Altın Kural: Alan eklemek ucuz, ilişki değiştirmek pahalı Yeni **nullable kolon** eklemek dertsizdir (migration + update, mevcut satırlar NULL kalır). Ama **ilişki** değiştirmek (örn. "tek şube" → "çoğa-çok şube") tablo kurmak, eski kolonu sökmek, veri taşıyan migration yazmak ve tüm sorguları güncellemek demektir. Bu yüzden **belirsiz olan ilişkiyi hiç kurmamak, yanlış kurup sökmekten iyidir.** (Bu yüzden `User`–`Branch` ilişkisini Vardiya'ya kadar erteledik.)

> [!question] Mülakat Sorusu **"Bir kaydı veritabanından silmek yerine neden 'soft delete' (IsActive=false) tercih edersin?"** Cevap: İlişkili geçmiş veriyi korumak için. Bir şube/kullanıcı silinse bile ona bağlı vardiya, mesai, fatura kayıtları yasal ve operasyonel olarak durmalı. Hard delete ya bu kayıtları uçurur ya da FK kısıtı yüzünden hata verir. Soft delete kaydı listelerden gizler ama veriyi ve ilişkileri korur; gerekirse global query filter ile `IsActive` filtresi de otomatikleştirilir.

---

## 3. CQRS'in Okuma Tarafı: İlk Query

Faz 0'da hep **Command** (yazma) yazdık: Register/Login/Refresh — hepsi durumu değiştirir. Bugün ilk **Query**'yi (okuma) yazdık: `ListBranches`.

||Command|Query|
|---|---|---|
|Amaç|Durumu **değiştir**|Veri **oku** (değiştirmez)|
|Örnek|CreateBranch|ListBranches|
|MediatR|`IRequest<T>`|`IRequest<T>` (yapı aynı, niyet farklı)|

> [!note] Neden ayırmak değerli? İleride okuma sorgularını ayrı bir replica'dan çekme, cache'leme, farklı optimize etme imkânı doğar. Şimdilik kavramsal netlik yeterli: "bu işlem yazıyor mu okuyor mu" sorusuna kod yapısı cevap versin.

> [!question] Mülakat Sorusu **"CQRS'te Command ve Query'yi ayırmak ne kazandırır?"** Cevap: Okuma ve yazma sorumluluklarını ayırır; her biri bağımsız optimize/test edilir, niyet kodda netleşir. Yazma tarafı iş kuralı + validation taşır, okuma tarafı sade projeksiyon yapar. İleride okuma/yazma için farklı modeller veya farklı veri kaynakları (read replica) kullanmaya kapı açar.

---

## 4. DTO Projeksiyonu: Entity'yi Asla Doğrudan Döndürme

Handler `Branch` entity'sini değil, küçük bir `BranchDto` döndürür.

```csharp
public record BranchDto(Guid Id, string Name, string? Address,
    double? Latitude, double? Longitude, bool IsActive);

// Handler içinde — SQL'de sadece bu 6 kolon çekilir:
return await _db.Branches
    .OrderBy(b => b.Name)
    .Select(b => new BranchDto(b.Id, b.Name, b.Address,
        b.Latitude, b.Longitude, b.IsActive))
    .ToListAsync(ct);
```

> [!important] Neden entity döndürmüyoruz?
> 
> 1. **Sızıntı önleme:** `Branch.Tenant` navigation property'si var. Entity'yi doğrudan serialize edersek ya gereksiz veri döner ya da döngüsel referans (Branch→Tenant→Branches→...) serializer'ı patlatır.
> 2. **Sözleşme kararlılığı:** Entity iç ihtiyaçla değişir (yeni kolon). DTO ise API sözleşmesidir — frontend ona güvenir. Ayırınca entity değişimi API kontratını istemeden bozmaz.
> 3. **Performans:** `Select` projeksiyonu sayesinde EF Core SQL'de yalnızca gereken kolonları çeker; `Tenant` navigation hiç yüklenmez.

> [!question] Mülakat Sorusu **"API'de entity'yi doğrudan döndürmenin sakıncaları nelerdir? Bunun yerine ne yaparsın?"** Cevap: Entity hassas/gereksiz alanları ve navigation property'leri sızdırır, döngüsel referansa yol açabilir, ve API sözleşmesini iç veri modeline bağlar (entity değişince kontrat bozulur). Bunun yerine sadece gereken alanları taşıyan bir DTO'ya projekte ederim (`Select`). Böylece SQL'de yalnızca gereken kolonlar çekilir, sözleşme entity'den bağımsız kalır.

---

## 5. RBAC — Rol Bazlı Yetki (İlk Kez Devrede)

Faz 0'da JWT'ye rolleri `ClaimTypes.Role` olarak gömüyorduk ("Owner", "Manager"...). Bugün onu **kullandık**.

```csharp
[Authorize]                          // sınıf seviyesi: token zorunlu (yoksa 401)
[Authorize(Roles = "Owner")]         // sadece sahip (rol yoksa 403)
[Authorize(Roles = "Owner,Manager")] // OR mantığı: ikisinden biri yeterli
```

|Katman|Soru|Sonuç|
|---|---|---|
|`[Authorize]`|Token var mı?|Yoksa **401 Unauthorized**|
|`[Authorize(Roles=...)]`|Rol yeterli mi?|Yetersizse **403 Forbidden**|

> [!note] 401 vs 403 farkı **401** = "kimsin bilmiyorum" (kimlik yok/geçersiz). **403** = "kim olduğunu biliyorum ama bu işe yetkin yok". RBAC asıl işini 403'te yapar — token geçerli ama rol uymuyor.

> [!tip] İki katmanlı yetki (spec gereği)
> 
> - **RBAC (bugün):** Kaba erişim, endpoint seviyesi. "Yöneticiler bu endpoint'e girebilir."
> - **Resource-based (sonra):** İnce erişim, handler içi. "Bu yönetici sadece KENDİ şubesini düzenleyebilir." → Çok-şube senaryosu gelince eklenecek.

> [!question] Mülakat Sorusu **"401 ve 403 arasındaki fark nedir? RBAC hangisini üretir?"** Cevap: 401 kimlik doğrulama hatasıdır (token yok/geçersiz — "kimsin bilmiyorum"). 403 yetkilendirme hatasıdır (kimlik geçerli ama yetki yetersiz — "yetkin yok"). RBAC token geçerliyken rolü kontrol eder; rol uymazsa 403 döner. İkisi sırayla çalışır: önce kimlik (401 kapısı), sonra yetki (403 kapısı).

---

## 6. `IgnoreQueryFilters()` Ne Zaman? (İnce Ayrım)

Aynı global query filter, iki handler'da **zıt** şekilde kullanıldı:

|Handler|Filtre durumu|Neden|
|---|---|---|
|**RegisterHandler**|`IgnoreQueryFilters()` **kullanılır**|Tenant henüz YOK; e-posta global aranmalı|
|**CreateBranchHandler**|filtre **bilerek açık**|Tenant context var; isim kontrolü sadece bu tenant içinde olmalı|

```csharp
// CreateBranch: filtre açık → otomatik sadece bu tenant'ın şubelerine bakar
var nameExists = await _db.Branches.AnyAsync(b => b.Name == request.Name, ct);
```

> [!important] Çıkarım Global query filter "her zaman aç" ya da "her zaman kapat" değildir. Tenant context'in **var olup olmadığına** göre karar verilir. Kayıt anında (tenant yokken) bypass; tenant context içindeyken filtre senin dostundur — başka tenant'ın "Kadıköy" şubesi senin kontrolüne karışmaz.

---

## 7. `TenantId` Elle Set Edilmez

`CreateBranchHandler`'da `Branch` oluştururken `TenantId` **yazılmadı**:

```csharp
var branch = new Branch
{
    // TenantId YOK — SaveChanges interceptor token'dan otomatik damgalar
    Name = request.Name, Address = request.Address, ...
};
```

> [!success] Faz 0'ın meyvesi SaveChanges interceptor (Gün 1) eklenen her `ITenantEntity` kaydına token'daki tenant'ı otomatik damgalıyor. Yeni modül eklerken tenant'ı düşünmek zorunda bile değiliz — altyapı hallediyor.

---

## 8. Bugün Yaşanan Tuzaklar

> [!warning] Tuzak 1: Tenant'ta çift `Users` tanımı `Branch` koleksiyonunu eklerken `Users` satırı kopyalanıp adı değiştirilmeyince iki kez `public ICollection<User> Users` oluştu → `CS0102: 'Users' için zaten bir tanım içeriyor`. **Çözüm:** İkisi de koleksiyon ama biri `User` biri `Branch` olmalı:
> 
> ```csharp
> public ICollection<User> Users { get; set; } = new List<User>();
> public ICollection<Branch> Branches { get; set; } = new List<Branch>();
> ```

> [!warning] Tuzak 2: Interface'e DbSet eklemeyi unutmak `ShiftDbContext`'e `Branches` eklendi ama `IShiftDbContext` interface'ine eklenmedi → `CS1061: IShiftDbContext 'Branches' tanımı içermiyor`. **Ders (Clean Architecture):** Application katmanı somut `ShiftDbContext`'i değil, **soyutlamayı** (`IShiftDbContext`) görür. Concrete class'a eklemek yetmez — **sözleşmeyi (interface) de güncelle**, yoksa Application o özelliğin varlığından habersiz kalır. Derleyici seni tam burada yakalar; bu iyi bir şey.

> [!question] Mülakat Sorusu **"Clean Architecture'da Application katmanı veritabanına nasıl erişir? Neden doğrudan DbContext'i kullanmaz?"** Cevap: Application bir arayüz (`IShiftDbContext`) üzerinden erişir; somut `ShiftDbContext` Infrastructure'dadır. Bağımlılık içe akar — Application, Infrastructure'ı tanımaz. Bu sayede veritabanı/ORM değişse Application etkilenmez ve test için sahte (in-memory/fake) implementasyon verilebilir. Bedeli: yeni bir DbSet eklerken hem concrete class'ı hem interface'i güncellemek gerekir.

---

## 9. Doğrulama — Uçtan Uca curl Testi

|Test|Beklenen|Sonuç|
|---|---|---|
|Register (yeni tenant + owner)|tenantId + userId|✅|
|Login|token + refreshToken döner|✅ (alan adı `token`, `accessToken` değil)|
|Şube oluştur (Owner token)|branchId|✅|
|Şubeleri listele|DTO listesi (Tenant sızmıyor)|✅|
|Token'sız istek|401|✅|
|Staff ile 403|—|⏳ Davet endpoint'i gelince|

> [!note] Ertelenen test Staff rolüyle 403 (RBAC negatif testi) için Staff kullanıcısı gerekiyor; personel davet endpoint'i henüz yok. Davet akışı gelince doğal olarak test edilecek.

---

## 10. Sırada Ne Var (Gün 3)

Faz 1 — Vardiya: "ilk vay be" modülü.

1. **User–Branch ilişkisi** kararı (tek şube mi, çoğa-çok mu) — Vardiya'dan hemen önce, gerçek ihtiyaçla netleşince
2. **Shift (Vardiya) entity** — `TenantId` + `BranchId` + `UserId` (nullable = açık vardiya) + Pozisyon + zaman aralığı
3. **Vardiya CRUD** + drag-drop takvimi besleyecek liste endpoint'leri

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] İki seviyeli kapsam: TenantId (izolasyon, mutlak) vs BranchId (kapsam, role göre esner)
- [ ] Branch `ITenantEntity` → global query filter otomatik izolasyon
- [ ] Soft delete (`IsActive`) — geçmiş kayıt korunur, hard delete uçururdu
- [ ] Altın kural: alan eklemek ucuz, ilişki değiştirmek pahalı → belirsiz ilişkiyi erteleme
- [ ] Command (yazma) vs Query (okuma) — ilk Query: ListBranches
- [ ] DTO projeksiyonu: entity döndürme (sızıntı + sözleşme + performans)
- [ ] RBAC: `[Authorize(Roles=...)]` → 401 (kimlik yok) vs 403 (yetki yok)
- [ ] RBAC (kaba, endpoint) vs resource-based (ince, handler) — ikincisi sonra
- [ ] `IgnoreQueryFilters()`: tenant context yokken bypass, varken filtre dostun
- [ ] TenantId elle set edilmez — SaveChanges interceptor damgalar
- [ ] Clean Architecture: DbSet eklerken concrete class + interface ikisi de güncellenir

#shift #dotnet #backend #faz1 #branch #rbac #cqrs #clean-architecture