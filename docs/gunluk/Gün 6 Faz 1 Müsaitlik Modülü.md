# Shift — Gün 6: Müsaitlik (Availability) Modülü

> [!info] Bugünün hedefi Personelin **tekrar eden müsait olmadığı** zamanları kaydetmek ve bunu vardiya planlamasına bağlamak. Yeni entity + CRUD + `ShiftRuleChecker`'a entegrasyon (yeni bir uyarı). Sonunda 15/15 test yeşil.

**Tarih:** Gün 6 (tematik oturum) **Stack:** .NET 10, EF Core (TimeOnly), MediatR, xUnit **Durum:** ✅ Tamamlandı — Availability entity + CRUD + kural entegrasyonu + 3 test (toplam 15/15)

---

## 1. Availability vs Time Off — Kavramsal Ayrım

7shifts'in (ve bizim spec'in) en net ayrımlarından biri. İkisini karıştırmak modülü baştan yanlış kurar:

||**Availability (Müsaitlik)**|**Time Off (İzin)**|
|---|---|---|
|Süre|**Tekrar eden** (her Salı)|**Tek seferlik** (15-20 Tem)|
|Veri|Haftanın günü + saat|Belirli tarih aralığı|
|Amaç|"Düzenli ne zaman çalışamam"|"Şu tarihte yokum"|
|Onay|Tercih bildirimi|Onaya tabi taahhüt|

> [!tip] 7shifts doğrulaması 7shifts net ayırır: Availability düzenli çalışabilir/çalışamaz zamanları tanımlar (okul, başka iş); Time Off tek seferlik devamsızlık talebidir. Bizde de ayrı modüller — bu gün Availability, Time Off sonraki güne.

> [!question] Mülakat Sorusu **"Tekrar eden bir kısıt (her Salı okul) ile tek seferlik bir kısıtı (gelecek hafta tatil) aynı tabloda mı tutarsın?"** Cevap: Hayır, ayrı modellerim. Tekrar eden olan haftanın gününe bağlıdır (DayOfWeek + saat), tarihi yoktur — her hafta otomatik uygulanır. Tek seferlik olan belirli bir tarih aralığıdır ve genelde onay akışı gerektirir. Farklı veri şekli, farklı iş akışı → farklı entity. Tek tabloda birleştirmek ikisini de bozar.

---

## 2. Blacklist Modeli: "Müsait Değil" Kaydı

7shifts 4 durumlu (All-day available / Available / All-day not available / Not available). **Biz sadeleştirdik:** yalnızca "müsait DEĞİL" dilimlerini tutuyoruz (blacklist).

**Varsayılan:** personel her zaman müsaittir. Sadece _olmadığı_ zamanları girer. Kayıt yoksa → o gün tamamen müsait.

> [!note] Neden blacklist (whitelist değil)? Kafe gerçekliği: part-time barista "Salı okulum var, gelemem" der — istisnayı bildirir, tüm müsait saatlerini tek tek girmez. Whitelist (sadece şu saatlerde müsaitim) daha çok yük bindirir. Spec ilkesi: "kafe için çalışan tek senaryoyu bitir, esnekliği gerçek talep gelince ekle." Whitelist'i şimdilik eklemedik.

---

## 3. TimeOnly Tipi — Tarihsiz Saat

```csharp
public TimeOnly StartTime { get; set; }  // sadece 13:00, tarih yok
public TimeOnly EndTime { get; set; }
public DayOfWeek DayOfWeek { get; set; } // System.DayOfWeek: Pazar=0...Cmt=6
```

> [!important] Neden TimeOnly, DateTime değil? Müsaitlik "her Salı 13:00–18:00" gibi — **tarihi yok, sadece saati var.** DateTime kullansak gün/yıl kısmı anlamsız dolgu olur, yanlış sorgulara açık kapı bırakır. TimeOnly (.NET 6+) tam bu iş için: gün/tarih taşımadan saat-dakika. PostgreSQL'de `time without time zone` kolonuna maplenir. Tip, veriyi doğru ifade eder → "make illegal states unrepresentable."

> [!note] DayOfWeek: kendi enum'unu yazma `System.DayOfWeek` (Pazar=0...Cmt=6) hazır. Vardiyanın `StartTime.DayOfWeek`'i zaten bu tip → kontrol sırasında doğrudan karşılaştırma. Tutarlılık bedava; kendi enum'unu yazmak gereksiz tekrar olurdu.

> [!question] Mülakat Sorusu **"Bir alanın 'sadece saat' olduğunu nasıl ifade edersin? DateTime'da saklamanın sakıncası ne?"** Cevap: TimeOnly kullanırım. DateTime'da saklarsam tarih kısmı anlamsız bir varsayılan (0001-01-01 ya da bugün) taşır; bu, karşılaştırmalarda ve serileştirmede gizli hatalara yol açar (yanlışlıkla tarihi de kıyaslarsın). Tip sistemi veriyi doğru modellemeli — geçersiz durumları temsil edilemez kılmak (make illegal states unrepresentable) hata yüzeyini daraltır.

---

## 4. Kural Entegrasyonu: Saat Ekseninde Kesişim

`ShiftRuleChecker`'a yeni bir **uyarı** eklendi (engelleme değil). Vardiya UTC DateTime, müsaitlik TimeOnly → vardiyanın saat kısmını çıkarıp karşılaştırıyoruz:

```csharp
var shiftDay = startTime.DayOfWeek;                    // vardiyanın günü
var shiftStartTod = TimeOnly.FromDateTime(startTime);  // 2026-07-06T14:00Z → 14:00
var shiftEndTod = TimeOnly.FromDateTime(endTime);

var dayUnavailabilities = await _db.Availabilities
    .Where(a => a.UserId == uid && a.DayOfWeek == shiftDay)
    .Select(a => new { a.StartTime, a.EndTime, a.Reason })
    .ToListAsync(ct);

foreach (var ua in dayUnavailabilities)
    if (ua.StartTime < shiftEndTod && ua.EndTime > shiftStartTod)  // kesişim
        warnings.Add($"Personel bu saatte müsait değil: ...");
```

