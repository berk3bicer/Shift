# Shift — Gün 8a: Vardiya Yayınlama (Publish) ve Bildirim Altyapısı

> [!info] Bugünün hedefi Vardiyaları **Draft → Published** state machine ile yayınlamak (tek + toplu) ve yayınlanınca etkilenen personele **kalıcı bildirim** üretmek (inbox). Gerçek-zamanlı push (SignalR/FCM) bilinçli olarak 8b'ye bırakıldı — önce bildirim _kalıcı_ olmalı.

**Tarih:** 13 Haziran 2026 **Stack:** .NET 10, ASP.NET Core, PostgreSQL, EF Core, MediatR, xUnit **Durum:** ✅ %100 tamamlandı — 26/26 test yeşil

---

## 1. Publish — ShiftStatus zaten vardı, hayata geçirdik

`ShiftStatus { Draft=0, Published=1 }` Gün 2'den beri entity'de duruyordu ama hiç kullanılmıyordu — her vardiya Draft doğup öyle kalıyordu. Publish onu çalıştırır.

**Gerçek akış:** yönetici haftayı taslak kurar → gözden geçirir → **yayınlar** → personel görür + bildirim alır.

İki yol:

- **Tek vardiya:** `POST /api/shifts/{id}/publish`
- **Toplu (asıl senaryo):** `POST /api/shifts/publish-week` — bir şubenin tarih aralığındaki TÜM Draft vardiyaları tek seferde.

> [!important] State machine (Time Off'un kardeşi) Sadece `Draft` → `Published`. Zaten Published'ı tekrar publish → `InvalidOperationException` → 400. Time Off'taki "sadece Pending karara açık" mantığının aynısı.

---

## 2. Atomiklik — publish + bildirim aynı transaction

Toplu publish'te iki şey olur: (1) vardiyaların durumu değişir, (2) etkilenen personele bildirim eklenir. İkisi de **tek `SaveChangesAsync`** içinde:

```csharp
foreach (var shift in draftShifts) { shift.Status = ShiftStatus.Published; ... }
foreach (var userId in affectedUserIds) { _db.Notifications.Add(...); }
await _db.SaveChangesAsync(ct);   // hepsi tek transaction
```

> [!important] Neden aynı transaction? EF, tek SaveChanges'i tek DB transaction'da yürütür. Ortada hata olursa **rollback** — "yarısı yayınlanmış, bildirimi gitmiş" gibi tutarsız ara durum oluşmaz. Ya hepsi olur ya hiçbiri (atomiklik).

> [!question] Mülakat Sorusu **"Birden çok kaydı değiştirip yan etki (bildirim) üreten bir işlemde tutarlılığı nasıl sağlarsın?"** Cevap: Tüm değişiklikleri tek SaveChanges/transaction altında toplarım. EF change tracker hepsini biriktirir, tek commit'te yazar; hata olursa tamamı geri alınır. Böylece kısmi/tutarsız durum imkânsız olur.

---

## 3. Distinct personel — spam önleme

Bir barista haftada 5 vardiyaya sahip olabilir. Her vardiya için ayrı bildirim = 5 bildirim = spam. Çözüm:

```csharp
var affectedUserIds = draftShifts
    .Where(s => s.UserId.HasValue)     // açık vardiya (null) hariç
    .Select(s => s.UserId!.Value)
    .Distinct()                         // personel başına TEK
    .ToList();
```

Her personele **tek özet bildirim** ("Haftalık programınız yayınlandı"). 7shifts de böyle yapar.

> [!note] Açık vardiya muafiyeti `UserId == null` (kimseye atanmamış açık vardiya) bildirim üretmez — alıcısı yok.

---

## 4. Notification entity — polimorfik referans

```csharp
public class Notification : BaseEntity, ITenantEntity
{
    public Guid UserId { get; set; }            // alıcı
    public NotificationType Type { get; set; }  // ShiftPublished (ileride genişler)
    public string Message { get; set; }
    public Guid? RelatedEntityId { get; set; }  // işaret ettiği kayıt (opsiyonel)
    public bool IsRead { get; set; }
}
```

> [!tip] RelatedEntityId — neden tek nullable Guid, FK YOK? Bildirim tipleri çoğalacak (vardiya, izin, görev, stok...). Her biri için ayrı FK kolonu açmak tabloyu şişirir. Bunun yerine **tek polimorfik referans**: tipi `Type`'a göre yorumlanır (ShiftPublished → vardiya/şube id'si). FK constraint koymadık çünkü bildirim, işaret ettiği kayıt **silinse bile** anlamlı kalmalı ("şu vardiya yayınlanmıştı" geçmişi).

