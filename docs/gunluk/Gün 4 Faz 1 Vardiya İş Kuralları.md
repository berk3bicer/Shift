# Shift — Gün 4: Vardiya İş Kuralları (Çakışma & İş Kanunu Limitleri)

> [!info] Bugünün hedefi Vardiya oluşturmaya **iş kuralı katmanı** eklemek: çakışma kontrolü (engelleyen **hata**) + İş Kanunu limitleri (engellemeyen **uyarı**). Saf domain mantığı — yeni migration yok. Sonunda kuralları kalıcılaştıran **7 xUnit testi**.

**Tarih:** Gün 4 (tematik oturum) **Stack:** .NET 10, ASP.NET Core Web API, PostgreSQL, EF Core, MediatR, xUnit **Durum:** ✅ Tamamlandı — `CreateShiftHandler` 4 kural + 9/9 test yeşil

---

## 1. Temel Karar: Hata mı, Uyarı mı?

Bir handler iki tür "olumsuz sonuç" üretebilir ve bunları ayırmak bu günün kalbi:

|Tip|Davranış|HTTP|Örnek|
|---|---|---|---|
|**Hata (hard block)**|İşlemi keser, kayıt OLUŞMAZ|400|Çakışma|
|**Uyarı (soft warning)**|Kayıt OLUŞUR, `warnings` listesi döner|200|İş Kanunu limitleri|

**Neden çakışma = hata?** Aynı personel aynı anda iki yerde fiziksel olarak olamaz. Bu bir tercih değil, veri bütünlüğü meselesi. Yönetici "yine de istiyorum" diyemez; oluşan kayıt anlamsız olurdu.

**Neden İş Kanunu limitleri = uyarı?** Gerçek hayatta bilinçli aşıldığı meşru durumlar var (bayram, yoğun hafta sonu, personelin kendi isteği). Spec de "uyarı" diyor. Sistem yöneticiyi _engelleyemez_ ama _uyarmak zorunda_.

> [!tip] 7shifts doğrulaması 7shifts iş kanunu ihlallerini bilinçli olarak **engellemez, uyarır** — gerekçesi birebir aynı: yöneticiyi işi yürütmek için gereken personeli atamaktan alıkoymamak; nihai karar yöneticide. Bizim tasarımımız sektör lideriyle örtüşüyor.

> [!important] Mimari sonuç: dönüş tipi değişti Handler artık sadece `ShiftId` dönemez. "Başarılı ama şu uyarılarla" diyebilmeli:
> 
> ```csharp
> public record CreateShiftResult(Guid ShiftId, IReadOnlyList<string> Warnings);
> ```
> 
> Exception'ı kontrol akışı için kullanmak (limit aşımında throw) **yanlış olurdu** — limit aşımı bir hata değil, başarılı işlemin yan bilgisi. O yüzden başarılı sonucun _içine_ koyuyoruz.

> [!question] Mülakat Sorusu **"Bir iş kuralı ihlalini ne zaman exception ile, ne zaman dönüş değeri ile temsil edersin?"** Cevap: Exception, akışı kesmesi gereken _gerçek hata_ durumları içindir (geçersiz durum, imkânsızlık). İşlem başarılıysa ama kullanıcının bilmesi gereken bir yan bilgi varsa (uyarı), bunu exception ile temsil etmem — başarılı sonucun içinde bir `warnings` koleksiyonu olarak dönerim. Exception'ı normal kontrol akışı için kullanmak (control-flow-by-exception) hem pahalı hem yanıltıcıdır.

---

## 2. Kuralların Çalışma Önkoşulu: Atanmış Vardiya

Tüm kurallar `if (request.UserId.HasValue)` bloğunun içinde. **Açık vardiya (UserId=null) hiçbir kurala girmez.**

**Neden?** Açık vardiyanın sahibi yok ("havuzda"). "Kimin 11 saati?", "kim kiminle çakışıyor?" — sahibi belirsizken bu sorular tanımsız. İleride personel açık vardiyayı _kaptığında_ (Take a Shift, Faz 2) kontrol o atama anında devreye girer — doğru yer orası.

---

## 3. Çakışma Kontrolü (HARD BLOCK)

```csharp
var hasConflict = await _db.Shifts.AnyAsync(s =>
    s.UserId == request.UserId.Value
    && s.StartTime < request.EndTime
    && s.EndTime > request.StartTime, ct);

if (hasConflict)
    throw new InvalidOperationException("...çakışma...");
```

**Kesişim kuralı:** `mevcut.Start < yeni.End && mevcut.End > yeni.Start`. İki aralık çakışır ⟺ biri diğeri bitmeden başlar VE diğeri başladıktan sonra biter.

