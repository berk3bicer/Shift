# Shift — Gün 14: Gece & Hafta Sonu Primi (Çarpanları Calculator'a Bağlama)

> [!info] Bugünün hedefi Gün 11-13'te bordro saat → fazla mesai → brüt zincirini kurduk ama `OvertimeSettings`'teki **gece** ve **hafta sonu** çarpanları DB'de duruyor, Calculator okumuyordu — "yarım yasal bordro". Bugün İş Kanunu tarafını tamamladık: Calculator çarpanları okur, **vardiya bazında** gece/hafta sonu bayrağı koyar, **differential (prim)** olarak brüte ekler → snapshot → CSV. Resmi tatil çarpanı hâlâ açık (takvim yok); gece limiti gibi yasal denetimler kapsam dışı (basit model, Berke tercihi).

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 14 %100 tamamlandı — 58/58 test yeşil

---

## 1. En Kritik Karar: Çarpan Neye Uygulanır — Kısmi mi, Tüm Vardiya mı?

Bir vardiya 18:00–22:00 ve gece penceresi 20:00–06:00. İki saat (20–22) geceye düşüyor. Soru: gece çarpanı sadece **o iki saate** mi uygulanır, yoksa **vardiyanın tüm dört saatine** mi?

**Karar: TÜM vardiyaya (Berke).** Vardiya gece penceresine bir dakika bile değiyorsa, o vardiyanın tüm saatleri "gece" sayılır. Hafta sonu için de aynı: check-in günü Cmt/Pzr ise vardiyanın tamamı "hafta sonu".

Gerekçe: basit, açıklanabilir, MVP'ye uygun. Kısmi (dakika dakika kesişim) model daha "adil" ama hesap karmaşıklaşır ve bordroyu açıklamak zorlaşır. Gerçek ihtiyaç doğunca kısmi modele geçilir — şimdilik **YAGNI**.

> [!note] Tespit (detection) ≠ uygulama (application) Bu iki ayrı karar: (1) bir vardiya "gece vardiyası" MI? → pencereye değiyor mu (tespit). (2) Öyleyse çarpan KAÇ saate? → tümüne (uygulama). Berke'nin cevabı uygulamayı çözdü (tümüne); tespit için "değme" (overlap) kuralını seçtik.

> [!question] Mülakat Sorusu **"Bir kural 'kısmen' tetiklenebiliyorsa (vardiyanın bir kısmı gece), etkiyi kısma mı yoksa tümüne mi yayarsın?"** Cevap: Ürün kararına bağlı; ikisi de geçerli ama **tespit ile uygulamayı ayır**. Basit/açıklanabilir bordro için "değdiyse tümü" yeterlidir (whole-shift). Adalet/yasal hassasiyet gerekiyorsa kısmi kesişim hesaplanır. Önce basit kuralı netleştir, müşteri itiraz edince incelt — erken optimizasyon yapma.

---

## 2. Differential (Prim) Modeli: Çarpanı "Üste Ekleme"

Çarpanı brüte bağlamanın iki yolu var:

- **A) Rate replace:** gece saatleri `ücret × çarpan` ile ödenir (taban yerine geçer).
- **B) Differential (prim):** taban ücret normal ödenir, üstüne `ücret × (çarpan−1)` **prim** eklenir.

İkisi matematiksel olarak aynı tabanı verir (`8×100×1.5 = 8×100 + 8×100×0.5`), ama **B'yi seçtik**. Formül:

```
prim        = primli_vardiya_saati × ücret × (çarpan − 1)
brüt        = (normal×ücret + fazla×ücret×fazlaÇarpan)  ← taban
            + gecePrim + haftaSonuPrim                  ← primler
```

