# Gün 42 — Bildirim Sistemi Tamamlama: FE Başlıkları + Pozisyon Fan-out + Gönderen Dahil

**Kapsam:** Bildirim sisteminin MVP kapsamındaki son üç açığı tek turda kapatıldı:
(1) FE başlık haritasındaki 8 eksik tip, (2) pozisyona görev atamada toplu bildirim,
(3) duyuru gönderenin kendi zilinde kendini görmesi. İş 1 yalnız `web/`, iş 2+3 yalnız
`src/` + `tests/` — her iş kendi commit'inde, alan karışımı yok. Branch:
`feat/bildirim-tamamlama` → PR → main. Bu tur bittiğinde **spec §5.2 MVP bildirim kapsamı
%100**; geriye yalnız kanal altyapısı (push/e-posta/SMS — Faz 2+) kalıyor.

> **Danışman notu:** Üç iş de düşük-orta risk, sıfır yeni mimari. Tek tuzak İş 3'teydi: davranış
> değişikliği tek satır silmek ama iki assert'i kırıyor — testler davranışla BİRLİKTE güncellendi,
> yoksa suite kırmızıya dönerdi. "Testi güncelle" ile "testi sil" arasındaki fark: eski test yeni
> davranışı doğru anlatacak şekilde evrildi, güvence kaybolmadı.

---

## 1. İş 1 — FE başlık haritası: 8 eksik bildirim tipi (`web/` only)

**Sorun:** Backend 13 tip (0-12) üretiyor; `NotificationBell.tsx`'teki `NOTIFICATION_META`
haritası yalnız 0-4'ü tanıyordu. Shift Pool (5-9, Gün 30) ve TimeOff (10-12, Gün 41) tipleri
zile **jenerik "Bildirim" başlığıyla** düşüyordu — backend doğru üretiyor, FE etiketleyemiyordu.

