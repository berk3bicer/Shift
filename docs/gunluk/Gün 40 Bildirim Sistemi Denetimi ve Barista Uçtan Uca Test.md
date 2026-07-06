# Gün 40 — Tur 10: Bildirim Sistemi Denetimi + Barista Gözünden Uçtan Uca Test + Hero Rozet Temizliği

**Kapsam:** Bildirim altyapısının **canlı** doğrulanması (sadece "derleme yeşil" değil — her olay
gerçekten tetiklenip barista/owner zilinde göründü mü). Test için `berkekahve.com` tenant'ına
kalıcı bir **barista** kullanıcısı eklendi. Ayrıca küçük bir `marketing/` düzeltmesi (Hero eyebrow
rozeti kaldırıldı). Backend'e **sıfır kod dokunuşu** — mevcut davranış olduğu gibi denetlendi
(FE/marketing hariç kod değişmedi). Branch: `test/bildirim-denetimi` → PR → main.

> **Danışman özeti (tek cümle):** Bildirim altyapısı beklenenden sağlam çıktı — 8 olaydan 7'si
> kodda gerçek + doğru, canlı testte **6/6 senaryo PASS**; tek gerçek boşluk izin akışının hiç
> bildirimi olmaması, ve "duyuru test edilemiyor"un sebebi kod değil ortamda alıcı (barista)
> olmamasıydı — barista'yı kurunca `recipientCount:0` → **6** oldu.

---

## 1. Neden bu tur? — "Derleme yeşil" bildirim için yetmez

Bildirimlerin çoğu **ikinci bir kullanıcıya** gider (görev atandı → atanana, duyuru → ekibe, geç
giriş → yöneticiye). Owner tek başına test edilirse bu yolların hiçbiri gözlemlenemez; fan-out
`recipientCount:0` döner (kod doğru, **alıcı yok**). Bu turun özü: gerçek bir alıcı (barista)
kurup her olayı iki uçtan (tetikleyen + alan) canlı görmek.

**Kavram — "handler yan etkisi olarak bildirim":** Sistemde ayrı bir "notification service" yok;
her komut handler'ı, esas işini yaptığı **aynı `SaveChangesAsync`** içinde ilgili `Notification`
satırlarını da ekliyor. Bu bilinçli: bildirim ile olay **atomik** — ya ikisi de olur ya hiçbiri.
Örn. `PublishWeekHandler` vardiyaları Published'a çevirir **ve** etkilenen personele bildirim
ekler, tek transaction. Push (SignalR/FCM) bunun ÜSTÜNE gelecek; önce kalıcı inbox kaydı şart.

> [!question] Mülakat Sorusu — **"Bir olay gerçekleşti ama bildirim gönderimi patladı; olay geri
> alınmalı mı?"**
> Cevap: Buna göre tasarım kararı verilir. Burada bildirim, olayla **aynı transaction**'da
> yazıldığı için "ya hepsi ya hiçbiri" seçildi — kısmi durum (vardiya yayınlandı ama kimse
> haberdar değil) engellenir. Alternatif (outbox/kuyruk) bildirimi asenkron yapıp olayı korur
> ama "en az bir kez" teslim + tüketici idempotency gerektirir. Küçük ölçekte in-transaction
> basit ve doğru; ölçekte outbox'a geçilir.

---

## 2. Danışman ön-denetimi → canlı teyit (8 olay)

`main@9160062` kodu okunarak çıkarılan olay→bildirim tablosu, bu turda runtime'da işaretlendi.
Kanıt: her senaryoda Owner tetikledi, sonra ilgili kullanıcının `GET /api/notifications`'ı
kontrol edildi (barista ve owner token'larıyla).

| # | Olay | Handler | Kime | Beklenti | Canlı |
|---|------|---------|------|----------|-------|
| 1 | Görev atandı (kişiye) | `Tasks/Create` | Atanan | var, atomik | ✅ T1 |
| 2 | Görev atandı (pozisyona) | `Tasks/Create` | (çok kişi) | **bilerek yok** | ✅ T5 (bildirim gelmedi) |
| 3 | Görev tamamlandı | `Tasks/Move` (→Done) | Oluşturan | var | ✅ T3 |
| 4 | Duyuru yayınlandı | `Announcements/Create` | Şube∩rol, gönderen hariç | doğru | ✅ T2 (recipientCount=6) |
| 5 | Haftalık program yayını | `Shifts/PublishWeek` | İlgili personel | var | ✅ T4 |
| 6 | Tek vardiya yayını | `Shifts/PublishShift` | Vardiya sahibi | var | ✅ (T6 hazırlığı) |
| 7 | Geç giriş (clock-in) | `TimeClocks/ClockIn` | Yönetici + Owner | var | ✅ T6 (isLate=true) |
| 8 | Shift Pool sun/kap/karar | `ShiftPool/*` | Yönetici + karşı taraf | var | 🔎 kod-teyit (canlı çalıştırılmadı) |

**Not (satır 8):** `ShiftPoolNotifications.cs` + `DecideShiftSwapHandler` bildirim üretiyor
(kod okundu, doğru). Canlı senaryosu Give/Take + onay akışı kurulumu gerektirdiği için bu turda
çalıştırılmadı — Faz 2'de havuz turunda ayrıca doğrulanacak.

**Bildirim tipi → panel başlığı eşleşmesi (barista zilinde gözlendi):**
`ShiftPublished(0)`→"Vardiya Programı", `LateClockIn(1)`→(yönetici), `TaskAssigned(2)`→"Görev",
`TaskCompleted(3)`, `AnnouncementPosted(4)`→"Yeni Duyuru".

---

## 3. GERÇEK BOŞLUK: İzin akışının hiç bildirimi yok (spec §5.2 MVP diyor)

Denetimin tek somut açığı:

- **İzin talebi → yönetici bildirimi:** `TimeOff/Create/CreateTimeOffHandler` → `Notification`
  ÜRETMİYOR (grep: bildirim üreten handler listesinde yok — 0 referans).
- **İzin onay/red → personel bildirimi:** `TimeOff/Decide/DecideTimeOffHandler` → aynı şekilde
  bildirim yok.

Spec §5.2'de ikisi de **MVP** işaretli. **Bu turda İNŞA EDİLMEDİ** (brief talimatı: sadece
raporla). Berke'yle önceliği ayrıca konuşulacak — bkz. §7.

