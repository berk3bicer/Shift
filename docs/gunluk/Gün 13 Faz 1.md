# Shift — Gün 13: Bordroyu Liraya Bağlama (Ücret + Brüt Hesabı)

> [!info] Bugünün hedefi Gün 11-12'de saat bazlı çalışan bordroyu **paraya** bağlamak. Şimdiye kadar `OvertimeRecord` saat üretiyordu ama `GrossAmount` boştu — lirasız bordro yarım bordro. Bugün: `User.PositionId` (personele birincil pozisyon) → Calculator brüt hesabı (`normal×ücret + fazla×ücret×1.5`) → Close handler ücreti snapshot'a yazsın → CSV'ye "Brüt Tutar" kolonu → testler. Açık borç kapatıldı.

**Tarih:** 24 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 13 %100 tamamlandı — 52/52 test yeşil

---

## 1. Ücret Nereden Gelir? (Modelleme Kararı)

Bordroda saat ücreti **personelin pozisyonundan** gelir — `Position.HourlyRate`. Ama bir gerçekle yüzleştik: `User`'da `PositionId` **yoktu**. Pozisyon sadece `Shift` (vardiya) üzerinde yaşıyordu (`Shift.PositionId`). Yani model "personelin bir pozisyonu" diye bir kavram tanımlamıyordu — pozisyon kişinin değil, vardiyanın özelliğiydi.

İki seçenek vardı:
- **A) `User`'a `PositionId` ekle** (basit; personelin "birincil pozisyonu", ücret oradan).
- **B) Ücreti vardiyalardan türet** (her vardiyayı kendi pozisyon ücretiyle çarp; çok-pozisyonlu için doğru ama karmaşık).

**Karar: A.** Gerekçe: personele birincil pozisyon vermek İK modülünün (spec Modül 7, Faz 3) zaten yapacağı şey; küçük/temiz migration; bordro mantığını basit tutar. Çok-pozisyonlu ücret gerçek ihtiyaç doğunca B'ye geçilir — şu an **YAGNI**.

> [!note] İsimlendirme tuzağı Seçenekleri sunarken "basit" dediğim A aslında bir migration + yeni kavram gerektiriyordu; "karmaşık" dediğim B ise mevcut `Shift.PositionId` ile migration'sız çalışabilirdi. "Basit/karmaşık" kavramsal modeli anlatır, implementasyon maliyetini değil. Yine de A doğru karar — gelecekteki İK ihtiyacıyla örtüşüyor.

> [!question] Mülakat Sorusu **"Bir değeri (ör. ücret) entity'ye doğrudan mı, yoksa ilişkili tablodan türeterek mi bağlarsın?"** Cevap: Değer kararlı ve kişiye/varlığa ait bir özellikse doğrudan bağ (FK) basittir ve performanslıdır. Değer bağlama bağlı değişiyorsa (ör. her vardiyada farklı pozisyon ücreti) türetme daha doğru ama karmaşıktır. Karar, "bu varlığın tek bir doğal değeri var mı, yoksa bağlama mı bağlı?" sorusuna dayanır. Önce basit bağ, gerçek ihtiyaç doğunca türetmeye geç (YAGNI).

---

## 2. `User.PositionId` — Nullable + SetNull

Eklenen alan **nullable** (`Guid?`): bir personel davet edilmiş ama pozisyon atanmamış olabilir. FK ilişkisi `OnDelete(SetNull)`:

```csharp
modelBuilder.Entity<User>()
    .HasOne(u => u.Position)
    .WithMany()
    .HasForeignKey(u => u.PositionId)
    .OnDelete(DeleteBehavior.SetNull);
```

> [!important] Neden SetNull, Cascade değil? Bir pozisyon silinirse o pozisyondaki personeller **silinmemeli** — sadece `PositionId`'leri null'a düşmeli. Cascade olsaydı "Barista pozisyonunu sildim, 5 personel uçtu" felaketi olurdu. FK nullable olduğu için SetNull doğal eşleşme.

Migration tek kolon + index + FK: `Users.PositionId` (uuid, nullable), `IX_Users_PositionId`, `FK_Users_Positions_PositionId (SetNull)`.