> [!question] Mülakat Sorusu **"Bir bildirim farklı tiplerde kayıtlara işaret edebiliyor. Veri modelini nasıl kurarsın?"** Cevap: Tek `RelatedEntityId` (nullable) + `Type` enum. Tip, id'nin hangi tabloyu işaret ettiğini belirler (polimorfik). Her tip için ayrı FK kolonu açmam — tablo şişer ve yeni tip eklemek şema değişikliği gerektirir. FK constraint de koymam; bildirim referans ettiği kayıt silinse de durmalı.

---

## 5. İnbox — listeleme + okundu (IDOR koruması)

- `GET /api/notifications` — kendi bildirimlerim (UserId token'dan), en yeni üstte.
- `POST /api/notifications/{id}/read` — okundu işaretle.

> [!important] Okundu işaretlemede IDOR Kullanıcı SADECE kendi bildirimini okundu yapabilmeli. Global filter tenant izolasyonu sağlar ama **aynı tenant içinde** başka personelin bildirimine erişimi ayrıca engelliyoruz:
> 
> ```csharp
> if (notification.UserId != userId.Value)
>     throw new UnauthorizedAccessException("Bu bildirim size ait değil.");
> ```
> 
> İşlem **idempotent**: zaten okunmuşsa tekrar true yazmak zararsız.

---

## 6. ⚠️ Tuzak: macOS + .gitignore `publish/` deseni

Feature klasörünü `Shifts/Publish/` yaptığımızda dosyalar IDE'de **gri** göründü ve `git status` onları hiç göstermedi.

**Sebep:** `.gitignore`'da `dotnet publish` çıktısını yoksaymak için standart `publish/` kuralı var. macOS dosya sistemi **case-insensitive** olduğu için `publish/` deseni bizim `Publish/` klasörümüzü de yakaladı → git feature kodumuzu "publish çıktısı" sanıp yok saydı.

**Tehlike:** build sende çalışır (dosya diskte) ama **push'ta repoya gitmez** — başka makinede klon eksik olur. Sessiz veri kaybı.

**Çözüm:** klasörü `PublishShift/` olarak yeniden adlandırdık (namespace de `...Shifts.PublishShift`). `.gitignore`'daki `publish/` kuralına dokunmadık (o meşru).

```bash
git check-ignore -v <dosya>   # neyin neden ignore edildiğini gösterir
```

> [!question] Mülakat Sorusu **"Bir dosya git'e bir türlü eklenmiyordu, neden olabilir ve nasıl teşhis edersin?"** Cevap: Büyük ihtimal `.gitignore` kuralı yutuyordur. `git check-ignore -v <path>` ile hangi satırın eşleştiğini görürüm. Case-insensitive dosya sistemlerinde (macOS) `publish/` gibi bir desen beklenmedik klasörleri de yakalayabilir.

---

## 7. Yapılanlar (dosya dökümü)

**Yeni entity:** `Notification` (+ `NotificationType` enum) **Yeni feature'lar:** `Shifts/PublishShift`, `Shifts/PublishWeek`, `Notifications/List`, `Notifications/MarkRead` **Yeni controller:** `NotificationsController`; `ShiftsController`'a 2 endpoint **Değişen:** `ShiftDbContext` + `IShiftDbContext` (Notifications DbSet + FK + index + filter) **Migration:** `AddNotifications` (tek FK Cascade, RelatedEntityId FK'sız, index UserId+IsRead) **Test:** `PublishShiftTests` (4) → toplam 26/26

Yeni endpoint'ler: `shifts/{id}/publish`, `shifts/publish-week`, `notifications` (GET), `notifications/{id}/read`

---

## 8. Borç / Sırada (8b)

- [ ] **SignalR** — in-app gerçek-zamanlı bildirim (uygulama açıkken anlık düşsün). Notification kaydı zaten var; SignalR onu canlı iletir.
- [ ] **FCM push** — uygulama kapalıyken telefona bildirim.
- [ ] **Okunmamış sayacı** — `GET /notifications/unread-count` (badge için).
- [ ] **Toplu okundu** — "hepsini okundu işaretle".
- [ ] (Devam) Enum lokalizasyonu (Excuse→Mazeret), gece-aşan vardiya, 11/45 Tenant ayarı.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] ShiftStatus state machine: Draft → Published (terminal)
- [ ] Toplu publish + bildirim = tek SaveChanges = atomik (ya hep ya hiç)
- [ ] Distinct personel → spam önleme (haftalık tek özet bildirim)
- [ ] Açık vardiya (UserId null) → bildirim yok
- [ ] Notification: polimorfik RelatedEntityId, FK YOK (bağımsız geçmiş kaydı)
- [ ] İnbox okundu: IDOR koruması (kendi bildirimin), idempotent
- [ ] .gitignore `publish/` + macOS case-insensitive = sessiz dosya yutma; `git check-ignore -v` ile teşhis

#shift #dotnet #backend #faz1 #publish #notification #state-machine #transaction #gitignore