> Bu, devir teslimindeki `#timeoff-create-for-staff` gap'inden **farklı** bir bulgu. O "yönetici
> başkası adına izin oluşturamıyor"du (yetki/token); bu "izin akışının **hiç** bildirimi yok".

---

## 4. Test ortamı: barista kullanıcısı (doğru kanaldan)

**Kısıt:** Davet (invite) endpoint'i backend'de yok — `register` yeni tenant açar (işe yaramaz).
Brief bu yüzden **DB seed** öneriyordu (elle BCrypt + Users/UserRoles/UserBranches insert).

**Yapılan (bilinçli sapma, daha güvenli):** Ham SQL yerine **`POST /api/staff`** kullanıldı.
Bu uç zaten var (`CreateStaffHandler`) ve tam olarak bu iş için: mevcut tenant'a yeni tenant
AÇMADAN `User + UserRole(Staff) + UserBranch(+pozisyon)` ekler — hepsi **tek `SaveChanges`**,
BCrypt hash'i uygulamanın kendi kodu üretir. Böylece elle hash uydurma / manuel çok-tablo insert
riski sıfırlandı, uca `[Authorize(Roles="Owner,Manager")]` guard'ı da doğrulanmış oldu.

- **Kimlik:** `barista@berkekahve.com` / `Sifre1234` (Barış Barista) — Kadıköy Şubesi, Barista
  pozisyonu, Staff rolü. **Kalıcı** (Berke kendi de deneyecek).
- Login → `token` (kılavuz: `accessToken` değil) → `/api/auth/me` `userId` + `branchId` döndü.
  Owner `branchId:null` (şube seçici kullanır), barista `branchId:Kadıköy` (clock-in için).

**Kavram — global e-posta benzersizliği:** `CreateStaffHandler` e-posta kontrolünü
`IgnoreQueryFilters()` ile yapar. Neden: login e-postayı **tenant'tan bağımsız** (global) arar,
o hâlde e-posta global tekil olmalı; tenant filtresi altında arasaydı başka tenant'taki aynı
e-postayı göremez, çakışmayı kaçırırdı.

---

## 5. Uçtan uca test — 6/6 PASS (barista gözünden)

Tüm akış tek script'le API uçlarından koşuldu (psql yok); her adımda JSON kanıt alındı.

| Test | Tetikleyen (Owner) | Beklenen | Sonuç |
|------|--------------------|----------|-------|
| **T1** | Baristaya kişisel görev | Barista zili: "Sana bir görev atandı." | ✅ PASS |
| **T2** | Kadıköy∩Staff duyuru | Barista zili: duyuru başlığı; **recipientCount=6** | ✅ PASS |
| **T3** | (Barista) görevi Done'a taşır | Owner zili: "Atadığın görev tamamlandı." | ✅ PASS |
| **T4** | Baristaya vardiya + publish-week | Barista zili: "Haftalık … yayınlandı." | ✅ PASS |
| **T5** | Pozisyona görev | Bildirim **gelmemeli** (tasarım) | ✅ PASS (0 bildirim) |
| **T6** | Geç clock-in | Owner zili: "… geç giriş yaptı." (isLate=true) | ✅ PASS |