> [!question] Mülakat Sorusu **"Bir FK silme davranışını (Cascade / SetNull / Restrict) neye göre seçersin?"** Cevap: Bağımlı kaydın "ebeveynsiz" anlamı varsa SetNull (nullable FK gerekir) — kayıt yaşar, bağ kopar. Bağımlı kayıt ebeveyni olmadan anlamsızsa Cascade (ebeveynle birlikte silinir). Silmeyi tümden engellemek istiyorsak Restrict. Para/personel gibi kaybı pahalı kayıtlarda asla Cascade kullanılmaz — SetNull veya Restrict tercih edilir.

---

## 3. Brüt Hesabı — null ≠ 0 (Tasarımın Kalbi)

Calculator'a eklenen formül:

```
Brüt = (NormalSaat × SaatÜcreti) + (FazlaMesaiSaat × SaatÜcreti × Çarpan)
```

Çarpan `OvertimeSettings.OvertimeMultiplier` (varsayılan 1.5 = İş Kanunu %50 zam). Bu turda sadece fazla mesai çarpanı; gece/hafta sonu/tatil çarpanları DB'de duruyor ama `1.0` (etkisiz).

**En kritik karar: ücret tanımsızsa brüt = `null`, `0` DEĞİL.** Personelin pozisyonu yoksa ya da pozisyonun `HourlyRate`'i null'sa, `AppliedHourlyRate`/`OvertimeMultiplier`/`GrossAmount` üçü de null döner.

> [!important] Neden null, sıfır değil? `0` "bu personel bedava çalıştı" der — yanlış bilgi. `null` "ücret tanımlı değil, hesaplanamadı" der — doğru. Bordroda boş hücre yöneticiye "bu personelin ücretini gir" sinyali verir; `0.00` eksiği gizler ve sessizce yanlış ödemeye yol açar. Finansal veride "bilinmiyor" ile "sıfır" asla karıştırılmaz.

```csharp
decimal? appliedRate = user.HourlyRate;
decimal? grossAmount = null;
if (appliedRate is { } rate)   // ücret VARSA hesapla
{
    var normalPay = totalNormal * rate;
    var overtimePay = totalOvertime * rate * overtimeMultiplier;
    grossAmount = RoundMoney(normalPay + overtimePay);
}
// ücret YOKSA grossAmount null kalır
```

> [!question] Mülakat Sorusu **"Bir hesabın girdisi eksikse sonucu 0 mı yoksa null mı dönersin? Neden?"** Cevap: null — "hesaplanamadı/bilinmiyor" ile "sonuç sıfır" farklı anlamlardır. 0 döndürmek eksik veriyi geçerli bir sonuç gibi gösterir ve sessiz hataya yol açar (ör. ödenmemesi gereken 0 TL bordroya geçer). null, eksikliği görünür kılar ve çağıran tarafı bilinçli karar vermeye zorlar. Finansal/kritik hesaplarda bu ayrım şarttır.

---

## 4. EF Core'da Nullable Navigation Üzerinden Okuma

Calculator personeli çekerken pozisyon ücretini de alıyor — ama pozisyon null olabilir:

```csharp
.Select(u => new
{
    u.FullName,
    HourlyRate = u.Position != null ? u.Position.HourlyRate : null
})
```

Bu LINQ, SQL'e **`LEFT JOIN Positions`** olarak çevrilir. Pozisyon yoksa null, varsa `HourlyRate` (o da nullable). Çift-nullable'ı (`Position?` → `HourlyRate?`) EF doğru handle eder. `Include` kullanmadık — sadece ihtiyacımız olan tek alanı projection ile çektik (hafif sorgu).

> [!tip] Neden Include değil projection? `Include(u => u.Position)` tüm Position entity'sini belleğe getirir. Bize sadece `HourlyRate` lazım. Projection (`Select`) tek kolonu çeker — daha az veri, daha hızlı. "İhtiyacın olanı çek" prensibi.