> [!important] `<` ve `>` (strict) neden kritik? Sırt sırta vardiyalar — 13:00 biten + 13:00 başlayan — çakışma **sayılmaz**. `<=` kullansaydık bunları yanlışlıkla engellerdik. Kafede normal bir uzun mesai (09–13, 13–17) bölünmüş vardiyadır, meşrudur. Bu yüzden ListShifts'teki kesişim kuralıyla **birebir aynı** mantığı kullanırız.

> [!note] Kontrol, kayıttan ÖNCE Çakışmayı `Add` etmeden önce kontrol ederiz. Önce ekleyip sonra kontrol etseydik kendi kendimizle çakışırdık. Sıra: **doğrula → yaz.**

---

## 4. İş Kanunu Limitleri (SOFT WARNING)

Üç kural da aynı iskelet: _ilgili aralığın vardiyalarını topla + yeni vardiyayı ekle → eşiği aş → `warnings.Add(...)`_.

### 4.1 Günlük 11 saat

"Gün" = yeni vardiyanın başladığı takvim günü (UTC). `[gün 00:00, ertesi 00:00)` aralığında **başlayan** vardiyaları topla.

### 4.2 Haftalık 45 saat

"Hafta" = Pazartesi 00:00 → gelecek Pazartesi 00:00. **Deterministik** hesap (sistem/kültür ayarına bağlı değil):

```csharp
var daysSinceMonday = ((int)request.StartTime.DayOfWeek - 1 + 7) % 7;
var weekStart = request.StartTime.Date.AddDays(-daysSinceMonday);
```

`DayOfWeek`: Pazar=0, Pazartesi=1... Cuma (5) → `(5-1+7)%7 = 4` gün geri = Pazartesi. ✓

### 4.3 Dinlenme (iki vardiya arası min 11 saat)

Önceki komşu (`EndTime <= yeni.Start`, en geç biten) + sonraki komşu (`StartTime >= yeni.End`, en erken başlayan). Aradaki boşluk < 11 saat → uyarı.

> [!warning] Dinlenme yalnızca FARKLI günlerde `prev.StartTime.Date != request.StartTime.Date` koşulu şart. Aynı gün split shift'leri (09–13, 13–17) "0 saat dinlenme" diye yakalamamalı — onlar zaten _günlük 11 saat_ kuralıyla denetleniyor. 7shifts de aynı-gün ardışıkları "split shift" sayar, "yetersiz dinlenme" değil.