B'nin üç üstünlüğü:
1. **Geriye uyumluluk:** çarpan 1.0 (varsayılan) iken `(1.0−1)=0` → prim 0 → brüt değişmez. Gün 13'ün 8 testi **tek satır değişmeden yeşil** kaldı.
2. **Eksen ayrımı:** fazla mesai "ne kadar çalıştın" (haftalık), prim "ne zaman çalıştın" (vardiya). İki bağımsız eksen → toplanır, çakışmaz. Gece + hafta sonu + fazla mesai hepsi ayrı kalem, üst üste biner.
3. **Denetlenebilirlik:** prim ayrı bir lira kalemi → bordroda "neden bu kadar?" sorusunun cevabı görünür (CSV'de Gece Primi / Hafta Sonu Primi kolonları).

> [!important] Çarpan 1.0 = "kapalı" anahtarı `(çarpan−1)` ifadesi, varsayılan çarpan 1.0'ı doğal bir "özellik kapalı" anahtarına çevirir. Yeni davranış default'ta etkisiz → mevcut hesaplar bozulmaz. Bir özelliği "katkı = 0 nötr eleman" üzerinden eklemek, geriye uyumluluğun temiz yoludur.

> [!question] Mülakat Sorusu **"Mevcut bir hesaba yeni bir çarpan/bileşen eklerken eski sonuçları nasıl korursun?"** Cevap: Yeni bileşeni toplamsal nötr elemanı (0) üzerinden eklerim — varsayılan ayarda katkısı 0 olsun (ör. `çarpan−1`, çarpan default 1.0). Böylece davranış opt-in olur; var olan veriler/testler değişmez. Bileşeni ayrı kalem olarak da saklarım ki sonuç ayrıştırılabilsin (audit + reconcile).

---

## 3. Gece Penceresini Tespit: Gece Yarısını Saran Aralık

Gece penceresi (20:00–06:00) **gün-içi tekrar eder** ve **gece yarısını sarar**. Vardiya `[in, out)` ile kesişiyor mu? Saf "endpoint gece mi?" kontrolü yetmez — vardiya tüm pencereyi içine alırsa (19:00→07:00) iki uç da pencere dışında ama vardiya geceyi kapsıyor.

Çözüm: vardiyanın kapsadığı her takvim günü için o günün gece aralık(lar)ını üret, `[in,out)` ile kesişim ara. Sarma varsa gün iki parçaya bölünür:

```
nightStart < nightEnd → tek aralık [gün+start, gün+end)              (ör. 00:00–06:00)
nightStart > nightEnd → AKŞAM [gün+start, ertesi 00:00) + SABAH [gün 00:00, gün+end)
```

Kesişim testi standart: `in < end && start < out`. Bir dakika bile kesişiyorsa "gece vardiyası" → tüm saat primli.

> [!tip] Saat-of-day duvar saati varsayımı TimeClock UTC saklar ama gece penceresi "20:00 yerel" kavramı. Tek-bölge (Türkiye) MVP'de saklanan saatin saat-bileşenini duvar saati gibi okuyoruz — kod genelindeki kalıpla tutarlı bir basitleştirme. Çok-bölge gelince timezone dönüşümü eklenir (Faz sonrası).

> [!question] Mülakat Sorusu **"Gece yarısını saran bir zaman aralığıyla (20:00–06:00) kesişim nasıl hesaplanır?"** Cevap: Aralığı sarma noktasında ikiye bölerim — akşam parçası [start, 24:00) ve sabah parçası [00:00, end). Her gün için bu parçaları üretip vardiya aralığıyla yarı-açık kesişim (`in < end && start < out`) testi yaparım. Uç-nokta kontrolü ("başlangıç gece mi?") yetmez: vardiya pencereyi tümüyle içerebilir; aralık-kesişimi gerekir.

---

## 4. Hafta Sonu: Hangi Gün? Check-in Kararı

Cmt 23:00 → Pzr 03:00 vardiyası hangi güne ait? **Check-in gününe** (Cumartesi). Karar: vardiyanın günü başlangıç tarihinden belirlenir; gece yarısını aşsa da "başladığı gün" esas. Basit, deterministik, açıklanabilir. Cmt/Pzr ise tüm vardiya hafta sonu primli.

> [!question] Mülakat Sorusu **"Gün sınırını aşan bir olayı (vardiya) hangi güne sayarsın?"** Cevap: Tek bir deterministik çapa seçerim — genelde başlangıç (check-in). Tutarlılık doğruluktan önce gelir: aynı kuralı her yerde uygula ki toplamlar çift saymasın/eksik kalmasın. Sınır vakası (Cmt gecesi Pzr'a taşması) dokümante edilir; gerekirse kural sonradan rafine edilir.

---

## 5. Prim de Snapshot — Çarpanı Değil, Etkisini Dondur

Close handler artık `NightPremium` ve `WeekendPremium`'u da `OvertimeRecord`'a yazıyor (Gün 11/13 snapshot felsefesinin devamı). İlginç tasarım inceliği: **çarpanın kendisini saklamadık, primin lira tutarını sakladık.**

Gerekçe: prim tutarı (`saat × ücret × (çarpan−1)`) zaten çarpanın etkisini içinde dondurur. Ayar sonradan değişse de kapanmış bordrodaki prim sabit kalır. Çarpanı ayrıca saklamak gereksiz kolon — tutar, etkinin tam fotoğrafı.

> [!important] "Girdi mi sonuç mu" dengesinin nüansı Gün 13'te "girdileri de sakla" dedik (ücret + çarpan). Burada prim tutarı hem **bir sonuç** (lira) hem de çarpanın etkisinin **donmuş hâli**. Tek bir tutar, çarpanın o andaki etkisini ne kadar değişirse değişsin korur → ayrı çarpan kolonu YAGNI. Snapshot'ın amacı "geçmişi sabitle"; bunu sağlayan en küçük alan kümesi yeterli.

> [!question] Mülakat Sorusu **"Bir çarpanın uygulandığı tutarı snapshot'larken çarpanı ayrıca saklar mısın?"** Cevap: Şart değil — eğer sakladığın tutar çarpanın etkisini zaten donduruyorsa (tutar = taban × çarpan etkisi), ayrı çarpan kolonu fazlalıktır. Çarpanı ayrıca saklamak yalnızca onu bağımsız raporlamak/yeniden hesaplamak gerekiyorsa anlamlı. Minimal ama yeterli snapshot ilkesi: geçmişi sabitleyen en küçük alan kümesi.

---

## 6. CSV: İki Yeni Kolon, Builder Yine Dokunulmadı

Export handler'a `Gece Primi` ve `Hafta Sonu Primi` kolonları eklendi — sıra: saatler → primler → brüt (kalemler brütten önce, okuyucu toplamı görsün). `CsvBuilder` **yine değişmedi** (Gün 12/13 ayrımının meyvesi). Primler null ise boş hücre (`""`), `0.00` değil — null≠0 CSV'ye yansıyor.

Brüt kalemlerden toplanıyor (`taban + gecePrim + haftaSonuPrim`, her biri yuvarlanmış) → **CSV'de prim kolonları + brüt birbirini tutar** (reconcile). Çift-yuvarlama kayması yok çünkü gösterilen kalemlerden topluyoruz.

> [!question] Mülakat Sorusu **"Toplam = kalemler ilişkisini bir tabloda nasıl garanti edersin (yuvarlama)?"** Cevap: Toplamı, gösterilen (yuvarlanmış) kalemlerden hesaplarım — ham değerlerden ayrı yuvarlayıp toplamı bağımsız yuvarlamam. Aksi halde "kalemler 3.33+3.33+3.33 ama toplam 10.00" tutarsızlığı çıkar. Kullanıcının gördüğü satırlar kendi içinde toplanmalı.

---

## 7. Test Stratejisi: 6 Yeni Senaryo

`OvertimeCalculatorTests`'e eklenenler (her biri bir kuralı izole çiviler):

1. **Hafta sonu, tüm saate prim** → Cmt 8s × (2.0−1) = 800 prim, brüt 1600
2. **Gece, değen vardiya** → 18:00–22:00 (4s, 20–22 değer) tümü gece = 200 prim; aynı dönemdeki gündüz vardiyası prim almaz
3. **Gece yarısını saran** → 22:00→06:00 tamamı gece (sarma testi)
4. **Stack** → Cmt 20:00–24:00: gece 200 + hafta sonu 400 toplanır, brüt 1000
5. **Çarpan 1.0 → prim 0 (null değil)** → geriye uyumluluk + null≠0 (ücret var, prim yok)
6. **Ücretsiz personel → primler null** → ücret yoksa saat hesaplanır ama prim/brüt null

Test 5 hem mevcut 8 testin neden bozulmadığını açıklar (default 1.0 → 0) hem de null≠0 ayrımını prim seviyesinde korur. Test 3 gece yarısı sarma mantığını çiviler — biri overlap mantığını basit endpoint kontrolüne indirgerse kırmızı yanar.

> [!question] Mülakat Sorusu **"Opt-in bir özelliği eklerken hangi testi mutlaka yazarsın?"** Cevap: "Kapalı (default) durumda eski davranış aynen korunuyor" testini — yeni bileşenin nötr ayarda etkisiz olduğunu kanıtlar. Sonra açık durumda etkinin doğru büyüklüğünü ve sınır vakalarını (sarma, eksik girdi → null) izole testlerle çiviler.

---

## 8. Durum (Gün 14 sonu)

**Değişen dosyalar:**
- `Domain/Entities/OvertimeSettings.cs` — gece/hafta sonu yorumları "tüm vardiya" kararına güncellendi
- `Domain/Entities/OvertimeRecord.cs` — `NightPremium`, `WeekendPremium` (snapshot) + stale yorum düzeltildi
- `Application/Common/Services/Overtime/OvertimeResult.cs` — summary'ye 2 prim alanı
- `Application/Common/Services/Overtime/OvertimeCalculator.cs` — çarpan okuma + vardiya bazlı prim + `TouchesNightWindow`/`NightIntervals`/`IsWeekendShift` helper'ları
- `Application/Features/Overtime/Close/CloseOvertimePeriodHandler.cs` — prim snapshot (iki dal)
- `Application/Features/Overtime/Records/Export/ExportOvertimeRecordsHandler.cs` — 2 CSV kolonu
- `Infrastructure/Persistence/ShiftDbContext.cs` — prim precision (12,2)
- `tests/Shift.Tests/OvertimeCalculatorTests.cs` — 6 yeni test

**Migration:** `AddOvertimePremiums` (OvertimeRecords.NightPremium + WeekendPremium, nullable numeric(12,2)). DB'ye uygulandı.

**Test: 58/58 yeşil** (52 + 6 yeni).

---

## 9. Açık Borçlar ve Sırada Ne Var (Gün 15)

> [!warning] Hâlâ açık (bu turda kapatılmadı) **Resmi tatil çarpanı** Calculator'a bağlanmadı — `HolidayMultiplier` DB'de var ama Türkiye resmi tatil **takvimi yok**. Tatil tespiti takvim tablosu gerektiriyor (gece/hafta sonu gibi saatten türetilemez). Bu yüzden bilinçli olarak ayrı bir iş: önce tatil takvimi (sabit + dini bayram), sonra çarpan.

**Devam eden açık borçlar:**
- Türkiye resmi tatil takvimi yok → tatil çarpanı bağlanamıyor.
- Gece penceresi UTC saat-bileşenini duvar saati varsayıyor (çok-bölge desteği yok).
- Ay/hafta sınırı çakışması (dönem "tam hafta" değilse kenar durumu).
- Personele pozisyon atama ucu yok (İK modülü, Faz 3 — şimdilik psql).

**Olası Gün 15 yönleri:** (a) Excel (.xlsx) export — ClosedXML, aynı handler çıktısını farklı formatlayan ince katman; (b) yeni MVP modülü: Görev (Kanban) — taze modül, spec Modül 2, demo'nun ikinci ayağı; (c) Tatil takvimi + tatil çarpanı (TR'ye özgü, ama daha büyük iş). Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Çarpan **tüm vardiyaya** uygulanır (kısmi değil) — değdiyse tümü gece/hafta sonu
- [ ] Tespit ≠ uygulama: "gece vardiyası mı?" (overlap) ayrı, "kaç saate?" (tümüne) ayrı karar
- [ ] **Differential model**: prim = saat × ücret × (çarpan−1), tabanın ÜSTÜNE eklenir
- [ ] Çarpan 1.0 → prim 0 → geriye uyumlu (nötr eleman üzerinden opt-in)
- [ ] Gece yarısı sarma: aralığı akşam/sabah parçasına böl, yarı-açık kesişim testi
- [ ] Hafta sonu = check-in günü Cmt/Pzr (deterministik çapa)
- [ ] Prim de snapshot — çarpanı değil, primin lira etkisini dondur (minimal yeterli snapshot)
- [ ] Brüt = gösterilen kalemlerden topla → CSV reconcile (çift yuvarlama yok)
- [ ] null ≠ 0 prim seviyesinde: ücret yok → null, çarpan 1.0 → 0
- [ ] Açık borç: tatil çarpanı takvim bekliyor (saatten türetilemez)

#shift #dotnet #backend #faz1 #overtime #bordro #gece-primi #hafta-sonu #snapshot #ef-core #clean-architecture