> [!tip] Aynı kesişim kuralı, farklı eksen `ua.Start < shiftEnd && ua.End > shiftStart` — Gün 4'teki vardiya çakışma kuralının birebir aynısı, ama bu sefer **saat ekseninde** (TimeOnly). Bir kez öğrenilen kesişim mantığı her yerde kullanılıyor: vardiya-vardiya, vardiya-müsaitlik. Desen tutarlılığı.

> [!important] Müsaitlik = UYARI, hata değil 7shifts'te bile müsaitlik yöneticiye bilgi verir, programı engellemez. Acil durumda yönetici "müsait değilsin ama gelebilir misin" diye atayabilmeli. Bu yüzden `ShiftRuleChecker`'a hata (throw) değil, uyarı (warnings listesi) olarak ekledik. Gün 4'teki çakışma=hata / limit=uyarı ayrımının devamı.

> [!warning] Borç notu: gece yarısını aşan vardiya `TimeOnly.FromDateTime` saat kısmını alır. Bir vardiya 22:00→02:00 (ertesi gün) ise `shiftStartTod=22:00, shiftEndTod=02:00` olur ve `Start < End` bozulur → kesişim hatalı. Kafede gece-aşan vardiya nadir; validator zaten `End > Start` istiyor (çoğu vardiya aynı gün). Gece vardiyası gerçek müşteriyle gelirse rafine edilecek. Şimdilik bilinçli sadelik.

> [!question] Mülakat Sorusu **"İki zaman aralığının çakışıp çakışmadığını nasıl kontrol edersin?"** Cevap: `A.Start < B.End && A.End > B.Start`. İki aralık çakışır ⟺ biri diğeri bitmeden başlar VE diğeri başladıktan sonra biter. Strict (`<`, `>`) kullanırsam sırt sırta (biri tam bittiğinde diğeri başlıyor) çakışma sayılmaz. Bu kural eksenden bağımsızdır — tarih, saat, sayı; hepsinde aynı.

---

## 5. CRUD — Standart Desen

Feature-based: `Application/Features/Availabilities/{Create|List|Delete}/`. Önceki modüllerle aynı kalıp (Command/Query + Validator + Handler), yeni kavram yok.

- **Create:** FK güvenliği (personel bu tenant'ta mı?) → ekle. TenantId interceptor'dan.
- **List:** personelin tüm kayıtları, DayOfWeek + StartTime sıralı, DTO projeksiyon.
- **Delete:** bul (global filter) → sil (hard delete).

> [!note] DbSet eklerken iki yer (tekrar) `Availabilities` DbSet'i HEM `ShiftDbContext` (concrete) HEM `IShiftDbContext` (interface) → yoksa CS1061. Gün 2'den beri sabit ders. Mapping'de: FK (User→Cascade), index (UserId+DayOfWeek), global query filter (tenant izolasyonu).

---

## 6. Test — 3 Senaryo

|#|Test|Beklenen|
|---|---|---|
|1|Müsait olmadığı saatte vardiya|"müsait değil" uyarısı|
|2|Müsaitsizlikten önceki saatte (09-12, kısıt 13-18)|uyarı yok|
|3|Farklı günde (Salı, kısıt Pazartesi)|uyarı yok|

> [!success] 15/15 yeşil 12 eski + 3 yeni. Pozitif (çakışan saat) ve negatif (çakışmayan saat, farklı gün) senaryolar kanıtlandı. curl ile uçtan uca da doğrulandı.

---

## 7. Sırada Ne Var (Gün 7)

Faz 1 devam adayları:

1. **İzin (Time Off):** tek seferlik tarih aralığı + onay akışı (Availability'nin kardeşi; onay/red durumu yeni kavram)
2. **Vardiya yayınlama (Publish):** Draft → Published + ilk bildirim altyapısı
3. **Müsaitlik geliştirmesi:** whitelist (sadece-müsait), geçici müsaitlik (tarih aralığı override)

> [!note] Time Off, Availability'nin doğal devamı İkisi de "personel ne zaman çalışamaz" sorusunu cevaplar. Time Off'ta yeni olan: onay akışı (Pending/Approved/Rejected durumu) + tarih aralığı (DayOfWeek değil). ShiftRuleChecker'a "o tarihte izinli" uyarısı eklenebilir. Kural motoru deseni hazır.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Availability (tekrar eden, gün+saat) ≠ Time Off (tek seferlik, tarih aralığı)
- [ ] Blacklist modeli: sadece "müsait değil" dilimleri; varsayılan müsait
- [ ] TimeOnly: tarihsiz saat → PostgreSQL `time`; DateTime'ın yanlış kullanımını önler
- [ ] System.DayOfWeek hazır enum, vardiyanın DayOfWeek'iyle uyumlu
- [ ] TimeOnly.FromDateTime → vardiyanın saat kısmını çıkar, müsaitlikle kıyasla
- [ ] Kesişim kuralı her eksende aynı: Start < End && End > Start
- [ ] Müsaitlik = uyarı (yönetici override edebilir), hata değil
- [ ] Borç: gece-aşan vardiya (22→02) TimeOnly kesişimini bozar
- [ ] DbSet → concrete + interface (CS1061 dersi)
- [ ] make illegal states unrepresentable: tip veriyi doğru modellemeli

#shift #dotnet #backend #faz1 #musaitlik #availability #timeonly #kural-motoru #xunit