> [!important] EF, `TimeSpan.TotalHours`'u SQL'e çeviremez
> 
> ```csharp
> var rows = await _db.Shifts.Where(...)
>     .Select(s => new { s.StartTime, s.EndTime })  // sadece 2 alan
>     .ToListAsync(ct);
> var hours = rows.Sum(s => (s.EndTime - s.StartTime).TotalHours);  // C# tarafında
> ```
> 
> Süre toplamını DB'de yapamayız (PostgreSQL'de TimeSpan→saat dönüşümü desteklenmiyor). Çözüm: gereken iki tarih alanını `Select` ile çek (tüm entity'yi değil → hafif), toplamayı belleğe al. Bir personelin bir gün/haftadaki vardiya sayısı az olduğu için bu zararsız.

> [!tip] Global query filter burada da bedava Tüm bu sorgular (`_db.Shifts.Where/AnyAsync`) Faz 0'daki global filter altında çalışır → otomatik `WHERE TenantId = ...`. Başka işletmenin vardiyası bu toplamlara/çakışmaya asla giremez. IDOR koruması ücretsiz.

> [!question] Mülakat Sorusu **"EF Core'da neden bazı hesaplamaları DB yerine bellekte yaparsın? Riski ne?"** Cevap: EF, her C# ifadesini SQL'e çeviremez (ör. `TimeSpan.TotalHours`). Çevrilemeyen bir ifadeyi sorguda kullanırsam ya runtime hatası alırım ya da (eski sürümlerde) sessizce tüm tabloyu çekip client-side değerlendirir — performans felaketi. Bilinçli karar: sadece gereken küçük kolonları `Select`'le çekip, toplamı bellekte yaparım. Risk, veri kümesi büyükse bellek/performans; o yüzden önce `Where` ile daraltır, sonra projeksiyonla küçültürüm.

> [!question] Mülakat Sorusu **"Haftanın başını neden `DayOfWeek`'e güvenmeden elle hesapladın?"** Cevap: `DayOfWeek`/`Calendar.FirstDayOfWeek` kültüre ve sunucu ayarına göre değişir (ABD'de Pazar, TR'de Pazartesi). İş kuralı deterministik olmalı — sunucu nerede çalışırsa çalışsın aynı sonucu vermeli. O yüzden Pazartesi'yi modulo aritmetiğiyle sabit formülle bulurum.

---

## 5. Test — Kuralların Kalıcı Kanıtı

`CreateShiftRulesTests.cs` — gerçek `ShiftDbContext` (InMemory) + `FakeTenantProvider` ile handler'ı doğrudan çağırır.

|#|Test|Beklenen|
|---|---|---|
|1|Çakışan vardiya|`InvalidOperationException`|
|2|Sırt sırta vardiya|Kayıt olur, `warnings` boş|
|3|Günlük 12 saat|Kayıt olur + "Günlük 11 saat" uyarısı|
|4|Limit altı (4 saat)|`warnings` boş|
|5|Haftalık 46 saat|Kayıt olur + "Haftalık 45 saat" uyarısı|
|6|Dinlenme 10 saat|"Yetersiz dinlenme" uyarısı|
|7|Açık vardiya (UserId=null)|Hiçbir kural çalışmaz, `warnings` boş|

> [!tip] Handler'ı InMemory ile test etmek Handler `IShiftDbContext` aldığı için, InMemory `ShiftDbContext`'i doğrudan veririz. Global query filter EF seviyesinde çalıştığı için InMemory'de de devrede → tenant izolasyonu testte de geçerli. Mock'lamaya gerek yok; gerçek context, sahte tenant provider.

> [!success] Sonuç: 9/9 yeşil 7 yeni kural testi + 2 eski izolasyon testi. Bir kural ileride bozulursa test anında yakalar.

---

## 6. Manuel Doğrulama (curl) — Yaşanan Tuzaklar

> [!warning] zsh + yorum satırı + parantez = `parse error` Çok satırlı komutu `#` yorumlarıyla yapıştırınca zsh `(` `)`'de boğulur. **Çözüm:** yorumsuz, tek tek komut; JSON parse için `python3` yerine `sed 's/.*"token":"//;s/".*//'` (parantez yok).

> [!warning] `dotnet build` çalışan API'yi GÜNCELLEMEZ Build sadece derler. Çalışan `dotnet run` eski binary'i kullanmaya devam eder. Kod değişikliğini görmek için API'yi **durdur (Ctrl+C) + yeniden başlat.** Bir string düzeltmesinin neden "görünmediğini" bu yüzden uzun aradık — kod doğruydu, çalışan process eskiydi.

> [!warning] `curl -s` sessizce yutar Token boşsa `Authorization: Bearer` gider, API boş/401 döner ama `-s` (silent) hatayı gizler. Belirsizlikte `-sv` veya `${#TOKEN}` ile uzunluk kontrolü yap.

---

## 7. Sırada Ne Var (Gün 5)

Faz 1 devam. Olası yönler:

1. **Vardiya güncelleme/silme** — Update/Delete handler'ları (aynı kural seti güncellemede de çalışmalı)
2. **Vardiya yayınlama (Publish)** — Draft → Published durum geçişi + personele bildirim
3. **Müsaitlik (Availability)** — tekrar eden müsaitlik profili; vardiya çakışmasını besler

> [!note] Refactor adayı (borç notu) Dört kural şu an `CreateShiftHandler` içinde inline. Update handler'ı gelince aynı kurallar orada da lazım olacak → kuralları ayrı bir `ShiftRuleChecker` (domain service) içine çıkarmak mantıklı olabilir. Şimdilik tek kullanıcı olduğu için erken soyutlama yapmadık (YAGNI); ikinci kullanım gelince çıkarırız.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Hata (hard block, 400, kayıt yok) vs Uyarı (soft warning, 200, warnings listesi)
- [ ] Exception'ı control-flow için kullanma — uyarı başarılı sonucun içinde döner
- [ ] Kurallar yalnızca atanmış vardiyada (UserId dolu); açık vardiya muaf
- [ ] Çakışma kesişimi: `Start < End && End > Start` (strict → sırt sırta meşru)
- [ ] Doğrula → yaz (kontrol kayıttan önce)
- [ ] Günlük/haftalık/dinlenme: aralığı topla + yeni + eşik → uyar
- [ ] Hafta başı deterministik: `((int)DayOfWeek - 1 + 7) % 7`
- [ ] Dinlenme yalnızca farklı günlerde (split shift muaf)
- [ ] EF `TimeSpan.TotalHours`'u çeviremez → `Select` + bellekte `Sum`
- [ ] Global query filter tüm kural sorgularında otomatik tenant izolasyonu
- [ ] Handler'ı InMemory ShiftDbContext + FakeTenantProvider ile test et
- [ ] `dotnet build` çalışan API'yi güncellemez → restart şart

#shift #dotnet #backend #faz1 #vardiya #is-kurallari #is-kanunu #xunit #validation