> [!question] Mülakat Sorusu **"EF Core'da ilişkili bir tablodan tek alan lazımsa Include mı projection mı?"** Cevap: Projection (`Select`). Include navigation'ın tüm entity'sini yükler; sadece bir-iki alan gerekiyorsa bu israftır. `Select` ile yalnızca gereken kolonlar SQL'e yansır (genelde LEFT JOIN + seçili kolonlar), bellek ve ağ yükü düşer. Include, entity'nin tamamıyla çalışacaksan (değiştirip kaydedeceksen) anlamlıdır.

---

## 5. Ücret de Snapshot — Donmuş Lira (Gün 11 Felsefesinin Devamı)

Close handler artık ücreti de `OvertimeRecord`'a yazıyor: `AppliedHourlyRate`, `OvertimeMultiplier`, `GrossAmount`. Bu, saatlerin donması kadar kritik.

Kapanış anında pozisyon ücreti 100 TL ise `AppliedHourlyRate=100` olarak **donar**. Yarın pozisyon ücreti 120'ye çıksa bile bu kapanmış bordro 100'de kalır. Eğer ücreti her okumada `Position`'dan canlı çekseydik, geçmiş bordro geriye dönük değişirdi — "ödediğim maaş kımıldadı" felaketi.

> [!important] Snapshot prensibi tekrar Gün 11: saatler donar. Gün 13: ücret de donar. Genel kural — bir karara/ödemeye temel olan TÜM girdiler kapanış anında snapshot alınır. Sadece sonuç (brüt) değil, hesabın girdileri de (saat ücreti, çarpan) saklanır ki "bu rakam neden böyle?" sorusu sonradan cevaplanabilsin (denetim/itiraz).

> [!question] Mülakat Sorusu **"Bir hesabın sonucunu snapshot'lıyorsun. Girdilerini de saklamalı mısın?"** Cevap: Evet, kritik girdileri de. Sadece sonucu saklarsan "bu tutar nasıl çıktı?" sorusunu cevaplayamazsın; kaynak veri (ücret, çarpan, oran) değişmişse sonucu doğrulayamazsın. Denetlenebilirlik için: sonuç + onu üreten girdiler birlikte dondurulur. Bordro, fatura, vergi hesaplarında standart.

---

## 6. CSV: Brüt Kolonu — Builder'a Dokunmadan

CSV'ye "Brut Tutar" kolonu eklendi ama `CsvBuilder` **hiç değişmedi**. Sadece handler: select'e `GrossAmount`, başlığa kolon, satıra değer. Bu, Gün 12'deki "builder saf, handler kolonu bilir" ayrımının meyvesi — kolon eklemek tek dosyalık iş oldu.

Brüt null ise CSV'de **boş hücre** (`""`), `0.00` değil — Calculator'daki null≠0 kararının CSV'deki yansıması.

```csharp
x.GrossAmount?.ToString("0.00", ci) ?? ""
```

> [!success] Canlı kanıt (curl) `Brut Tutar` kolonu doldu: 0.01 saat × 100 TL = **1.00 TL**. Formül uçtan uca çalışıyor: ücret pozisyondan → Calculator brütü hesapladı → snapshot'a yazıldı → CSV'de göründü. Kolon hizası doğru (8 başlık, 8 alan).

---

## 7. Test Stratejisi: 3 Yeni Senaryo

`OvertimeCalculatorTests`'e eklenen, ücreti çivileyen testler:

1. **Ücretli, fazla mesai yok** → brüt = 40 × 100 = 4000
2. **Ücretli, fazla mesaili** → 45×100 + 9×100×1.5 = 4500 + 1350 = **5850** (çarpansız olsaydı 5400 çıkardı — çarpanı çivileyen test)
3. **Ücretsiz personel** → `AppliedHourlyRate`, `OvertimeMultiplier`, `GrossAmount` hepsi **null**; saatler yine de hesaplanır

Test 2 çarpanın gerçekten 1.5 ile çarptığını, Test 3 null≠0 tasarımını koruyor. Biri gelip "null yerine 0 dönsün" diye değiştirirse Test 3 kırmızı yanar.

