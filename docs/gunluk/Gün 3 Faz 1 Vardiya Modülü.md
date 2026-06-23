# Shift — Gün 3: Faz 1 (Vardiya Modülü)

> [!info] Bugünün hedefi Vardiya'nın ("ilk vay be" modülü) bağlanacağı tüm kapsam katmanlarını kurmak ve Vardiya'nın kendisini uçtan uca çalışır hale getirmek. Akış: User–Branch çoğa-çok ilişkisi → Position entity + CRUD → Shift (Vardiya) entity + CRUD → takvim için tarih aralığı sorgusu → uçtan uca curl testi.

**Tarih:** 11 Haziran 2026 **Stack:** .NET 10, ASP.NET Core Web API, PostgreSQL, EF Core, MediatR **Durum:** ✅ Vardiya çekirdeği ayakta (şube + pozisyon + atanmış/açık vardiya + takvim listesi)

---

## 1. Çoğa-Çok İlişki: Explicit Join Entity

`User` ve `Branch` arasında çoğa-çok ilişki kurduk (bir kullanıcı birden çok şubede, bir şubede birden çok kullanıcı). EF Core'da iki yol var:

|Yöntem|Nasıl|Artı / Eksi|
|---|---|---|
|**Implicit** (otomatik)|İki tarafa koleksiyon koy, EF gizli join tablosu üretir|Kolay ama join tablosuna **kendi alanını ekleyemezsin**|
|**Explicit** (açık join entity)|Ara tabloyu kendin entity yazarsın (`UserBranch`)|Daha fazla kod ama **kontrol sende** (ileride alan eklenebilir)|

**Explicit'i seçtik** (`UserBranch : BaseEntity, ITenantEntity`). Sebep: `UserRole`'u zaten böyle kurmuştuk (tanıdık kalıp), ve ileride "bu şubede ne zamandan beri", "birincil şube mi" gibi alanlar eklenebilir.

```csharp
public class UserBranch : BaseEntity, ITenantEntity
{
    public Guid TenantId { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid BranchId { get; set; }
    public Branch Branch { get; set; } = null!;
}
```

> [!note] Owner bu tabloda yok Owner (işletme sahibi) hiçbir `UserBranch` kaydı taşımaz — kapsamı tüm tenant. Sadece Manager/Staff şubeye bağlanır. "Boş UserBranch = tüm şubeler (owner)" yorumu.

> [!question] Mülakat Sorusu **"EF Core'da çoğa-çok ilişkiyi explicit join entity ile kurmanın implicit'e göre avantajı nedir?"** Cevap: Explicit join entity ara tabloyu gerçek bir entity yapar; böylece ara tabloya kendi alanlarını (tarih, rol, birincil mi vb.) ekleyebilir, ona ayrı sorgu/filtre/index uygulayabilirsin. Implicit'te EF gizli bir tablo üretir, ona alan ekleyemezsin. Veri modeli zenginleşme ihtimali varsa explicit tercih edilir.

---

## 2. Para = `decimal`, Asla `double`

`Position.HourlyRate` (saat ücreti) için `decimal` kullandık.

|Tip|Taban|Kullanım|
|---|---|---|
|`double`|İkili (binary) kayan nokta|Bilimsel/GPS (Branch lat/lng) — yuvarlama toleranslı|
|`decimal`|Ondalık (decimal)|**Para** — tam hassasiyet, kuruş tutar|

> [!important] Neden para `double` olmaz? `double` ikili kayan noktadır; `0.1 + 0.2` bile minik yuvarlama hatası üretir. Mesai/bordro hesabında bu hatalar birikir, kuruşlar tutmaz. `decimal` ondalık tabanlıdır, tam hassasiyetli. PostgreSQL'de `numeric` tipine map olur.

> [!tip] EF Core'da decimal precision `decimal` için precision/scale belirtmezsen EF varsayılan kullanır + uyarı verir. Açıkça belirt:
> 
> ```csharp
> modelBuilder.Entity<Position>()
>     .Property(p => p.HourlyRate)
>     .HasPrecision(10, 2); // numeric(10,2): max 99.999.999,99
> ```
> 
> `double` (lat/lng) için precision gerekmez — o IEEE kayan nokta.

