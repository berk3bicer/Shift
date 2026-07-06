# Gün 41 — Tur 11: İzin (TimeOff) Bildirimleri + Screenshot Borcu Kapatma

**Kapsam:** Bildirim denetiminin (Gün 40 / Tur 10) bulduğu **tek gerçek MVP boşluğu** kapatıldı:
izin akışının hiç bildirimi yoktu. İki handler'a in-transaction `Notification` üretimi + 4 birim
test + canlı iki-yön doğrulama. Ayrıca Playwright kurulup birikmiş screenshot borcu (tur10 +
tur9fix2 + yeni izin akışı) 11 PNG ile kapatıldı. Branch: `feat/izin-bildirimleri` (tur10
branch'i üstüne yığıldı — iki tur farklı dosyalara dokundu, çakışma yok) → PR → main.
`web/` + `marketing/` **sıfır dokunuş** (zero-touch, `git diff` temiz).

> **Danışman notu:** İzin bildirimi mimari olarak çözülmüş bir problemin tekrarıydı — hedef-kitle
> mantığı `ClockInHandler.NotifyManagersAsync`'te, atomik-bildirim deseni
> `CreateTask`/`CreateAnnouncement`'te hazırdı. Sıfırdan tasarım yok: kopyala-uyarla, düşük risk.
> Bu boşluk kapandığına göre spec §5.2'nin tüm MVP bildirim satırları artık gerçek.

---

## 1. Sorun: İzin akışının hiç bildirimi yoktu (spec §5.2 MVP)

Gün 40 denetimi grep'le doğrulamıştı: `CreateTimeOffHandler` ve `DecideTimeOffHandler`,
bildirim üreten handler listesinde **yoktu** (0 referans). Oysa spec §5.2:
- **İzin talebi oluşturuldu → yönetici** (kanal: Push + E-posta) — MVP
- **İzin onaylandı/reddedildi → talep eden personel** (kanal: Push + E-posta) — MVP

Bu turda **yalnız in-app Notification** (mevcut zil/inbox) üretildi. Push/e-posta kanalı ayrı iş
(FCM/SMTP henüz kurulmadı) — kod yorumlarına spec kanal etiketi not düşüldü ama kanal kurulmadı.

**Kavram — "bildirim = handler yan etkisi, aynı transaction":** Sistemde ayrı notification
servisi yok; her komut handler'ı esas işini yaptığı **aynı `SaveChangesAsync`** içinde ilgili
`Notification` satırlarını ekliyor → olay ile bildirim **atomik**. İzin akışı da bu desene
uyduruldu: talep/karar kaydı ile bildirim ya birlikte yazılır ya hiç.

---

## 2. 1a — `CreateTimeOffHandler` → yöneticilere bildirim

Talep eklendikten sonra, `SaveChangesAsync`'ten ÖNCE `NotifyManagersAsync` çağrılıyor. Hedef
kitle **birebir `ClockInHandler.NotifyManagersAsync`** mantığı, tek uyarlamayla:

- **ClockIn** tek `branchId` alır (giriş yapılan şube). **İzin** talep edenin şubesini komuttan
  almaz (komutta yok) → `UserBranches`'ten talep edenin **tüm şubelerini** çözer. Personel çok
  şubeliyse **her şubenin** Manager'ı hedeftir.
- Hedef = (a) o şubelerdeki `RoleType.Manager` + (b) tüm `RoleType.Owner` (Owner `UserBranch`'te
  yok, kapsamı tüm tenant) → `Union` → **talep edenin kendisi hariç** (kişi hem talep eden hem
  owner/manager olabilir).
- `NotificationType.TimeOffRequested`, `Message = "Bir personel izin talebi oluşturdu."`,
  `RelatedEntityId = timeOff.Id` (tıkla → talebe git). Talep + bildirimler **tek SaveChanges**.

> [!question] Mülakat Sorusu — **"Aynı hedef-kitle mantığı iki handler'da lazım; kopyalar mısın,
> ortak servise mi çıkarırsın?"**
> Cevap: Duruma göre. Burada iki kullanım (ClockIn geç-giriş + TimeOff talep) hedef kitlede aynı
> (branch manager + owner) ama **kapsam kaynağı farklı** (biri tek verili şube, diğeri kişinin
> tüm şubeleri) ve mesaj/tip farklı. Erken soyutlama (`INotifyManagers` servisi) bu farkları
> parametreye boğardı; iki kez ~15 satır kopya, üçüncü kullanımda ortak `RecipientResolver`'a
> çıkarmak (rule of three) daha ucuz. Şimdilik desen tekrarı bilinçli tercih.

---

## 3. 1b — `DecideTimeOffHandler` → talep eden personele bildirim

State machine geçişinden (Pending → Approved/Rejected) sonra, `SaveChangesAsync`'ten ÖNCE tek
bildirim → `timeOff.UserId` (talep eden, zaten elde; yönetici değil).

- Onayda `TimeOffApproved` + "İzin talebin onaylandı.", redde `TimeOffRejected` + "İzin talebin
  reddedildi." Karar notu (`DecisionNote`) varsa mesaja ekleniyor: `" Not: {not}"`.
- `RelatedEntityId = timeOff.Id`. Geçiş + bildirim **tek SaveChanges** → atomik.

---

## 4. 1c/1d — Enum + migration

`NotificationType`'a **sona** üç değer eklendi: `TimeOffRequested=10`, `TimeOffApproved=11`,
`TimeOffRejected=12`. Mevcut değerlerin (0–9) int karşılığı **korundu** — eski kayıtlar bozulmaz.

**Migration gerekmedi.** Enum int olarak saklanıyor; değer eklemek şemayı değiştirmez.
Kılavuz gereği teyit edildi:
```
dotnet ef migrations has-pending-model-changes … → "No changes have been made to the model"
```

> [!question] Mülakat Sorusu — **"Bir enum'a değer eklemek neden migration gerektirmez ama
> ortadan değer çıkarmak/yeniden sıralamak tehlikelidir?"**
> Cevap: Enum int olarak saklandığında DB kolonu `integer`'dır — şema enum'un C# tanımını bilmez,
> sadece sayıyı tutar. Sona değer eklemek yeni bir int'i "meşru" kılar, mevcut satırları etkilemez.
> Ama var olan değeri silmek/yeniden numaralamak, DB'deki kayıtlı sayıların **anlamını** kaydırır
> (5=Approved iken 5=Rejected'a döner) — veri sessizce yanlış yorumlanır. Kural: **sona ekle,
> asla yeniden numaralama.**

---

## 5. 1e — Testler + canlı iki-yön doğrulama

**Birim testler (`tests/Shift.Tests/TimeOffNotificationTests.cs`, 4 test — hepsi yeşil):**
- Create: şube Manager'ı + Owner bildirilir, **başka şube Manager'ı ve talep eden hariç**
  (recipient sayısı ve `RelatedEntityId` assert).
- Create: talep eden aynı zamanda Owner ise **kendine gitmez** (self-exclusion).
- Decide/Approve: talep edene `TimeOffApproved` + not mesaja eklendi.
- Decide/Reject: talep edene `TimeOffRejected`.
- (Assertion deseni `AnnouncementTests`'ten alındı; kurulum `DecideTimeOffTests`'ten.)

**Canlı iki-yön (backend yeni kodla yeniden başlatıldı, gerçek DB + barista):**
| Yön | Akış | Sonuç |
|-----|------|-------|
| 1 | Barista talep açar → **Owner zilinde** "Bir personel izin talebi oluşturdu." | ✅ PASS |
| 2 | Owner **onaylar** → **Barista zilinde** "İzin talebin onaylandı. Not: …" | ✅ PASS |
| 2b | Owner **reddeder** → **Barista zilinde** "İzin talebin reddedildi. Not: …" | ✅ PASS |

Ekran görüntüsüyle de doğrulandı (§6): Owner panosunda zil "9 yeni" — iki izin talebi + geç giriş;
barista zilinde "6 yeni" — izin onay + izin red (notlarıyla).

---

## 6. İş 2 — Screenshot borcu kapatıldı (Playwright)

Ortamda Playwright yoktu → **kuruldu** (`npx playwright install chromium`, geçici script,
repoya commit edilmedi — sadece PNG'ler). **Viewport tuzağına** (headless fullPage 16384px
stitch duplikasyonu, Gün 39 dersi) karşı: gerçek viewport (mobil 390×844 dsf2, masaüstü 1440×900)
+ **fullPage YOK**, yalnız görünen alan. 11 PNG → `docs/gunluk/img/`:

- **tur10-bildirim-*** (5): barista login, barista /today, barista zil AÇIK ("4 yeni"), owner
  dashboard, owner zil AÇIK (görev tamamlandı + geç giriş + izin talebi).
- **tur11-izin-*** (4): barista talep modalı, barista karar zili (onay+red notlarıyla), owner
  izin yönetim sayfası, owner zil (izin talepleri).
- **tur9fix2-*** (2): çizelge saat-dilimi grupları (SABAH/GÜNDÜZ + kişi rozeti), izin
  self-request sayfası.

---

## 7. Bulunan FE gap (bu tur DÜZELTİLMEDİ — zero-touch, `web/` kapsam dışı)

Screenshot'larda görüldü: yeni bildirim tipleri (10/11/12) frontend'in tip→başlık
eşleşmesinde **yok** → zilde jenerik **"Bildirim"** başlığıyla çıkıyorlar (mesaj gövdesi doğru:
"Bir personel izin talebi oluşturdu." / "İzin talebin onaylandı."). Backend %100 doğru; FE
kozmetik. Sonraki FE turunda `web/` bildirim başlık haritasına `TimeOffRequested`→"İzin Talebi",
`TimeOffApproved`→"İzin Onaylandı", `TimeOffRejected`→"İzin Reddedildi" eklenmeli. Bu tur
brief'i `web/`'e dokunmayı yasakladığı için **kasıtlı bırakıldı**.

---

## 8. Doğrulama & envanter

- Birim test: 4 yeni + regresyon (Announcement/DecideTimeOff) → **11/11 yeşil**. Build 0 hata.
- Canlı: 3 yön PASS (JSON + ekran görüntüsü). Migration gerekmedi (teyitli).
- Zero-touch: `git diff` yalnız `src/` (3 dosya) + `tests/` (1 dosya) + `docs/gunluk/`.
- **Üretilen test verisi (id-id, toplu silme YOK):** 2 izin talebi (biri Approved, biri
  Rejected) + karşılık bildirimler. Barista/owner deneyimini canlı gösterebilmek için bırakıldı;
  istenirse id-id temizlenir. Berke'nin 3 gerçek müsaitlik kısıtına / verisine dokunulmadı.
- **Kalan karar (Gün 40'tan):** (a) pozisyona görevde toplu bildirim, (b) duyuru göndereni kendi
  zilinde görsün mü. İzin bildirimi (a maddesi Gün 40) bu turda **kapatıldı**.