> [!question] Mülakat Sorusu **"Bir çarpan/oran uygulayan hesabı nasıl test edersin?"** Cevap: Çarpanın etkisini izole eden bir senaryo kurarım — çarpansız ve çarpanlı sonuç farklı olmalı (5400 vs 5850). Sadece "sonuç 5850" demek yetmez; çarpan yanlışlıkla 1.0 olsa bile başka bir test geçebilir. Sınır durumu (tam eşik, eşik altı/üstü) ve eksik girdi (ücret yok → null) ayrı testlerle çivilenir.

---

## 8. Durum (Gün 13 sonu)

**Değişen dosyalar:**
- `Domain/Entities/User.cs` — `PositionId` (nullable) + `Position` navigation
- `Infrastructure/Persistence/ShiftDbContext.cs` — User→Position FK (SetNull)
- `Application/Common/Services/Overtime/OvertimeResult.cs` — `StaffOvertimeSummary`'ye 3 ücret alanı
- `Application/Common/Services/Overtime/OvertimeCalculator.cs` — brüt hesabı
- `Application/Features/Overtime/Close/CloseOvertimePeriodHandler.cs` — ücret snapshot'ı (iki dal)
- `Application/Features/Overtime/Records/Export/ExportOvertimeRecordsHandler.cs` — "Brut Tutar" kolonu
- `tests/Shift.Tests/OvertimeCalculatorTests.cs` — 3 yeni test

**Migration:** `AddUserPosition` (Users.PositionId + index + FK SetNull).

**Test: 52/52 yeşil** (49 + 3 yeni: ücretli/fazla mesaili/ücretsiz).

---

## 9. Açık Borçlar ve Sırada Ne Var (Gün 14)

> [!warning] Bu turda açılan yeni açık borç **Personele pozisyon atama ucu YOK.** `User.PositionId`'yi ekledik ama onu set eden endpoint yazmadık — testte `psql` ile elle atadık. Bu **bilinçli**: personele pozisyon/profil atama spec'te İK modülü (Modül 7, Faz 3) işi. Faz 1'de bordro hesabını bitiriyoruz; atama ucu İK modülünde doğal yerinde gelecek. O gelene kadar pozisyon ataması manuel (DB).

**Gün 11'den devam eden açık borçlar:**
- Gece/hafta sonu/tatil çarpanları DB'de hazır ama Calculator okumuyor (sadece fazla mesai çarpanı aktif).
- Türkiye resmi tatil takvimi yok.
- Ay/hafta sınırı çakışması (dönem "tam hafta" değilse kenar durumu).

**Olası Gün 14 yönleri:** (a) Excel (.xlsx) export — ClosedXML, aynı handler çıktısını farklı formatlayan ince katman; (b) gece/hafta sonu çarpanlarını Calculator'a bağlama; (c) yeni MVP modülü: Görev (Kanban) — taze modül, demo'nun ikinci ayağı. Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Ücret pozisyondan: `User.PositionId` → `Position.HourlyRate` (basit bağ, YAGNI)
- [ ] Nullable FK + `OnDelete(SetNull)`: pozisyon silinince personel yaşar, bağ kopar
- [ ] Brüt = normal×ücret + fazla×ücret×çarpan (çarpan ayardan, varsayılan 1.5)
- [ ] **null ≠ 0**: ücret tanımsızsa brüt null — "bilinmiyor" ≠ "sıfır" (eksiği gizleme)
- [ ] EF nullable navigation: `u.Position != null ? u.Position.HourlyRate : null` → LEFT JOIN
- [ ] Projection > Include: tek alan lazımsa entity'nin tamamını çekme
- [ ] Ücret de snapshot: kapanışta ücret+çarpan donar (sonuç değil, girdiler de saklanır)
- [ ] CSV kolonu eklemek = handler işi, CsvBuilder dokunulmaz (Gün 12 ayrımının meyvesi)
- [ ] Çarpan testi: çarpansız vs çarpanlı sonuç farkı (5400 vs 5850) ile çivile
- [ ] Açık borç: pozisyon atama ucu İK modülüne (Faz 3) bırakıldı — şimdilik manuel

#shift #dotnet #backend #faz1 #overtime #bordro #ucret #snapshot #ef-core #clean-architecture