> [!question] Mülakat Sorusu **"Para değerlerini neden double/float yerine decimal ile saklarsın?"** Cevap: double/float ikili kayan noktadır, ondalık sayıları tam temsil edemez; toplama/çarpmada yuvarlama hataları birikir. Para hesabında bu kabul edilemez. decimal ondalık tabanlı ve tam hassasiyetlidir; finansal hesaplarda standarttır. Veritabanında numeric(precision, scale) olarak saklanır.

---

## 3. `DeleteBehavior` Matrisi: Cascade / SetNull / Restrict

`Shift` üç şeye bağlı (Branch, User, Position). Her FK için "üst kayıt silinirse ne olsun" kararı verdik:

|İlişki|Davranış|Neden|
|---|---|---|
|Shift → **Branch**|`Restrict`|Üzerinde vardiya olan şube silinemez (koruma)|
|Shift → **User**|`SetNull`|Personel silinirse vardiya **açık vardiyaya döner** (UserId null), kayıt korunur|
|Shift → **Position**|`Restrict`|Üzerinde vardiya olan pozisyon silinemez|

> [!important] Karar mantığı
> 
> - **Cascade** = üst silinince alt da silinir → geçmiş vardiya/mesai kaydını UÇURUR. Vardiya için YANLIŞ.
> - **SetNull** = üst silinince FK null olur → kayıt durur, sadece "atanmamış" olur. UserId nullable olduğu için mümkün.
> - **Restrict** = üzerinde bağımlı kayıt varsa üst SİLİNEMEZ → yanlışlıkla silmeyi engeller.
> 
> Asıl koruma yine **soft delete**: personel/şube/pozisyon gerçekte hard-delete edilmeyecek (`IsActive=false`). DeleteBehavior, "yine de biri DB'den silerse tutarlı kalsın" güvenlik ağı.

> [!note] Çoklu cascade yolu (multiple cascade paths) Bir entity birden çok yoldan aynı üste Cascade ile bağlıysa bazı DB'ler (SQL Server) reddeder. PostgreSQL izin verir. Yine de Shift'te Restrict/SetNull seçerek bu riski tamamen eledik — hem güvenli hem niyet doğru.

> [!question] Mülakat Sorusu **"Bir entity silinince ilişkili kayıtlara ne olacağını nasıl kontrol edersin? Cascade, SetNull, Restrict ne zaman?"** Cevap: EF Core'da `OnDelete(DeleteBehavior.X)` ile. Cascade: üst silinince alt da silinsin (bağımlı kayıt anlamsızsa). SetNull: FK nullable'sa, üst silinince ilişki kopsun ama kayıt kalsın (geçmiş veri korunmalıysa). Restrict: bağımlı kayıt varken üst silinmesin (yanlışlıkla veri kaybını önler). Geçmiş/yasal kayıt taşıyan tablolarda Cascade'den kaçınılır.

---

## 4. Namespace–Entity İsim Çakışması + Alias

Entity adı `Shift`, kök namespace de `Shift` (`Shift.Domain`, `Shift.Application`...). Çakışma:

```
error CS0118: 'Shift' bir ad alanı öğesidir ancak tür olarak kullanılır
```

`DbSet<Shift>` yazınca derleyici `Shift`'i namespace sanıyor, entity'yi değil.

