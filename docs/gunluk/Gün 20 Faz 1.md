# Shift — Gün 20: Fotoğraf Ekleme (Blob Storage Soyutlaması + Presigned URL + Yerel Mock)

> [!info] Bugünün hedefi Frontend öncesi son backend borcu: görev + checklist kanıt **fotoğrafı** (ikisi de MVP). Bu blob storage gerektirdiği için ÖNCE altyapı kararı Berke'ye soruldu, onaylandı: **Cloudflare R2 + presigned URL + IFileStorage soyutlaması + yerel mock** (credential yok → mock ile başla, R2 sonra takılır). Bu, "altyapı kararını onaylatmadan kod yazma" disiplininin örneği.

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core, PostgreSQL, MediatR, xUnit **Durum:** ✅ Gün 20 (1. borç) tamamlandı — 91/91 test yeşil

---

## 1. Önce Karar, Sonra Kod: Altyapı Seçimini Onaylatmak

Berke'nin açık talimatı: fotoğraf işine başlamadan DUR, altyapıyı sor. Üç soru netleşti:
- **Sağlayıcı:** R2 (S3-uyumlu, egress ücretsiz) — soyutlama + yerel mock arkasında.
- **Yükleme yöntemi:** Presigned URL (backend byte proxy'lemez).
- **Credential:** Yok → mock ile başla, R2 sonra.

Neden önemli: depolama sağlayıcı, upload akışı ve credential modeli kodun ŞEKLİNİ belirler (presigned mı proxy mi? abstraction mı doğrudan SDK mı?). Yanlış varsayımla yazıp sonra değiştirmek pahalı. Tek soruluk duraklama, günlerce yeniden-yazmayı önler.

> [!question] Mülakat Sorusu **"Bir özelliğe başlarken hangi kararları kod yazmadan önce netleştirirsin?"** Cevap: Mimariyi/maliyeti geri-dönüşü pahalı şekilde belirleyenleri — burada depolama sağlayıcı, upload akışı, credential modeli. Bunlar API yüzeyini ve katman bağımlılıklarını sabitler. Tahminle ilerleyip sonra değiştirmek hem kodu hem veritabanını/erişim desenini etkiler. Belirleyici kararları önden onaylatmak ucuz; yanlış varsayımı geri almak pahalı.

---

## 2. Port-Adapter: `IFileStorage` Soyutlaması

`IFileStorage` (Application katmanı) — uygulama SAĞLAYICIYI bilmez:

```csharp
Task<FileUploadTarget> CreateUploadUrlAsync(string key, string contentType, ...);  // presigned PUT
Task<string> CreateDownloadUrlAsync(string key, ...);                              // presigned GET
```

İki implementasyon, aynı arayüz:
- **`LocalFileStorage`** (mock, bugün) — dev'de çalışır.
- **`R2FileStorage`** (credential gelince) — aynı `IFileStorage`, DI'da swap.

Bu, `IShiftDbContext`/`ITenantProvider` ile aynı port-adapter kalıbı: iş mantığı arayüze bağlı, somut altyapı dışarıda, test'te sahte. Handler'lar `R2` veya `Local` kelimesini hiç görmez.

> [!important] Soyutlama, kararı ERTELENEBİLİR kılar Credential olmadan da tüm fotoğraf akışını (entity, handler, controller, test) yazabildik çünkü `IFileStorage` arkasındayız. R2 gelince tek satır DI değişir, iş mantığı + testler aynen kalır. "Henüz bilmediğim/sahip olmadığım bir bağımlılık" için doğru hamle: arayüz tanımla, mock'la ilerle, gerçeği sonra tak.

> [!question] Mülakat Sorusu **"Henüz erişimin olmayan bir dış servise (cloud storage) bağlı bir özelliği nasıl geliştirirsin?"** Cevap: Servisi bir arayüzün (port) arkasına alır, dev için çalışan bir sahte/yerel adapter yazarım. Tüm iş mantığını + testleri arayüze karşı geliştiririm; gerçek servis hazır olunca yalnız adapter'ı DI'da takarım. Böylece credential beklemek geliştirmeyi bloklamaz.

---

## 3. Presigned Akış: Backend Byte Proxy'lemez

Presigned kalıbı (3 adım):
1. **upload-url al** — backend object key üretir + presigned PUT URL döner (DB'ye YAZMAZ, stateless).
2. **client doğrudan storage'a PUT** — byte'lar backend'e hiç uğramaz.
3. **confirm** — client key'i geri gönderir, backend `Attachment` kaydını oluşturur.

Görüntüleme: backend presigned GET URL üretir, client doğrudan storage'dan çeker.

Backend büyük resim byte'larını taşımaz → hafif, ölçeklenebilir. Backend'in işi: yetki + key üretimi + metadata. Byte trafiği client↔storage arası.

**Yerel mock bunu nasıl taklit eder:** presigned URL'ler backend'in KENDİ `/api/files/local` ucuna işaret eder (HMAC imza + süre taşır). Mock uç PUT'u alıp yerel klasöre yazar, GET'te okur. Yani aynı 3-adım akış lokalde uçtan uca çalışır — frontend R2'ymiş gibi geliştirir.

> [!question] Mülakat Sorusu **"Dosya yüklemede presigned URL ile backend-proxy arasında nasıl seçim yaparsın?"** Cevap: Büyük/çok dosyada presigned — backend byte taşımaz, bant genişliği ve bellek yükü storage'a gider, ölçeklenir. Backend yalnız yetki + key + metadata yapar. Backend-proxy daha basittir ama her byte sunucudan geçer (yük, timeout, maliyet). Resim/video gibi içerikte presigned standarttır.

---

## 4. Generic Attachment: Polimorfik Sahip (İki Tabloya Kolon Eklemeden)

Fotoğraf hem göreve hem checklist madde işaretine bağlanmalı. İki seçenek:
- TaskItem + ChecklistRunItem'a ayrı `PhotoKey` kolonu (iki şema değişikliği, tek foto).
- Tek **generic `Attachment`** tablosu: `OwnerType` (enum) + `OwnerId` (Guid) → polimorfik sahip, çok foto.

**Generic seçildi.** Tek tablo iki (ileride N) varlık türüne hizmet eder, çoklu foto destekler, sahip tablolarına dokunmaz. Sahibe FK YOK (polimorfik tek FK ile ifade edilemez — `Notification.RelatedEntityId` deseni); sahip doğrulama uygulama tarafında (tür → doğru tabloya bak).

Güvenlik: object key sahip prefiksi taşır (`task/<id>/...`); `Confirm` key'in gerçekten o sahibe ait prefiksi taşıdığını doğrular → client başka kaydın/uydurma key'i bağlayamaz.

> [!question] Mülakat Sorusu **"Aynı tür eki (foto/dosya) birden çok varlık tipine bağlamak gerekince nasıl modellersin?"** Cevap: Polimorfik sahip (OwnerType + OwnerId) ile tek generic tablo — her varlık tipine kolon eklemekten ve N benzer tablodan kurtarır. Bedeli: gerçek FK yok, referans bütünlüğü/temizlik uygulama sorumluluğunda. Tip sayısı az/sabit ve FK şart ise ayrı tablolar; çoğalan/dinamik tiplerde generic tablo tercih edilir.

---

## 5. Durum (Gün 20 — 1. borç)

**Yeni dosyalar:**
- `Application/Common/Interfaces/IFileStorage.cs` — port (presigned upload/download)
- `Domain/Entities/Attachment.cs` — generic ek (OwnerType/OwnerId) + enum
- `Infrastructure/Storage/LocalFileStorage.cs` — mock adapter (HMAC imzalı yerel presigned)
- `Infrastructure/Storage/FileStorageOptions.cs` — ayarlar
- `Application/Features/Attachments/{UploadUrl,Confirm,List}/` + `AttachmentOwner.cs`
- `API/Controllers/AttachmentsController.cs` — akış (upload-url/confirm/list)
- `API/Controllers/FilesController.cs` — yerel mock PUT/GET ucu
- `tests/Shift.Tests/AttachmentTests.cs` (+ `FakeFileStorage.cs`) — 6 test

**Değişen:**
- `IShiftDbContext` + `ShiftDbContext` — `Attachments` DbSet + config (SetNull, (OwnerType,OwnerId) index)
- `Infrastructure/DependencyInjection.cs` — FileStorageOptions bind + IFileStorage→LocalFileStorage
- `API/appsettings.json` — FileStorage bölümü; `.gitignore` — App_Data/

**Migration:** `AddAttachments` (Attachments tablosu). DB'ye uygulandı.

**Test: 91/91 yeşil** (85 + 6: upload-url key prefiks/owner doğrulama, confirm token+key eşleşmesi, list indirme URL, checklist run item sahip).

> [!note] Test kapsamı sınırı Handler'lar (owner doğrulama, key, confirm, list) FakeFileStorage ile test edildi. `LocalFileStorage`'ın gerçek dosya IO'su + `FilesController` PUT/GET (HMAC imza) unit-test edilmedi — bunlar HTTP/dosya sistemi entegrasyonu; demo'da uçtan uca denenecek.

---

## 6. Backend Borçları Bitti → Sırada Frontend

> [!success] İki backend borcu da kapandı Gün 19: checklist şablon Update/Delete. Gün 20: fotoğraf ekleme. Berke'nin "bu ikisi bitince DUR, frontend'e geçeceğiz" planına göre backend MVP burada duruyor.

**R2'ye geçiş (credential gelince):** `R2FileStorage : IFileStorage` yaz (AWSSDK.S3 + R2 endpoint), `appsettings` FileStorage:Provider="R2" + R2 anahtarları, DI'da swap. İş mantığı + testler değişmez.

**Demo sonrasına bırakılanlar (değişmedi):** Excel export, tatil takvimi+çarpan, tekrarlayan görev, vardiya-kapatma guard'ı, çoklu-foto UI cilası.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Mimariyi belirleyen kararları (storage/akış/credential) kod öncesi onaylat
- [ ] IFileStorage = port; LocalFileStorage (mock) / R2FileStorage (sonra) = adapter
- [ ] Soyutlama, sahip olmadığın bağımlılığı (credential) ertelenebilir kılar
- [ ] Presigned: backend byte proxy'lemez; URL üret, client↔storage doğrudan
- [ ] Yerel mock presigned'ı backend'in kendi ucuna HMAC imzalı URL ile taklit eder
- [ ] Generic Attachment: polimorfik sahip (OwnerType+OwnerId), iki tabloya kolon yok
- [ ] Polimorfik sahipte FK yok → key prefiks doğrulamasıyla yanlış-owner bağlama engellenir
- [ ] "Kim yükledi" token'dan; sahip kaydı tenant'ta var mı diye doğrula

#shift #dotnet #backend #faz1 #blob-storage #presigned-url #port-adapter #attachment #ef-core #clean-architecture
