# Shift — Gün 12: Bordro CSV Export

> [!info] Bugünün hedefi Gün 11'de donmuş/kilitlenmiş `OvertimeRecord`'ları **muhasebeye gidebilir bir dosyaya** çevirmek. Spec (Modül 3.3): Logo/Mikro/Paraşüt için CSV export. Bugün: saf `CsvBuilder` (RFC 4180 kaçış + UTF-8 BOM) → export Query/Handler (liste mantığını yeniden kullan, **kilitliye süz**) → ilk dosya-döndüren uç (`GET /records/export`, `Content-Disposition: attachment`). Projenin ilk JSON-olmayan yanıtı.

**Tarih:** 24 Haziran 2026 **Stack:** .NET 10, EF Core, PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 12 %100 tamamlandı — 49/49 test yeşil

---

## 1. Neden Ayrı Bir `CsvBuilder`? (Biçim ≠ İş Kuralı)

Export üç ayrı sorumluluğa bölündü, her biri ayrı dosya — çünkü her birinin **ayrı bir değişme sebebi** var:

| Dosya | Sorumluluk | Ne zaman değişir? |
|---|---|---|
| `CsvBuilder` | "CSV nasıl yazılır" (kaçış, BOM) | CSV format kuralı değişince |
| `ExportOvertimeRecordsQuery` | "ne istiyorum" (filtreler + dönüş tipi) | İstenen filtre değişince |
| `ExportOvertimeRecordsHandler` | "nasıl yapılır" (DB → satır → CSV köprüsü) | Hangi veri/kolon export edilecek değişince |

`CsvBuilder` mesai/bordro hakkında **hiçbir şey bilmez** — başlık + satır alır, byte döndürür. Bu yüzden `Common/Services/`'te (ShiftRuleChecker, OvertimeCalculator'ın yanında): saf biçimlendirme, yan etki yok. İleride stok/tedarik raporu da **aynı** builder'ı çağıracak.

> [!tip] Ayırmanın somut kazancı: test `CsvBuilder`'ı **DB'siz** sınayabiliyor. "Virgüllü isim doğru kaçışlanıyor mu?" sorusu tek satır girdiyle cevaplanıyor — koca handler'ı ayağa kaldırmaya gerek yok. Tek dosyaya tıksaydık bunu test etmek için in-memory DB + join + kullanıcı kurulumu gerekirdi.

> [!question] Mülakat Sorusu **"Bir özelliği neye göre ayrı sınıflara bölersin?"** Cevap: Tek Sorumluluk — her sınıfın tek bir "değişme sebebi" olmalı. Biçimlendirme (CSV kaçışı), istek tanımı (filtreler) ve iş akışı (DB→çıktı köprüsü) farklı sebeplerle değişir; ayrı tutulunca biri değişince diğerleri risk altına girmez. Bonus: saf/bağımsız parça (CsvBuilder) tek başına test edilir ve yeniden kullanılır.

---

## 2. CSV'nin İki Görünmez Tuzağı: Kaçış ve Kültür

CSV "virgülle ayır" kadar masum değil. İki yerde sessizce patlar:

**(A) Alan içi virgül/tırnak (RFC 4180 kaçışı).** Personel adı "Biçer, Berke" ise ham yazılınca satır iki alana bölünür → tüm bordro kayar. Kural: alan **virgül, çift tırnak veya satır sonu** içeriyorsa çift tırnağa al; içteki `"` → `""` yap. `CsvBuilder.Escape` bunu bir kez doğru yapıp her alana uyguluyor.

**(B) Kültür (InvariantCulture).** Asıl sinsi olan bu. Türkçe makinede `0.01m.ToString()` varsayılan olarak **`0,01`** üretir (TR ondalık ayıracı virgül). O virgül CSV alan ayıracıyla **çakışır** → "Toplam Saat" kolonu ortadan ikiye bölünür. Handler'da tüm sayı/tarih dönüşümleri `CultureInfo.InvariantCulture` ile: ondalık **nokta** (`0.01`), tarih **ISO** (`2026-06-30`). Makineler-arası veri taşıyan her yerde format asla yerel ayara bırakılmaz.

