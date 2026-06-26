# Shift — Gün 23: Demo Verisi Seed (Doğru Kanal) + Minimal Personel-Ekle Ucu

> [!info] Bugünün hedefi Demo için gerçekçi kafe ekibi + dolu hafta verisi — ama DOĞRU kanaldan (mevcut API uçları, psql-INSERT değil). Seed'i kurarken kritik bir API boşluğu çıktı (personel-ekle ucu yok) → onu gizlemeden yüzeye çıkardık ve onayla minimal bir uç ekledik. Sonuç: sürükle-bırak'ın değerini gösteren dolu çizelge.

**Tarih:** 26 Haziran 2026 **Stack:** .NET 10 / Next.js 16 **Durum:** ✅ Gün 23 tamamlandı — 95/95 test yeşil, seed idempotent, demo haftası dolu

---

## 1. "Doğru Kanal" Disiplini: psql INSERT Neden Yasak

Demo verisi psql ile doğrudan INSERT edilebilirdi — ama edilmedi. Sebep: doğrudan INSERT, uygulamanın kapılarını bypass eder:
- **Şifre hash'i** (BCrypt) — elle hash unutulursa login çalışmaz / güvensiz olur.
- **Interceptor** (TenantId damgası) — elle set unutulursa multi-tenancy bozulur.
- **FK/iş kuralları** — çakışma/limit denetimleri atlanır.

Sonuç: "çalışıyor gibi ama aslında sahte" veri. Seed, gerçek uçlardan (login → pozisyon → personel → vardiya) gidince üretim mantığının AYNISINI yaşar → veri gerçek kullanıcı verisiyle aynı kalitede.

> [!question] Mülakat Sorusu **"Test/demo verisini DB'ye doğrudan INSERT mi edersin, API'den mi?"** Cevap: Mümkünse API'den. Doğrudan INSERT hash, tenant damgası, FK ve iş kurallarını bypass eder; "geçerli görünen ama uygulamanın asla üretemeyeceği" veri doğar ve sonra sinsi hatalara yol açar. API'den seed, üretim yolunu kullanır → veri tutarlı. Tek istisna: API ucu OLMAYAN işlemler (orada da minimal, dikkatli SQL).

---

## 2. Boşluğu Gizleme, Yüzeye Çıkar: Personel-Ekle Ucu Yoktu

Seed planını kurarken gerçek bir boşluk çıktı: **mevcut tenant'a personel ekleyen API ucu yok.** `Register` her seferinde *yeni işletme (tenant) + Owner* açıyor — ekibe eleman eklemiyor. "Kullanıcı davet" (spec Modül 7.2) henüz yapılmamış.

Seçenek: (a) psql ile user INSERT (yasak — bkz. §1), (b) minimal davet ucu ekle. **Boşluğu hackleyip geçmek yerine Berke'ye söyledim**, o da doğru kanalı seçti: minimal uç. Bu, "varsayımı doğrula, eksiği sahiplen" disiplini — sessizce psql'e kaçmak teknik borcu gizlerdi.

> [!important] Eksik bir kanalı keşfedince: hackleme, bildir Plan bir API ucuna dayanıyor ve o uç yoksa, en kötü hamle sessizce psql/işaretsiz bir yan yola sapmaktır — hem kuralı çiğner hem boşluğu görünmez kılar. Doğrusu: boşluğu raporla, kararı sahibine bırak. Çoğu zaman "eksik uç" zaten gerçek bir ürün ihtiyacıdır (burada onboarding).

---

## 3. Minimal Personel-Ekle Ucu: Register'ı Taklit, Yeni Tenant Açmadan

