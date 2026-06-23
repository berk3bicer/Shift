# Shift — Gün 5: Vardiya Update/Delete + Kural Servisi Refactor

> [!info] Bugünün hedefi İki iş: (1) Gün 4'te inline yazılan 4 kuralı **`ShiftRuleChecker`** servisine çıkarmak (refactor), (2) bu temiz servise dayanarak **Update + Delete** eklemek. Sonunda 12/12 test yeşil.

**Tarih:** Gün 5 (tematik oturum) **Stack:** .NET 10, EF Core, MediatR, FluentValidation, xUnit **Durum:** ✅ Tamamlandı — refactor + Update/Delete + 3 yeni test (toplam 12/12)

---

## 1. Refactor Disiplini: Davranış Değişmez, Yer Değişir

Refactor'un tanımı: **dış davranışı koruyarak iç yapıyı iyileştirmek.** Bunun kanıtı testlerdir — kuralları taşıdık, _tek bir test bile değişmeden_ 9/9 yeşil kaldı. Test değişmeden geçiyorsa, davranışı korumuşuz demektir.

> [!important] Refactor + yeni özellik AYNI ANDA yapılmaz Önce kuralları çıkardık, testlerin geçtiğini gördük (saf refactor). _Sonra_ Update/Delete'i yazdık. İkisini karıştırsaydık, test kırılınca "kural mı bozuldu, taşıma mı bozuldu?" ayıramazdık. Her commit tek bir niyet taşımalı.

> [!question] Mülakat Sorusu **"Bir refactor'un davranışı bozmadığından nasıl emin olursun?"** Cevap: Önce mevcut davranışı kapsayan testler olmalı. Refactor'u yaparım, testleri değiştirmeden çalıştırırım. Hepsi yeşil kalıyorsa davranış korunmuştur. Test yoksa, önce karakterizasyon testi yazar sonra refactor ederim — "test değişmeden geçer" güvencesi olmadan refactor körlemedir.

---

## 2. Kural Mantığı Nereye Çıkar? — 3 Seçenek, 1 Doğru

|Seçenek|Neden / Neden değil|
|---|---|
|**Domain/Application Service** ✅|Enjekte edilebilir → test edilebilir, mock'lanabilir. Projedeki DI desenine uyumlu. Tek sorumluluk.|
|Static helper ❌|DbContext'i parametre geçmek zorunda → test izole edilemez, mock yok. DI desenine aykırı.|
|Base class (inheritance) ❌|"is-a" değil "has-a" ilişkisi var. Composition > inheritance. Tek-kalıtım zincirini tüketir.|

> [!tip] Composition over inheritance Handler kural kontrolüne **sahip** (has-a), kural kontrolü **değil** (is-a). Bu yüzden enjeksiyon (composition) doğru; base class (inheritance) yanlış. Inheritance sıkı bağ kurar, esnekliği öldürür; composition gevşek bağ + test kolaylığı verir.

> [!note] "Domain service" mi "application service" mi? Saf Clean Architecture'da DB'ye erişen bir servis _application_ service'tir (saf domain mantığı değil). Pratikte ayrım önemli değil — enjekte edilen, DB'ye erişen, iş kuralı yürüten bir servis. `Application/Common/Services/` altına koyduk.

> [!question] Mülakat Sorusu **"İş kuralı mantığını handler'dan ne zaman ayrı bir servise çıkarırsın?"** Cevap: İkinci kullanım ortaya çıkınca (DRY ihlali başlayınca). Tek handler kullanıyorsa erken soyutlama YAGNI ihlali olur. Burada Update handler'ı da aynı kuralları isteyince çıkardım — tam zamanında, ne erken ne geç.

---

## 3. DI Yaşam Döngüsü: Neden Scoped?

```csharp
services.AddScoped<IShiftRuleChecker, ShiftRuleChecker>();
```

Servis içinde `IShiftDbContext` var, o da **Scoped** (her HTTP isteğinde bir örnek). Bir servis, bağımlılığından **uzun yaşayamaz.**

> [!warning] Captive Dependency (esir bağımlılık) `Singleton` yapsaydık: tek kalıcı servis örneği, Scoped bir DbContext'i tutmaya çalışır → DbContext request bitince ölmeli ama Singleton onu tutar → ya başlangıçta patlar ya sessizce bozuk davranır. Kural: **bir servisin ömrü, en kısa ömürlü bağımlılığından uzun olmamalı.** DbContext Scoped → checker da Scoped.