> [!important] Curl çıktısı kanıtı `0.01,0.00,0.01` — noktalı ondalık, virgülle çakışma yok. Yerel ayar devreye girseydi `0,01,0,00,0,01` çıkıp kolonlar kayardı.

> [!question] Mülakat Sorusu **"CSV/dosya üretirken `CultureInfo.InvariantCulture` neden kritiktir?"** Cevap: Yerel kültür sayı/tarih biçimini değiştirir (TR'de ondalık virgül, tarih gg.aa.yyyy). CSV'nin alan ayıracı virgülse, virgüllü ondalık alanları böler ve tabloyu bozar. Makineler-arası (export/import, API, serileştirme) her veride InvariantCulture sabit, öngörülebilir biçim verir — kullanıcıya gösterim için ise yerel kültür kullanılır. Ayrım: **gösterim** yerel, **veri taşıma** invariant.

---

## 3. UTF-8 BOM — Excel'in Türkçe Derdi

Excel, BOM'suz UTF-8 CSV'yi açınca Türkçe karakterleri (ş, ğ, ı, ç) bozabilir — kodlamayı yanlış tahmin eder. Çözüm: dosyanın başına 3 byte **BOM** (`EF BB BF`) koymak. Excel bunu görünce "bu UTF-8" der, doğru açar. Logo/Mikro de BOM'u sorun etmez.

`CsvBuilder.Build` string'i UTF-8'e çevirip başına BOM byte'larını ekliyor (`Buffer.BlockCopy` ile birleştirme). Terminalde "Biçer" bozuk *görünebilir* — ama bu BOM hatası değil, terminalin BOM byte'ını gösterme şekli; Excel/Logo'da doğru açılır.

> [!note] BOM nedir? Byte Order Mark — dosyanın başındaki, kodlamayı belirten görünmez işaret. UTF-8 için zorunlu değil ama Excel uyumu için pratikte şart. Testte içeriği kıyaslarken bu 3 byte'ı atlıyoruz (`BodyWithoutBom`).

> [!question] Mülakat Sorusu **"Ürettiğin CSV Excel'de Türkçe karakterleri bozuk açıyor. Neden ve çözüm?"** Cevap: Excel BOM'suz UTF-8'i çoğu zaman yerel/ANSI kodlama sanıp çok-baytlı karakterleri bozar. Çözüm: dosyaya UTF-8 BOM (EF BB BF) eklemek — Excel kodlamayı doğru tanır. Alternatif, kullanıcıya import sırasında kodlama seçtirmek ama BOM en sorunsuz yol.

---

## 4. Tek Uç, İki Senaryo: Filtreyi Yeniden Kullan

Export ucunun imzası `ListOvertimeRecordsQuery` ile **birebir aynı**: `(Guid? userId, DateOnly? from, DateOnly? to)`, hepsi opsiyonel. Böylece "tek personel" ve "tüm ay, herkes" ayrı uçlar değil — **aynı uç**, filtre ver/verme.

Handler liste mantığını tekrar kuruyor (liste handler'ını çağırmıyor) ama **tek fark** bir satır: `.Where(o => o.IsLocked)`. Kilitsiz kayıt "henüz dondurulmamış, değişebilir" demek; bordroya gidemez — Gün 11'de tüm kilit mekanizmasını tam bunu önlemek için kurmuştuk. Export'un kilitsizi dışlaması o kararın doğal devamı.

> [!tip] Liste handler'ını çağırmak yerine sorguyu neden tekrar kurduk? Bağımlılık yaratmamak için. İleride export'a "ücret/tutar" kolonu eklenince liste etkilenmesin; ya da liste sıralaması değişince export bozulmasın. İki handler benzese de bağımsız evrilmeli — kod tekrarından çok **kuplaj** riski daha pahalı.

> [!question] Mülakat Sorusu **"Aynı veriyi hem JSON listede hem CSV export'ta sunuyorsun. Tek mi yoksa iki handler mı?"** Cevap: Genelde iki — çıktı formatı ve ihtiyaçları farklı evrilir (CSV kaçış/kolon, JSON şişme kaygısı, farklı filtre/yetki). Saf/ortak mantık (hesap, kaçış) ayrı servise çekilir ve paylaşılır; handler'lar ince köprü kalır. Tek handler'a iki format sıkıştırmak ileride birini değiştirince diğerini riske atar.

---

## 5. Bir HTTP Yanıtı Nasıl "Dosya" Olur?

Şimdiye kadarki tüm uçlar `Ok(result)` → JSON döndürdü. Dosya indirme aynı mekanizma, üç farkla:

1. **Content-Type:** `text/csv` — "bu JSON değil, tablo".
2. **Content-Disposition:** `attachment; filename="bordro_2026-06-01_2026-06-30.csv"` — `attachment` kelimesi tarayıcıya "ekranda açma, **indir**" der; `filename` inen dosyanın adı.
3. **Gövde:** serializer yok; byte'ları biz kuruyoruz (CsvBuilder).

ASP.NET Core'da `File(bytes, "text/csv", fileName)` üçünü tek satırda paketliyor. Controller sadece bunu çağırıyor.

> [!success] Header kanıtı (curl -D -) `Content-Type: text/csv` + `Content-Disposition: attachment; filename=bordro_2026-06-01_2026-06-30.csv; filename*=UTF-8''bordro_...`. İkinci `filename*=UTF-8''` kısmını framework **kendi** ekledi — RFC 5987, Türkçe karakterli dosya adları için. Bedavaya geldi.

> [!note] Route çakışması yok `records/export` ile `records/{id:guid}` yan yana ama çakışmaz: `export` GUID değil, `{id:guid}` kısıtı onu yakalamaz. Statik route'lar parametreli olanlara göre öncelikli. `/records/export` → export, `/records/<guid>` → detay.

> [!question] Mülakat Sorusu **"Bir API ucundan JSON yerine indirilebilir dosya nasıl döndürürsün?"** Cevap: Yanıtın Content-Type'ını dosya tipine (text/csv, application/pdf...) ayarlarım ve `Content-Disposition: attachment; filename=...` header'ı eklerim — "attachment" tarayıcıya indirmesini söyler. ASP.NET Core'da `File(bytes/stream, contentType, fileName)` helper'ı bunu yapar. Gövde JSON serializer'dan değil, ham byte/stream'den gelir.

---

## 6. Test Stratejisi: Saf Parçayı Çivile

Canlı curl "mutlu yol"u doğruladı (düz isim, çakışma yok). Ama asıl risk **adında virgül olan personel** — onu curl'le üretmek zor, saf testte tek satırda kanıtlanır. 6 yeni test `CsvBuilder`'ın her kuralını çiviliyor:

1. Çıktı UTF-8 BOM ile başlar (Excel uyumu)
2. Basit satır düz yazılır (`,` ayraç, `\r\n` satır sonu)
3. **Virgüllü alan tırnağa alınır** ← asıl bordro-koruyucu
4. Çift tırnaklı alan ikiye katlanır (`"` → `""`)
5. Satır-sonlu alan tırnağa alınır
6. Boş satır listesi sadece başlık yazar (boş bordro patlamaz)

Hepsi DB'siz, kurulumsuz — `CsvBuilder` saf olduğu için. **43 + 6 = 49 yeşil.**

> [!question] Mülakat Sorusu **"Saf fonksiyonu (DB'siz) test etmek neden entegrasyon testinden ucuz ve değerli?"** Cevap: Saf fonksiyon yalnızca girdiye bağlıdır — kurulum (DB, ağ, kullanıcı) yok, hızlı ve kırılgan değil (flaky olmaz). Edge case'leri (virgül, tırnak, boş) tek satır girdiyle tarayabilirsin. Bu yüzden saf mantığı dış bağımlılıktan ayırmak (CsvBuilder) hem tasarımı hem test edilebilirliği iyileştirir.

---

## 7. Bir İsteğin Yolculuğu — Export

```
GET /api/overtime/records/export?from=2026-06-01&to=2026-06-30
  → [Authorize(Roles="Owner,Manager")]
  → ExportOvertimeRecordsQuery(userId?, from?, to?)
  → Handler:
       OvertimeRecords.Where(IsLocked)         ← kilit süzgeci
         + opsiyonel userId/from/to filtreleri
         + Users'a join (FullName)
         + OrderBy(ad, dönem)
       → satırları InvariantCulture ile string'e çevir
       → CsvBuilder.Build(header, rows)         ← kaçış + BOM
       → CsvFileResult(bytes, "bordro_...csv")
  → File(bytes, "text/csv", fileName)           ← Content-Disposition: attachment
```

Yol boyunca otomatik: multi-tenancy (global filter — başka tenant'ın kaydı hiç gelmez), auth, exception→ProblemDetails.

---

## 8. Durum (Gün 12 sonu)

**Yeni dosyalar:**
- `Application/Common/Services/Csv/CsvBuilder.cs` (saf: kaçış + BOM)
- `Application/Features/Overtime/Records/Export/ExportOvertimeRecordsQuery.cs` (+ `CsvFileResult` record)
- `Application/Features/Overtime/Records/Export/ExportOvertimeRecordsHandler.cs`
- `tests/Shift.Tests/CsvBuilderTests.cs` (6 test)

**Değişen:** `OvertimeController.cs` (+`ExportRecords` ucu, +1 using).

**Yeni endpoint:** `GET /api/overtime/records/export` (Owner+Manager) — CSV indirir, sadece kilitli kayıtlar.

**Migration yok** — sadece okuma + biçimlendirme, şema değişmedi.

**Test: 49/49 yeşil** (6 yeni: BOM, düz satır, virgül kaçışı, tırnak katlama, satır-sonu, boş liste).

---

## 9. Sırada Ne Var (Gün 13)

**Açık borçlar (Gün 11'den devam, hâlâ açık):**
- **Ücret/tutar alanları boş** — `AppliedHourlyRate`, `GrossAmount` null. İK modülü + `Position.HourlyRate` bağı gelince dolacak. Geldiğinde CSV'ye "Brüt Tutar" kolonu eklenir (handler'a tek satır, builder değişmez).
- Çarpanlar (gece/hafta sonu/tatil) DB'de hazır ama Calculator okumuyor.
- Tatil takvimi yok.
- Ay/hafta sınırı çakışması (dönem "tam hafta" değilse hesap kenar durumu).

**Olası Gün 13 yönleri:** Excel (.xlsx) export — ClosedXML ile, aynı handler çıktısını farklı formatlayan ince katman; ya da yeni modüle geçiş (spec'ten oku). Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Tek Sorumluluk: CsvBuilder (biçim) / Query (istek) / Handler (köprü) — ayrı değişme sebepleri
- [ ] RFC 4180 kaçışı: virgül/tırnak/satır-sonu → alanı tırnağa al, içteki `"` → `""`
- [ ] InvariantCulture: veri taşımada nokta-ondalık + ISO tarih (yerel ayar CSV'yi böler)
- [ ] UTF-8 BOM: Excel Türkçe karakterleri için (EF BB BF)
- [ ] Tek uç + opsiyonel filtre = "tek personel" ve "tüm ay" ayrı uç değil
- [ ] Export liste mantığını tekrar kurar + tek fark: `.Where(IsLocked)` (bordro güvenliği)
- [ ] Liste handler'ını çağırmamak = kuplajdan kaçınmak (bağımsız evrilsinler)
- [ ] Dosya yanıtı: Content-Type + Content-Disposition: attachment + ham byte gövde
- [ ] `File(bytes, contentType, fileName)` üçünü paketler; `filename*=UTF-8''` framework'ten bedava
- [ ] Statik route (`/export`) parametreli route'tan (`/{id:guid}`) öncelikli — çakışmaz
- [ ] Saf parçayı (CsvBuilder) DB'siz test et — virgüllü ismi tek satırda çivile

#shift #dotnet #backend #faz1 #overtime #bordro #csv #export #clean-architecture #rfc4180