`POST /api/staff` (Owner/Manager) — `Register` kalıbının kardeşı:
- E-posta **global** benzersiz (login global arar → tekil olmalı) — `IgnoreQueryFilters` ile kontrol.
- Şifre `BCrypt.HashPassword` (Register'la aynı).
- Rol global seed'li, **Type ile** bulunur (Manager=2222.., Staff=4444..); davetle yalnız Manager/AsistanYönetici/Personel (Owner/Supplier hariç — validator).
- `User` (TenantId interceptor'dan) + `UserRole` + `UserBranch` (+ opsiyonel `PositionId`) tek SaveChanges → atomik.
- **Yeni tenant AÇMAZ** (Register'dan tek farkı; testle çivilendi).

Yan ürün: `GET /api/staff` (ekip roster'ı) — hem seed idempotency'si (e-posta→id) hem gelecekteki atama dropdown'ları için. Migration yok (şema değişmedi). Gün 13'ün "pozisyon atama ucu yok" borcu da bu uçla kapandı (PositionId doğrudan set ediliyor — artık psql gerekmiyor).

> [!question] Mülakat Sorusu **"Var olan bir 'register' akışından yeni bir 'invite' akışı türetirken nelere dikkat edersin?"** Cevap: Ortak parçaları (hash, rol bağlama, benzersizlik) aynen korur, FARKI netleştiririm: register yeni tenant+owner kurar, invite var olan tenant'a üye ekler. Tenant'ı yeniden yaratmamak, doğru role kısıtlamak (ikinci owner olmasın), e-posta tekilliğini login'in beklediği kapsamda (global) tutmak kritik.

---

## 4. Idempotent Seed: Kontrol Et, Sonra Yarat

`scripts/seed-demo.mjs` — iki kez çalışınca çift veri ÜRETMEZ:
- **Pozisyonlar:** ada göre var mı (`GET /api/positions`) → yoksa yarat.
- **Personel:** e-postaya göre (`GET /api/staff`) → yoksa yarat.
- **Vardiyalar:** `kişi + başlangıç saati` anahtarına göre (haftanın `GET /api/shifts`) → yoksa yarat.

Kanıt: 1. çalıştırma `+28 vardiya, 6 personel, 3 pozisyon`; 2. çalıştırma `+0, hepsi "zaten var"`. Set: 6 personel (2 Barista, 2 Kasiyer, 1 Komi, 1 Müdür), Kadıköy Şubesi, 7 gün × ~4 vardiya, sabah/akşam kayması, kişi başı günde tek vardiya (çakışma=400 olmasın).

> [!question] Mülakat Sorusu **"Bir seed script'ini idempotent yapmanın pratiği nedir?"** Cevap: Her yaratma öncesi doğal anahtarla "var mı?" kontrolü — pozisyonda ad, kullanıcıda e-posta, vardiyada kişi+saat. Varsa atla, yoksa yarat (upsert mantığı). Böylece script tekrar tekrar güvenle koşar; CI/demo hazırlığında tek komut.

---

## 5. psql İstisnası: Sadece API Ucu Olmayan İçin

Tek psql kullanımı: **"Test Sube 2" → "Beşiktaş Şubesi"** yeniden adlandırma. Sebep: Branches'te update/delete ucu yok. Bu, §1'deki yasakla çelişmez — yasak *sahte veri yaratan INSERT* içindi; bu ise *var olan test verisinin tek alanını düzeltmek* (UPDATE), hiçbir mantık bypass'ı yok. İstisna minimal ve hedefli tutuldu.

---

## 6. Durum (Gün 23 sonu)

**Backend (onaylı dokunuş):**
- `Features/Staff/Create` (Command+Validator+Handler), `Features/Staff/List` (Query+Handler+DTO)
- `API/Controllers/StaffController.cs` (POST/GET, Owner+Manager)
- `tests/Shift.Tests/CreateStaffTests.cs` — 4 test (hash/rol/şube, yeni-tenant-açmaz, e-posta tekil, geçersiz şube)
- Migration YOK (şema değişmedi)

**Seed:** `scripts/seed-demo.mjs` (idempotent, gerçek API'den).
**DB cleanup:** "Test Sube 2" → "Beşiktaş Şubesi" (psql UPDATE, tek alan).

**Test: 95/95 yeşil** (91 + 4). Demo: Kadıköy haftası 2026-06-29 dolu (28 vardiya, 6 personel) — tarayıcıda doğrulandı.

> [!note] Küçük kalıntı Barista pozisyonu önceden vardı (renk yeşil, ücret 120.50) → seed onu yeniden kullandı (yeni mavi/90 yaratmadı; pozisyon-update ucu yok, unique-ad çakışır). Barista/Kasiyer renkleri benzer yeşil; Komi turuncu, Müdür mor ayrışıyor. İstenirse Barista rengi/ücreti tek psql UPDATE ile düzeltilir.

---

## 7. Sırada Ne Var (Gün 24)

> [!success] Atama dilimi artık AÇIK Çok personel + dolu hafta hazır → sürükle-bırak'ın 2. ayağı (**kartı başka kişiye ata**, UserId değişir) artık test edilebilir. `GET /api/staff` dropdown'u besler.

**Diğer FE dilimleri:** vardiya oluştur/düzenle/yayınla modalı; Kanban; kontrol listeleri; duyuru.
**Backend (demo sonrası):** Excel export, tatil takvimi, tekrarlayan görev, R2 implementasyonu; Barista renk/ücret düzeltmesi (kozmetik).

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Demo/test verisi: API'den seed et, psql INSERT etme (hash/tenant/FK/kural bypass'ı)
- [ ] Plan bir API ucuna dayanıp o uç yoksa: hackleme, bildir, kararı sahibine bırak
- [ ] Invite = Register'ı taklit ama yeni tenant açma; rolü kısıtla, e-posta global tekil
- [ ] Idempotent seed: doğal anahtarla (ad/e-posta/kişi+saat) "var mı?" → yoksa yarat
- [ ] psql istisnası yalnız API ucu OLMAYAN, mantık-bypass'sız düzeltmeler için (UPDATE)
- [ ] Dolu gerçekçi veri = sürükle-bırak'ın değeri görünür + atama dilimi açılır

#shift #dotnet #frontend #demo-seed #idempotent #staff-invite #dogru-kanal #vardiya
