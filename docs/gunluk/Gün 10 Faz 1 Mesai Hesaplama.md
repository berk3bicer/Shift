# Shift — Gün 10: Mesai Hesaplama (İş Kanunu)

> [!info] Bugünün hedefi Time Clock'un ürettiği ham puantajın üstüne **mesai hesap motoru** kurmak. İşletme bazlı çarpan ayarları (`OvertimeSettings`) + saf hesap servisi (`OvertimeCalculator`) + anlık görüntü endpoint'i + testler. Çekirdek kural: **fazla mesai haftalık 45 saat üstüdür** (İş Kanunu).

**Tarih:** 23 Haziran 2026 **Stack:** .NET 10, EF Core, MediatR, FluentValidation, xUnit **Durum:** ✅ Gün 10 %100 tamamlandı — 36/36 test yeşil

---

## 1. OvertimeSettings — Konfigürasyon Entity'si

Şimdiye kadarki entity'ler bir _olayı/nesneyi_ temsil ediyordu (vardiya, izin, puantaj). `OvertimeSettings` farklı: bir **konfigürasyon** entity'si. "Bu işletme mesaiyi nasıl hesaplasın?" sorusunun cevabını tutar.

**Tasarım kararları:**

- **Tenant başına TEK kayıt** → `TenantId` üzerinde **unique index**. "Bir işletmenin bir çarpan seti vardır" kuralı DB seviyesinde garantilenir (race condition'da bile iki kayıt oluşamaz).
- **`BranchId` yok** → çarpanlar işletme genelinde geçerli (yasa şubeye göre değişmez). İleride istenirse nullable eklenir.
- **Tüm çarpan/oran alanları `decimal`** (`numeric(5,2)`) → para/oran hesabı, `double`'ın kayan nokta hatası bordroda kabul edilemez.

**Alanlar:** `WeeklyOvertimeThresholdHours` (45), `OvertimeMultiplier` (1.5 = %50 zam), `NightMultiplier`/`NightStart`/`NightEnd` (gece), `WeekendMultiplier`, `HolidayMultiplier`. Hepsi `1.0` varsayılanlı → **kutudan çıktığı haliyle ekstra çarpan uygulanmaz**, sadece haftalık 45s fazla mesai çalışır. "Esneklik motoru, makul varsayılanlar."

> [!question] Mülakat Sorusu **"Para/oran alanlarını neden `decimal` tutarsın, `double` değil?"** Cevap: `double` ikili kayan nokta → 0.1 + 0.2 ≠ 0.3 gibi hatalar; para hesabında birikir ve bordroda kabul edilemez. `decimal` ondalık tabanlı, hassas. Karşılaştırma/eşik kontrolü (ör. "> 45 mi") gibi yerlerde `double` yeterli olabilir ama sunulan/saklanan para değeri her zaman `decimal`.

> [!question] Mülakat Sorusu **"Bir kaydın 'tenant başına tek' olmasını nasıl garanti edersin?"** Cevap: `TenantId` üzerinde unique index. Uygulama kodundaki upsert mantığına güvenmem — race condition'da iki istek aynı anda kayıt yaratabilir. DB constraint tek doğruluk kaynağı.

---

## 2. Lazy Default Deseni

**Problem:** Yeni işletme kaydolduğunda `OvertimeSettings` tablosunda o tenant için hiç satır yok. "Ayarlarımı göster" denince ne döneriz?

**Kötü seçenekler:** (1) 404 — yanlış, ayar "yok" değil "özelleştirilmemiş". (2) Her register'da otomatik satır yaratmak — akışı kirletir, gereksiz satır.

**Çözüm — Lazy Default:**

- **Okuma (Get):** DB'de kayıt varsa onu dön; yoksa **bellekte varsayılan değerli sanal nesne** dön (`settings ??= new OvertimeSettings()`). DB'ye HİÇBİR şey yazılmaz.
- **Yazma (Update):** Kayıt varsa güncelle, yoksa o an yarat (**upsert**). Satır ancak işletme gerçekten bir ayarı değiştirince oluşur.
- Entity'nin property initializer'ları (`= 45m`, `= 1.5m`) hem "kayıt yokken dönen değer" hem "yeni kayıt başlangıcı" → **tek kaynak**.

> [!tip] Upsert'te TenantId'yi elle set etme `new OvertimeSettings()` derken `TenantId` atamayız. `SaveChanges` interceptor (Gün 1) `Added` durumundaki her `ITenantEntity`'ye token'dan otomatik damgalar. Mimari bizi yanlış tenant'a yazmaktan korur.

> [!question] Mülakat Sorusu **"Kullanıcıya henüz oluşturmadığı bir ayar kaydı sorulduğunda ne dönersin?"** Cevap: Lazy default — bellekte varsayılan değerli nesne dönerim, DB'ye yazmam. Kullanıcı bir değişiklik yapıp kaydedince (upsert) gerçek satır o an oluşur. 404 dönmem çünkü ayar "yok" değil "varsayılan".

---

## 3. OvertimeCalculator — Saf Hesap Servisi

`ShiftRuleChecker` ile aynı felsefe: **saf servis, hiçbir şey yazmaz**, sadece okur ve hesaplar. Hem anlık görüntü (Query) hem ileride `OvertimeRecord` kalıcılaştırma aynı servisi çağırır → mantık tek yerde, iki kullanım.

### Çekirdek kural: Fazla mesai HAFTALIK hesaplanır

İş Kanunu: fazla mesai = **haftalık 45 saati aşan kısım** (günlük değil, aylık değil).

> [!danger] Klasik hata Aylık toplamı alıp "183 − 180 = 3 fazla mesai" demek YANLIŞ. Her haftayı ayrı değerlendirmek gerekir. Örn. haftalar 40+50+45+48 → fazla mesai = 0+5+0+3 = **8** (aylık toplam 183'ten değil).

**Algoritma:**

```
1. OvertimeSettings'ten eşiği oku (lazy default 45)
2. Dönemin KAPALI TimeClock kayıtlarını çek (CheckOutTime != null)
3. Kayıtları HAFTALARA grupla (Pazartesi-başı deterministik)
4. Her hafta: total = Σ süre; normal = min(total, 45); fazla = max(0, total-45)
5. Dönem özeti = haftaların toplamı
```

**Deterministik hafta:** `((int)DayOfWeek - 1 + 7) % 7` ile Pazartesi'ye geri git — ShiftRuleChecker ile AYNI formül (tutarlılık şart).

### Kritik tasarım kararları

- **Sadece kapalı kayıt:** Açık kaydın (çıkış yok) süresi belirsiz → mesaiye giremez.
- **Dönem sınırı `< toDt`:** `to.AddDays(1)` + `<` ile `to` gününün tamamı dahil (23:59'daki kayıt da sayılır). Klasik "ertesi günün başına kadar" deseni.
- **`decimal` cast + yuvarlama:** `TimeSpan.TotalHours` → `double`; sunulan değere geçerken `decimal`'e cast + `Math.Round(.., 2, AwayFromZero)`.
- **Belleğe çekme:** `TimeSpan.TotalHours`'ı EF SQL'e çeviremez (Gün 4 sorunu) → iki tarih alanını `Select`'le çekip gruplama/toplama C#'ta. Kafe ölçeğinde (ayda birkaç yüz kayıt) sorunsuz.

> [!question] Mülakat Sorusu **"Türkiye'de fazla mesai nasıl hesaplanır — kodda buna nasıl uyarsın?"** Cevap: Haftalık 45 saat üstü fazla mesaidir (%50 zamlı). Kodda kayıtları haftalara grupluyorum, her haftaya ayrı 45s eşiği uyguluyorum. Aylık toplamdan tek seferde çıkarmak yanlış olur — bir haftanın fazlası başka haftanın eksiğiyle yutulur.

> [!question] Mülakat Sorusu **"Bir tarih aralığı sorgusunda 'bitiş günü dahil' olsun istiyorsun. Nasıl yazarsın?"** Cevap: `>= from && < to.AddDays(1)`. `<= to` dersem o günün sadece 00:00'ını alırım; gün boyu kayıtları kaçırırım. Üst sınırı bir gün ileri alıp `<` kullanmak en güvenli kalıp (yarı-açık aralık).

---

## 4. İnce Katman: Query/Handler/Controller

Handler neredeyse hiç iş yapmaz — Calculator zaten her şeyi yapıyor. Handler sadece "kim için, hangi dönem" parametrelerini geçirir. **Mantığın doğru yerde (saf serviste) olduğunun işareti.**

- **Query:** `GetOvertimeSummaryQuery(UserId, From, To)` → `StaffOvertimeSummary`
- **Validator:** bitiş ≥ başlangıç, aralık ≤ 1 yıl
- **Controller:** `GET /api/overtime/summary?userId=&from=&to=`, `[Authorize(Roles="Owner,Manager")]`. `DateOnly` query string'den otomatik parse (.NET 8+).

> [!tip] IDOR koruması mimariden bedava `userId` client'tan gelir ama Calculator içindeki `_db.Users.Where(u => u.Id == userId)` **global query filter** altında → otomatik sadece bu tenant'ın kullanıcılarına bakar. Başka tenant'ın id'si gelirse `null` → "bulunamadı". Ekstra kontrol yazmaya gerek yok.

> [!question] Mülakat Sorusu **"Handler'ın neredeyse boş olması iyi mi kötü mü?"** Cevap: İyi. İş mantığı saf, test edilebilir bir serviste (Calculator) toplanmış; handler sadece köprü. Aynı mantığı başka bir yer (ör. kalıcılaştırma akışı) da çağırabilir → tek kaynak, tekrar yok.

---

## 5. Test — Hesabın Kanıtı

5 yeni xUnit testi (InMemory + FakeTenantProvider). Calculator `ICurrentUserProvider` kullanmaz → sadece `db` lazım.

1. **45 altı** → hepsi normal, fazla 0
2. **45 üstü** → aşan kısım fazla mesai
3. **İki hafta ayrı** → en kritik test (aşağıda)
4. **Açık kayıt** → hesaba girmez
5. **Dönem dışı** → girmez

> [!success] Test 3 neden bel kemiği 40 + 50 = 90 saat. "Aylık toplamdan 45 çıkar" → 45 fazla (YANLIŞ). Doğru: hafta1=0 + hafta2=5 = **5**. Bu test, biri Calculator'ı "optimize ederim" diye aylık toplama çevirirse anında kırmızı yanar → İş Kanunu'nun haftalık kuralını koda kilitler.

> [!note] InMemory seed tuzağı burada sorun değil Gün 9'da öğrenilen "InMemory `HasData` seed'i uygulamaz" tuzağı bu testlerde geçerli değil — Calculator `Role` okumaz, sadece `Users`/`TimeClocks`/`OvertimeSettings`. OvertimeSettings de eklenmez → lazy default (45) devreye girer, dolaylı test edilmiş olur.

---

## 6. Bilinçli Sadeleştirmeler (Refactor Borçları)

> [!warning] Gün 10'da alınan "şimdilik" kararları
> 
> 1. **Ücret/tutar YOK** — sadece saat hesaplanıyor. Çarpan alanları (gece/hafta sonu/tatil) DB'de hazır ama Calculator henüz okumuyor. Ücret `Position.HourlyRate`'te ve nullable; User-Position doğrudan bağı yok. Ücret altyapısı (İK modülü) ile birlikte devreye girecek.
> 2. **Tatil takvimi** sonraya — dini bayramlar (Ramazan/Kurban) hicri takvimden hesaplanır, ayrı iş.
> 3. **Ay/hafta sınırı çakışması** — aydan taşan haftalar eksik toplanabilir; "tam hafta" dönem verilirse kusursuz.
> 4. **Kayıt bazlı çarpan** (dakika değil) — ücret gelince yeniden ele alınacak.
> 
> Eski borçlar duruyor: çoklu pozisyon ücreti, `LateGraceMinutes=5` sabiti, gece-aşan vardiya (TimeOnly kesişimi).

---

## 7. Veritabanı Durumu (Gün 10 sonu)

Yeni tablo:

- `OvertimeSettings` — TenantId unique, çarpan alanları `numeric(5,2)`, NightStart/End `time`

Yeni endpoint'ler:

- `GET /api/overtime-settings` (Owner+Manager) — lazy default
- `PUT /api/overtime-settings` (Owner) — upsert
- `GET /api/overtime/summary?userId=&from=&to=` (Owner+Manager)

Migration: `AddOvertimeSettings`

---

## 8. Sırada Ne Var (Gün 11)

`OvertimeRecord` kalıcılaştırma + bordro:

1. **OvertimeRecord entity** (spec'te tanımlı) — dönem kapanınca hesabı dondur
2. **Ay kapanış akışı** — Calculator'ı çağır, sonucu tabloya yaz, kilitle
3. **Bordro export** — Excel/CSV (Logo, Mikro, Paraşüt için)
4. Belki: çarpanları + ücreti devreye al (İK modülüyle birlikte)

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Konfigürasyon entity: tenant başına tek → unique index
- [ ] decimal vs double: para her zaman decimal
- [ ] Lazy default: kayıt yoksa bellekte varsayılan, ilk yazmada upsert
- [ ] Upsert'te TenantId interceptor'dan (elle set etme)
- [ ] Fazla mesai HAFTALIK 45s (aylık toplamdan çıkarma!)
- [ ] Deterministik hafta: ((int)DayOfWeek - 1 + 7) % 7
- [ ] Tarih aralığı: >= from && < to.AddDays(1)
- [ ] Saf servis (Calculator) + ince handler = mantık tek yerde
- [ ] IDOR: global filter sayesinde userId client'tan gelse de izole
- [ ] TimeSpan.TotalHours EF'e çevrilemez → belleğe çek

#shift #dotnet #backend #faz1 #mesai #overtime #is-kanunu #clean-architecture