**Çözüm:** Haritaya 5-12 eklendi; havuz tipleri → `/schedule`, izin tipleri → `/timeoff`
(iki route da gerçek — route grubu `(app)` URL'yi etkilemez). Mevcut 0-4 aynen kaldı;
enum yorum satırı 0-12 tam listeyle güncellendi.

**Kavram — "backend enum + FE haritası = örtük sözleşme":** `NotificationType` int olarak
DTO'da taşınıyor; FE `Record<number, meta>` ile etiketliyor. Backend'e tip eklemek FE'yi
KIRMAZ (fallback `?? "Bildirim"` var) ama sessizce YOKSULLAŞTIRIR — kullanıcı jenerik başlık
görür, kimse hata görmez. Gün 41'de tam bu oldu: backend işi bitti sanıldı, FE borcu açık
kaldı ve ancak canlı denetimde fark edildi.

> [!question] Mülakat Sorusu — **"Backend enum'ı ile FE haritası nasıl senkron tutulur; tip
> güvenliği olmayan bu int sözleşmesinin riski ne?"**
> Cevap: Kalıcı çözüm kod üretimi (OpenAPI/NSwag ile enum'ı TS'e üretmek) veya paylaşılan şema.
> Bu ölçekte o altyapı maliyetli; pragmatik ara adım (a) FE'de fallback ile ASLA kırılmamak,
> (b) enum yorumunu iki uçta tam liste tutmak, (c) canlı denetim turlarında jenerik başlık
> görünümünü "boşluk sinyali" saymak. Risk kabulü bilinçli: tip eklenirse en kötü durumda
> jenerik başlık, asla crash.

---

## 2. İş 2 — Pozisyona görev atamada toplu bildirim (`src/` + 4 test)

**Karar (Berke):** Pozisyona ("tüm baristalar") görev atanınca o kişilerin HEPSİNE bildirim
gitsin. Gün 8'de kişiye-atama bildirimi yapılmış, pozisyona-atama bilerek atlanmıştı
("pozisyon = çok kişi; toplu bildirim ayrı bir iş" yorumu koddaydı) — o ayrı iş bu tur.

**Çözüm (`CreateTaskHandler`):** Mevcut kişiye-atama dalının yanına `else if
(AssignedPositionId)` dalı eklendi:

- Hedef kitle: `UserBranches` (görevin şubesine atanmış) ⋈ `Users` (`PositionId == posId`)
  → `Distinct`. Desen `ClockInHandler.NotifyManagersAsync`'ten uyarlandı.
- **Oluşturan hariç** (`u.Id != task.CreatedByUserId`) — kendi attığın görevi kendine
  bildirmeme kuralı kişiye-atamayla tutarlı.
- Mesaj ayrıştırıldı: `"Pozisyonuna bir görev atandı."` (kişiye-atamada "Sana bir görev
  atandı.") — kullanıcı zilde neden aldığını anlar.
- `RelatedEntityId = task.Id`; görev + N bildirim **tek `SaveChangesAsync`** → atomik.
- **`else if` = savunma:** spec'e göre iki atama alanından yalnız biri dolu; ikisi de doluysa
  kişiye-atama kazanır, çift bildirim imkânsız (test #4 bunu sabitler).

**Testler (yeni `CreateTaskTests.cs`, 4 test):** pozisyon fan-out (oluşturan hariç, yanlış
pozisyon almaz) • şube izolasyonu (farklı şubedeki aynı-pozisyon almaz) • kişiye-atama
regresyonu • ikisi-de-dolu savunması.

> [!question] Mülakat Sorusu — **"Pozisyona atamada bildirimi görev oluşturma anında mı
> üretirsin (snapshot), yoksa görüntüleme anında mı çözersin (dinamik)?"**
> Cevap: Burada snapshot: o anki pozisyon+şube üyelerine Notification satırı yazılır. Sonradan
> o pozisyona giren kişi bildirimi ALMAZ — ama görevi pano/mine sorgusunda yine görür, çünkü
> görev-görünürlüğü dinamik sorgu, bildirim tek-seferlik dürtme. İkisi farklı problem: bildirim
> "haberdar et" (o anki kitle), görünürlük "kimin işi" (güncel kitle). Bunu ayıramamak ya
> bildirim tablosunu sürekli senkron etmeye (maliyetli, yarış koşullu) ya da bildirimsiz yeni
> üyelere yol açar.

---

## 3. İş 3 — Duyuru gönderen kendi zilinde görsün (`src/` + test güncellemesi)

**Karar (Berke):** Yönetici kendi duyurusunu kendi zilinde görsün. Gün 8'de gönderen bilerek
hariçti (`.Where(u => u.Id != senderId)`); Tur 10 denetiminde "recipientCount beklenenden az"
kafa karışıklığının bir kaynağı da buydu.

**Çözüm (`CreateAnnouncementHandler`):** Tek satır — sender filtresi kaldırıldı. Gönderen
şube∩rol kapsamındaysa artık alıcı; kapsam dışındaysa (ör. hedef rol Staff, gönderen Manager)
**doğal olarak** yine almaz. "Bilerek dışla" kuralı gitti, kapsam kuralı aynen duruyor.

**Test güncellemesi (davranış değişikliği = test değişikliği):**
- Test 1 (`Tum_Ekibe_Gonderen_Haric_Herkese` → `..._Dahil_Herkese`): RecipientCount 2→**3**,
  "gönderene 0 bildirim" → "gönderene **1** bildirim".
- Test 2'ye yeni assert: gönderen Manager, hedef Staff → kapsam dışı gönderen **almaz**
  (kural artık örtük değil, açıkça sabitlenmiş).
- Test 3-5: gönderen zaten kapsam dışı kurgulanmış → sayılar kaymadı, dokunulmadı.

> [!question] Mülakat Sorusu — **"Davranış değişikliği mevcut testleri kırıyor; testi silmek,
> skiplemek ve güncellemek arasında nasıl karar verirsin?"**
> Cevap: Test neyi koruyordu, o güvence hâlâ gerekli mi? Burada eski test "fan-out doğru kitleye
> gider" güvencesini taşıyordu; değişen yalnız kitlenin tanımı (gönderen dahil). Güvence gerekli
> → test YENİ tanımı assert edecek şekilde güncellenir, adı da yeni davranışı anlatır. Silmek
> güvenceyi kaybettirir; skip "kırmızıyı halının altına süpürmek"tir. Kırmızıya dönen test
> burada tasarımın çalıştığının kanıtı: davranış sözleşmesi değişti, sözleşmenin bekçisi alarm verdi.

---

## 4. Canlı doğrulama (3/3 PASS)

Backend yeni kodla yeniden başlatıldı (`:5203`), web dev server `:3000`:

| # | Senaryo | Sonuç |
|---|---------|-------|
| İş 3 | Owner tüm-ekip duyurusu yayınladı | `recipientCount: 8` (gönderen dahil); Owner'ın zilinde tip 4 "CANLI TEST Gun42 duyuru" ✅ |
| İş 2 | Owner, Kadıköy + Barista pozisyonuna görev attı | 3 barista'nın (ayşe, mehmet, barista@) her birine 1× tip 2 "Pozisyonuna bir görev atandı."; Kasiyer zeynep'e 0 ✅ |
| İş 1 | Owner web'de zili açtı | Tip 10 artık "İzin Talebi" başlığıyla (önce jenerik "Bildirim"); yeni duyuru "Yeni Duyuru" başlığıyla ✅ |

Birim testler: **122/122 geçti** (4 yeni CreateTask + 2 güncellenmiş Announcement dahil).

---

## 5. Durum

- **Spec §5.2 MVP bildirim kapsamı: TAM.** 13 tip üretiliyor, 13'ü de FE'de gerçek başlıkla.
- **Kapsam dışı (Berke onayı):** Push/E-posta/SMS kanalı (spec §5.1) — FCM/SMTP altyapısı yok,
  Faz 2+. Şu an tüm bildirimler in-app (zil).
- **DB güvenlik kuralı korundu:** toplu/filtreli DELETE yok; canlı test verisi id-id eklendi.