> [!question] Mülakat Sorusu **"Singleton bir servise Scoped bir bağımlılık enjekte edersen ne olur?"** Cevap: Captive dependency. Singleton bir kez yaratılır ve uygulama boyunca yaşar; içine aldığı Scoped bağımlılık (ör. DbContext) ise her istekte yenilenmeli. Singleton onu "esir alır", ilk örneği sonsuza dek tutar → DbContext thread-safe değildir, bozuk/eski veri, eşzamanlılık hataları. .NET'in DI container'ı geliştirme modunda bunu yakalayıp hata fırlatır. Çözüm: Singleton'ı Scoped yap ya da bağımlılığı IServiceScopeFactory ile manuel çöz.

---

## 4. `excludeShiftId` — Refactor'un Asıl Kazancı

Servis imzası dört çıplak değer + bir dışlama Id'si alır:

```csharp
Task<IReadOnlyList<string>> CheckAsync(
    Guid? userId, DateTime startTime, DateTime endTime,
    Guid? excludeShiftId, CancellationToken ct);
```

**Neden `excludeShiftId`?** Create'te dışlanacak vardiya yok (henüz DB'de değil) → `null`. Ama **Update**'te vardiya zaten DB'de; yeni saatleriyle kontrol edince _kendi eski kaydı_ çakışma/toplam hesabına karışır → vardiya kendiyle çakışır. Çözüm: her sorguya `(excludeShiftId == null || s.Id != excludeShiftId)` koşulu.

```csharp
// Create:  excludeShiftId: null    → hiçbir şeyi dışlama (eski davranış birebir)
// Update:  excludeShiftId: shift.Id → kendini hesaptan çıkar
```

> [!tip] null = "dışlama yok" deseni `excludeShiftId == null || s.Id != excludeShiftId` ifadesi: null ise koşul hep `true` (hiçbir şey dışlanmaz), doluysa o Id'yi eler. Tek imza iki senaryoyu (Create/Update) temiz karşılar.

---

## 5. Update Handler — read-modify-save

```csharp
var shift = await _db.Shifts.FirstOrDefaultAsync(s => s.Id == request.Id, ct); // global filter
if (shift == null) throw ...;
// FK güvenliği (pozisyon/personel bu tenant'ta mı?)
var warnings = await _ruleChecker.CheckAsync(
    request.UserId, request.StartTime, request.EndTime, excludeShiftId: shift.Id, ct);
shift.PositionId = request.PositionId;  // EF change tracking → SaveChanges UPDATE üretir
shift.StartTime  = request.StartTime;
// ...
await _db.SaveChangesAsync(ct);
```

> [!note] EF Change Tracking Entity'yi çekip alanlarını değiştirip `SaveChanges` çağırınca, EF değişen alanları izleyip otomatik `UPDATE` SQL'i üretir. Manuel UPDATE yazmayız. `BranchId` değiştirilmedi — vardiyanın şubesi sabit kabul edildi.

> [!important] BranchId neden Update'te yok? Bir vardiyanın şubesi sabit — "bu şubenin vardiyası" başka şubeye taşınmaz. Gerekirse sil + yeniden oluştur. Bu, command'i de sadeleştirir.

---

## 6. Controller: URL Id Otoritesi (IDOR koruması)

```csharp
[HttpPut("{id}")]
public async Task<IActionResult> Update(Guid id, [FromBody] UpdateShiftCommand command)
{
    var result = await _mediator.Send(command with { Id = id }); // URL kazanır
    return Ok(result);
}
```

> [!warning] `command with { Id = id }` neden kritik? Kullanıcı URL'de `/shifts/A` derken body'de gizlice `"Id":"B"` gönderebilir → "A'yı güncelliyorum" görünüp B'yi değiştirir. `with` ile body'nin Id'sini URL'deki ile **eziyoruz** → URL daima otorite. Record'ların immutable kopyalama özelliği (`with`) burada güvenlik aracı oluyor.

> [!question] Mülakat Sorusu **"PUT /resources/{id} endpoint'inde, body'de de bir id varsa hangisine güvenirsin?"** Cevap: URL'deki id otoritedir. Body'deki id'yi yok sayar ya da URL'dekiyle ezerim. Aksi halde kullanıcı bir kaynağı güncelliyormuş gibi görünüp başkasını değiştirebilir (IDOR / parameter tampering). URL routing zaten yetki kontrolüne tabidir; body keyfi veridir.