**İzolasyon disiplini (kritik):** DB'de **23 Draft vardiya** vardı. `publish-week` bir tarih
aralığındaki TÜM Draft'ları yayınlar → geniş aralık Berke'nin verisini yayınlardı. Bu yüzden
T4'ün test vardiyası **2026-12-01** (boş, izole gün) tarihine kondu ve `publish-week` yalnız o
günü kapsayacak dar aralıkla çağrıldı → `publishedCount=1` (sadece test vardiyası; collateral yok,
runtime'da doğrulandı). T6'nın "bugün geç giriş" vardiyası ise `publish-single`
(`POST /shifts/{id}/publish`) ile yayınlandı — hem satır 6'yı test etti hem tek vardiyayı
etkiledi (23 Draft'a dokunmadı).

**Kavram — geç giriş tespiti:** `ClockInHandler` girişte, personelin o şubedeki **Published**
ve başlangıcı ±12s penceresine düşen vardiyasını arar; giriş anı `vardiya başı + 5dk tolerans`'ı
geçtiyse `isLate=true` → şubenin Manager'ları **+ tüm Owner'lar** bildirilir (geç gelen kişi
hariç). Vardiya yoksa "plansız giriş" — kıyas referansı yok, geç sayılmaz.

> [!question] Mülakat Sorusu — **"Test verisi üretirken production/gerçek veriyi nasıl korursun?"**
> Cevap: (1) Yıkıcı toplu işlemden kaçın — bu turda **hiç** `DELETE` yok, kural gereği. (2)
> Toplu-etkili uçları (publish-week gibi filtreli batch) **dar** parametreyle çağır ve etki
> sayısını **assert** et (`publishedCount==1`). (3) Ürettiğin her kaydın id'sini envanterle,
> geri alınabilir olsun. (4) İzole değerler seç (boş bir tarih, ayrı bir e-posta) ki gerçek
> veriyle çakışmasın.

**Üretilen test verisi (id envanteri — hiçbiri toplu silinmedi):**
- Kullanıcı: `barista@berkekahve.com` (**kalıcı**, kasıtlı)
- Görev ×2 (T1 kişisel, T5 pozisyon) · Duyuru ×1 (T2) · Vardiya ×2 (T4 Aralık, T6 bugün) ·
  TimeClock ×1 (T6, sonrasında clock-out ile kapatıldı)
- Not: T2 duyurusu Kadıköy'deki 5 seed personeline de birer test bildirimi düşürdü (fan-out
  doğru çalıştığı için). Bunlar demonstrasyon amaçlı **bırakıldı** (barista/owner zilinde canlı
  görülebilsin diye). İstenirse id-id (toplu değil) temizlenebilir; tam id listesi PR'da.

---

## 6. Marketing — Hero eyebrow rozeti kaldırıldı

`marketing/components/Hero.tsx`: "Kafe ve restoranlar için hepsi-bir-arada operasyon platformu"
metnini taşıyan, yuvarlak çerçeveli (border) + içinde küçük adaçayı nokta olan **pill `<span>`**
tümüyle silindi. `<h1>`'in gereksiz `mt-6` üst boşluğu da kaldırıldı (eyebrow gidince section'ın
`pt-32/pt-40`'ı zaten dengeliyor; sarkma olmadı). `<h1>` ("Kafenin bütün operasyonu *tek ekranda*")
ve altı **aynen** korundu. Canlı doğrulama (curl + preview screenshot): eyebrow metni 0 kez
geçiyor, h1 nav'ın hemen altında dengeli, script vurgu yerinde. `marketing/` dışına dokunulmadı.

---

## 7. Berke'nin kararı bekleyen (bu tur İNŞA EDİLMEDİ, sadece raporlandı)

1. **İzin bildirimleri** (spec §5.2 MVP ama yok): talep→yönetici + karar→personel. Yapılsın mı,
   ne zaman? (Küçük iş: iki handler'a in-transaction `Notification.Add` — mevcut kalıba birebir.)
2. **Pozisyona görev atamada toplu bildirim** istenir mi? (Şu an bilerek yok — spam kaygısı.)
3. **Duyuruyu gönderenin kendi zilinde görmesi** (şu an bilerek hariç) — böyle mi kalsın?

---

## 8. Doğrulama & açık borçlar

- Bildirim testi: **6/6 PASS** (JSON kanıt oturumda). Backend kod değişmedi → tsc/build etkisiz.
- `marketing/` Hero: canlı sunucuda doğrulandı; `git diff` yalnız `Hero.tsx` + bu not.
- **Açık borç — screenshot dosyaları:** Barista ekranları (login → /today → zil açık, "4 yeni")
  ve Hero, inceleme oturumunda **canlı görüldü ve doğrulandı**; ancak ortamda headless çekim aracı
  (Playwright/Puppeteer) kurulu olmadığından `docs/gunluk/img/tur10-bildirim-*.png` olarak
  **commit edilmedi**. (tur9fix2 screenshot borcuyla aynı statü.) İstenirse Playwright kurulup
  dosyalar üretilir — Chromium indirmesi gerektiği için ayrı bir adım olarak bırakıldı.
- **Öz-eleştiri:** En güçlü kanıt barista zilinin "4 yeni" açık hâli — Owner tetikledi, barista
  gerçekten gördü. En zayıf nokta: satır 8 (Shift Pool) canlı koşulmadı (kod-teyit) ve owner
  tarafı bildirimleri (T3/T6) yalnız JSON ile kanıtlandı, ekran görüntüsü barista tarafında.