> [!warning] Bugün yaşanan tuzak Hem `IShiftDbContext` hem `ShiftDbContext`'te `DbSet<Shift>` / `Entity<Shift>()` çakıştı. İki çözüm:
> 
> 1. **Tam-nitelikli ad:** `DbSet<Shift.Domain.Entities.Shift>` — birkaç yerde iş görür.
> 2. **Alias:** dosya başına `using ShiftEntity = Shift.Domain.Entities.Shift;` → sonra `ShiftEntity` yaz. Entity ismi çok geçen yerlerde (handler'lar) tercih edilir.
> 
> DbContext'te tam-nitelikli, handler'da alias kullandık. (Daha temiz alternatif: entity'yi `WorkShift` adlandırmak, ama mevcut projede değiştirmeye değmez.)

> [!question] Mülakat Sorusu **"Bir type adı namespace'le çakışırsa C#'ta nasıl çözersin?"** Cevap: Tam-nitelikli adla (`Namespace.Path.Type`) veya `using Alias = Namespace.Path.Type;` alias tanımıyla netleştiririm. Derleyiciye "bu bir tip, namespace değil" demiş olurum. En kalıcı çözüm çakışan ismi baştan kaçınarak seçmektir.

---

## 5. FK Güvenliği = IDOR'un Vardiya Hali

`CreateShift` handler'ı request'ten `BranchId`, `PositionId`, `UserId` alır. Bunlar **client'tan** geliyor → kötü niyetli istemci başka tenant'ın ID'sini gönderebilir. Bu yüzden handler her birini doğrular:

```csharp
var branchExists = await _db.Branches.AnyAsync(b => b.Id == request.BranchId, ct);
if (!branchExists) throw new InvalidOperationException("Şube bulunamadı.");
// aynı şekilde Position ve (varsa) User için
```

> [!important] Global filter neden burada da dost? `_db.Branches` zaten global query filter altında → sadece bu tenant'ın şubelerini görür. Yani `AnyAsync(b => b.Id == X)` sorusu otomatik olarak **"X bu tenant'ta var mı?"** anlamına gelir. Başka tenant'ın ID'si gönderilse "bulunamadı" döner. Bu, Gün 1'deki IDOR korumasının (kimlik client'tan değil) vardiya versiyonu.

> [!question] Mülakat Sorusu **"Bir kayıt oluştururken client'tan gelen foreign key ID'lerini neden doğrularsın?"** Cevap: Client'tan gelen ID'ye güvenilmez (IDOR riski) — kullanıcı başka tenant'a/kaynağa ait bir ID gönderebilir. Handler'da bu ID'lerin gerçekten erişilebilir kapsamda (bu tenant'ta) var olduğunu sorgulayarak doğrularım. Multi-tenant'ta global query filter bu sorguyu otomatik tenant'a daraltır, böylece "var mı" = "benim tenant'ımda var mı" olur.

---

## 6. Tarih Aralığı Kesişim Sorgusu (Takvim)

Takvim "şu şube, şu tarih aralığı" ister. Naif "başlangıcı aralıkta olanlar" eksik — aralığa sarkan vardiyaları (gece vardiyası) kaçırır.

> [!tip] Doğru kesişim kuralı İki aralık kesişir ⟺ `shift.Start < range.End && shift.End > range.Start`
> 
> ```csharp
> .Where(s => s.BranchId == request.BranchId
>          && s.StartTime < request.RangeEnd
>          && s.EndTime   > request.RangeStart)
> ```
> 
> "Vardiya, aralık bitmeden başlıyor VE aralık başladıktan sonra bitiyor." Her sarkma durumunu doğru yakalar.

> [!question] Mülakat Sorusu **"İki zaman aralığının kesişip kesişmediğini nasıl sorgularsın?"** Cevap: `A.Start < B.End && A.End > B.Start`. Bu tek koşul tüm örtüşme türlerini (içte, dışta, kısmi, sarkan) doğru yakalar. Sadece "başlangıç aralıkta mı" demek aralığa taşan kayıtları kaçırır.

---

## 7. Projeksiyonla Otomatik Join (Include'suz)

`ListShifts`'te DTO'ya projekte ederken `s.Position.Name`, `s.User.FullName`'e eriştik — ama `Include()` yazmadık.

```csharp
.Select(s => new ShiftDto(
    s.Id, s.BranchId, s.UserId,
    s.User != null ? s.User.FullName : null,  // açık vardiyada null
    s.PositionId, s.Position.Name, s.Position.ColorCode,
    s.StartTime, s.EndTime, (int)s.Status, s.Notes))
```

> [!note] Include vs projeksiyon `Include` ilişkili **tüm entity'yi** belleğe yükler. `Select` projeksiyonu ise EF'in gerekli JOIN'leri otomatik kurmasını ve **sadece seçilen kolonları** çekmesini sağlar. Daha az veri, daha hızlı. DTO döndüren okuma sorgularında projeksiyon tercih edilir; `s.User != null ? ... : null` EF tarafından LEFT JOIN + null kontrolüne çevrilir (açık vardiya için şart).

> [!question] Mülakat Sorusu **"Bir sorguda ilişkili veriyi getirmek için Include yerine ne zaman projeksiyon (Select) kullanırsın?"** Cevap: DTO döndüren okuma sorgularında projeksiyon. Include tüm entity grafiğini yükler; projeksiyon EF'in yalnızca gereken kolonları SQL'de seçmesini ve gerekli JOIN'leri otomatik kurmasını sağlar — daha az bellek/transfer. Entity'yi güncelleyip geri yazacaksam Include/tracking gerekir; sadece göstereceksem projeksiyon yeterli ve verimli.

---

## 8. Açık Vardiya (Open Shift) Tasarımı

`Shift.UserId` nullable: `null` = açık vardiya (henüz kimseye atanmamış, havuza/atamaya hazır).

> [!important] Açık vardiya ≠ Vardiya havuzu
> 
> - **Açık vardiya (bu adım):** Sadece `UserId = null` olan bir vardiya. Yönetici takvimi kurarken "Pazartesi sabah 1 barista lazım" der, kişiyi sonra atar.
> - **Vardiya havuzu (sonraki modül):** Var olan bir vardiyanın el değiştirmesi (sun/kap/takas) — ayrı `ShiftSwap` entity'si. Bu adımda YOK.
> 
> Tek `CreateShift` ikisini de destekler: UserId verilirse atanmış, null ise açık. Maliyeti sıfır çünkü entity zaten nullable.

---

## 9. Doğrulama — Uçtan Uca curl

|Test|Beklenen|Sonuç|
|---|---|---|
|Pozisyon oluştur (Barista, #22C55E, 120.50)|positionId|✅|
|Atanmış vardiya oluştur|shiftId|✅|
|Açık vardiya oluştur (userId: null)|shiftId|✅|
|Takvim listele (13 Haz)|2 vardiya, sıralı|✅|
|→ Atanmışta userFullName + pozisyon adı/rengi dolu (Include'suz join)||✅|
|→ Açıkta userId/userFullName null, pozisyon yine dolu||✅|

> [!tip] zsh tuzağı `curl "...?a=1&b=2"` — URL'yi **tırnak içine** almazsan zsh `&` karakterini "arka planda çalıştır" sanır (`parse error near &`). Query string'li URL'leri her zaman tırnakla.

---

## 10. Sırada Ne Var (Gün 4)

Vardiya çekirdeği ayakta. Faz 1 MVP'de sırada:

1. **Çakışma/ihlal uyarıları** — aynı personel aynı anda iki vardiyada mı? (Modül 1.5) + İş Kanunu limitleri (günlük 11s, haftalık 45s) [TR]
2. **Vardiya yayınlama** — Draft → Published geçişi + (sonra) bildirim
3. **Update/Delete** vardiya — şu an sadece Create + List var
4. **Davet tabanlı kayıt** — personel ekleme (RBAC negatif testini de açar: Staff ile 403)

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Çoğa-çok: explicit join entity (UserBranch) vs implicit — alan eklenebilirlik
- [ ] Para = decimal (ondalık, tam hassasiyet), GPS = double (IEEE) — neden farklı
- [ ] EF decimal: `HasPrecision(10,2)` → numeric(10,2), uyarıyı susturur
- [ ] DeleteBehavior: Cascade (sil) / SetNull (kopar, kaydı tut) / Restrict (silmeyi engelle)
- [ ] Geçmiş kayıt taşıyan tabloda Cascade'den kaçın → SetNull/Restrict + soft delete
- [ ] Namespace–entity çakışması (CS0118) → tam-nitelikli ad veya alias
- [ ] FK güvenliği = IDOR koruması: client ID'sini global filter altında doğrula
- [ ] Tarih kesişimi: Start < rangeEnd && End > rangeStart
- [ ] Projeksiyon (Select) → otomatik join, sadece gereken kolon (Include'dan verimli)
- [ ] Açık vardiya (UserId null) ≠ vardiya havuzu (ShiftSwap, sonra)
- [ ] zsh: query string'li URL'yi tırnakla (& tuzağı)

#shift #dotnet #backend #faz1 #vardiya #shift-entity #cqrs #ef-core #clean-architecture