---

## 7. Delete — Hard Delete (şimdilik)

```csharp
var shift = await _db.Shifts.FirstOrDefaultAsync(s => s.Id == request.Id, ct);
if (shift == null) throw ...;
_db.Shifts.Remove(shift);
await _db.SaveChangesAsync(ct);
return Unit.Value;  // MediatR'da "dönüş yok" → controller 204 NoContent
```

> [!note] Soft-delete vs Hard-delete Branch/Position'da `IsActive` (soft-delete) vardı; Shift'te yok → gerçek silme. Vardiya için makul: geçmiş bir vardiyayı "pasif" tutmaktansa silmek yaygın. İleride audit/geçmiş gerekirse soft-delete'e çevrilir. `Unit.Value` = MediatR'ın "void" karşılığı; controller `NoContent()` (204) döner.

---

## 8. Test — Update'in Kritik Davranışları

|#|Test|Beklenen|
|---|---|---|
|1|Kendi saatine yakın güncelleme|`warnings` boş (kendini dışlar)|
|2|Başka vardiyayla çakışacak güncelleme|`InvalidOperationException`|
|3|Olmayan vardiya güncelleme|`InvalidOperationException`|

> [!tip] Refactor'dan sonra test değişimi Handler ctor'a 2. parametre (`IShiftRuleChecker`) eklenince eski testler kırıldı → `new CreateShiftHandler(db, new ShiftRuleChecker(db))`. `sed` ile 7 çağrı tek hamlede güncellendi. Test, gerçek servisi (mock değil) kullanıyor — InMemory DB ile uçtan uca davranışı doğruluyor.

> [!success] 12/12 yeşil 9 eski (Create kuralları + izolasyon) + 3 yeni (Update). Curl ile de doğrulandı: Create→Update→Delete→204, ve "kendini dışlama" 200/boş uyarı.

---

## 9. curl Doğrulaması — Yaşanan Tuzaklar

> [!warning] List DTO'su Create DTO'sundan farklı alan adı kullanabilir `POST /branches` → `{"branchId":"..."}` ama `GET /branches` → `[{"id":"...",...}]`. Aynı kaynak, farklı response şekli. curl'de doğru alanı (`id` vs `branchId`) bilmek gerek. `sed 's/.*"id":"//'` açgözlü `.*` yüzünden _son_ eşleşmeyi alır (liste varsa son eleman) — tek değer çekerken dikkat.

> [!warning] (Tekrar) `dotnet build` ≠ API restart Kod değişince çalışan API'yi durdur+başlat. Gün 4'ten beri sabit ders.

---

## 10. Sırada Ne Var (Gün 6)

Faz 1 devam adayları:

1. **Vardiya yayınlama (Publish):** Draft → Published durum geçişi + personele bildirim (ilk bildirim altyapısı)
2. **Müsaitlik (Availability):** tekrar eden müsaitlik profili; vardiya çakışmasını besler
3. **İzin (Time Off):** tek seferlik izin talebi + onay akışı

> [!note] Olası refactor borcu `ShiftRuleChecker` artık tek noktada. İleride "işletme bazlı limit ayarı" (45 yerine farklı eşik) gelince, sabit `11`/`45` değerleri Tenant ayarından okunacak şekilde parametrize edilir. Şimdilik sabit (YAGNI).

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Refactor = davranış sabit, yapı değişir; kanıt = test değişmeden geçer
- [ ] Refactor + yeni özellik ayrı commit'ler
- [ ] Kural mantığı → enjekte edilebilir servis (static/inheritance değil)
- [ ] Composition over inheritance (has-a, is-a değil)
- [ ] DI ömrü: servis, bağımlılığından uzun yaşamaz → DbContext Scoped → checker Scoped
- [ ] Captive dependency: Singleton'a Scoped enjekte etme
- [ ] `excludeShiftId` null deseni: Create dışlamaz, Update kendini dışlar
- [ ] EF change tracking: entity'yi değiştir + SaveChanges → otomatik UPDATE
- [ ] PUT'ta `command with { Id = id }` → URL otorite (IDOR/tampering koruması)
- [ ] Unit.Value = MediatR void → controller 204 NoContent
- [ ] Hard vs soft delete: Shift hard, Branch/Position soft

#shift #dotnet #backend #faz1 #vardiya #refactor #domain-service #dependency-injection #idor #xunit