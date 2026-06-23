# Shift — Gün 11: OvertimeRecord Kalıcılaştırma + Dönem Kapanış / Kilit / Unlock

> [!info] Bugünün hedefi Mesai hesabını **uçucu** olmaktan çıkarıp **donmuş bordro kaydına** çevirmek. Calculator (Gün 10) her çağrıldığında TimeClock'tan yeniden hesaplıyordu — bordro bunu kaldıramaz. Bugün: `OvertimeRecord` entity → dönem kapanış akışı (hesapla → dondur → kilitle) → audit'li kilit açma (unlock) → kilitsiz kayda yeniden yazma (recalculate) → okuma uçları (liste + detay). Haftalık kırılım `jsonb` snapshot olarak gömülü.

**Tarih:** 23 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), FluentValidation, xUnit **Durum:** ✅ Gün 11 %100 tamamlandı — 43/43 test yeşil

---

## 1. Neden Kalıcı Bir Kayıt? (Uçucu Hesap vs. Donmuş Snapshot)

Gün 10'daki `OvertimeCalculator` **saf hesap servisiydi**: TimeClock kayıtlarını okur, İş Kanunu'na göre haftalık 45s eşiğiyle mesai üretir, hiçbir şey yazmaz. Her çağrıldığında **sıfırdan yeniden hesaplar**.

Bu, "anlık görüntü" için mükemmel ama bordro için **tehlikeli**: geçmişe dönük bir TimeClock kaydı değişirse (düzeltme, eksik giriş eklenmesi), Calculator'ın sonucu da değişir. Oysa "Haziran mesaisini ödedim" dendiğinde o rakam **DONMALI** — sonradan kımıldamamalı.

||Calculator (Gün 10)|OvertimeRecord (Gün 11)|
|---|---|---|
|Doğa|Uçucu (her seferinde yeniden hesap)|Kalıcı (kapanışta donar)|
|Yazar mı?|Hayır, sadece okur|Evet, DB'ye yazılır|
|Değişir mi?|Kaynak veri değişince evet|Hayır (kilitliyken sabit)|
|Amaç|Anlık görüntü / önizleme|Bordro / denetim / ödeme|

> [!important] Çekirdek fikir **OvertimeSettings** = ayar (çarpanlar). **OvertimeCalculator** = anlık hesap (saf, yazmaz). **OvertimeRecord** = o hesabın kapanışta alınmış FOTOĞRAFI (kalıcı, kilitlenebilir, denetlenebilir).

> [!question] Mülakat Sorusu **"Bir değeri her seferinde yeniden hesaplamak yerine ne zaman kalıcı olarak saklarsın (snapshot)?"** Cevap: Değer bir karara/ödemeye/sözleşmeye temel oluşturuyorsa ve kaynak veri sonradan değişebiliyorsa. Bordro, fatura, sipariş toplamı gibi alanlarda "hesaplanan an"daki değer dondurulur (snapshot) — yoksa geçmiş bir düzeltme ödenmiş bir rakamı geriye dönük bozar. Anlık/önizleme amaçlı değerlerde ise her seferinde hesaplamak doğru (taze veri).

---

## 2. Granülerlik Kararı: Dönem Başına Tek Kayıt + JSON Snapshot

İş Kanunu fazla mesaiyi **haftalık** hesaplar (Calculator'ın tüm tasarımı buna dayalı). Ama spec OvertimeRecord'u **dönem** ("ay") birimiyle tanımlıyor. Gerilim: hesap birimi hafta, saklama/bordro birimi dönem.

**Çözüm — hybrid:** Kayıt **dönem başına tek satır** (spec'e uyar, bordro satırıyla birebir). Haftalık kırılım kaybolmasın diye **aynı satırın içinde `jsonb` kolonunda** snapshot olarak durur (`Weeks`).

> [!note] Neden ayrı `OvertimeRecordWeek` tablosu değil de JSON? Bu veri **donmuş bir snapshot** — kapanış anının fotoğrafı. Üzerinde sorgu/join/filtre yapılmaz (kilitli, değişmez). Sorgulanmayan, hep birlikte okunan, değişmeyen alt-veri için ayrı tablo + FK + join fazladan karmaşıklıktır. PostgreSQL `jsonb` + EF Core `OwnsMany(...).ToJson()` tam bu senaryo için var. (İleride "tüm tenant'larda 3. haftası 50s+ olanları bul" gibi cross-record sorgu gerekirse o zaman normalize edilir — ama o ihtiyaç yok: **YAGNI**.)

> [!question] Mülakat Sorusu **"İlişkili veriyi ne zaman ayrı tabloya, ne zaman JSON kolonuna koyarsın?"** Cevap: Üzerinde bağımsız sorgu/filtre/join yapacaksam, ya da yaşam döngüsü ayrıysa → ayrı tablo + FK. Hep birlikte okunan, değişmeyen, kendi başına sorgulanmayan (özellikle snapshot/audit) veri için → JSON kolonu. JSON; join yükünü ve şema karmaşıklığını azaltır ama sorgulanabilirlikten feragat eder. Karar, "bu veriyi tek başına sorgulayacak mıyım?" sorusuna dayanır.

---

## 3. EF Core Owned Collection → jsonb (`OwnsMany().ToJson()`)

`Weeks` listesi entity'de düz bir `List<OvertimeWeekSnapshot>`. DbContext'te:

```csharp
modelBuilder.Entity<OvertimeRecord>()
    .OwnsMany(o => o.Weeks, b =>
    {
        b.ToJson();   // ayrı tablo DEĞİL, tek jsonb kolonu
        b.Property(w => w.TotalHours).HasPrecision(7, 2);
        // ...
    });
```

**Owned type** = kendi kimliği (Id) olmayan, sahibiyle yaşayıp ölen tip. `OvertimeWeekSnapshot` `BaseEntity` DEĞİL — bilinçli. Migration'da tek `Weeks jsonb` kolonu çıkar, ayrı `OvertimeRecordWeek` tablosu açılmaz.

> [!tip] Domain neden kendi snapshot tipini tanımladı? Calculator'ın çıktısı `WeeklyOvertimeBreakdown` **Application** katmanında. Entity **Domain**'de. **Domain, Application'a bağımlı olamaz** (Clean Architecture: bağımlılık içe akar). Bu yüzden Domain kendi `OvertimeWeekSnapshot` tipini tanımlar; handler, Calculator sonucunu buna map'ler. İki tip benzese de sınır bilinçli — biri hesap çıktısı, diğeri kalıcı snapshot.

> [!question] Mülakat Sorusu **"EF Core'da bir entity'nin içindeki nesne listesini ayrı tablo açmadan nasıl saklarsın?"** Cevap: Owned collection + `ToJson()`. `OwnsMany(x => x.Liste, b => b.ToJson())` ile liste tek bir `jsonb` (PostgreSQL) kolonuna serialize edilir. Owned type'ın bağımsız kimliği yoktur, sahip entity ile yaşar/ölür. Sorgulanmayan, hep birlikte okunan snapshot/audit verisi için idealdir.

> [!question] Mülakat Sorusu **"Clean Architecture'da Domain katmanı, Application'daki bir tipe ihtiyaç duyarsa ne yaparsın?"** Cevap: Duymaması gerekir — bağımlılık içe akar, Domain en saf katmandır. İhtiyaç varsa Domain kendi tipini tanımlar (burada `OvertimeWeekSnapshot`), dış katman ona map'ler. Domain'i dışarıya bağımlı yapmak (örn. Application'daki record'u kullanmak) altın kuralı bozar.

---

## 4. Dönem Kapanış Akışı (Close): Hesapla → Dondur → Kilitle

`POST /api/overtime/close` (Owner). Handler'ın işi:

1. **Aynı dönem kaydı var mı?** kontrolü (aşağıda — kilit durumuna göre dallanır).
2. **Calculator'ı çağır** → dönem özeti (saf hesap; personel yoksa "bulunamadı" → 400, IDOR/tenant koruması da bu yoldan).
3. **Domain entity'sine map'le** (haftalık kırılım → snapshot listesi).
4. **Kilitle**: `IsLocked=true`, `LockedAt=now`, `LockedByUserId = token'dan`.

> [!important] Kimlik nereden gelir? `LockedByUserId` **client'tan DEĞİL**, `ICurrentUserProvider`'dan (token claim'i). "Kim kapattı?" sahtelenemez — TenantId / RequesterId ile aynı IDOR koruması prensibi.

**0 saatlik dönem kapatılabilir mi?** Evet — tüm ay izinli personel geçerli bir bordro durumudur. Engellenmez (Calculator `TotalHours=0` döner, kayıt yine oluşur).

> [!question] Mülakat Sorusu **"Bir 'kapanış' (ay sonu kapama) işlemini tasarlarken nelere dikkat edersin?"** Cevap: (1) İşlem anındaki değeri dondurmak (snapshot). (2) Kimin/ne zaman kapattığını audit'lemek. (3) Çift kapanışı engellemek (idempotency / unique kısıt). (4) Yetkiyi en üst role bağlamak (geri alması zor). (5) Geçersiz/boş durumların (0 saat) anlamını netleştirmek.

---

## 5. Çift Kapanış Engeli: Handler + DB İki Katman

Aynı personele aynı dönem **iki kez** kapatılamamalı. İki savunma hattı:

- **Handler (ilk hat):** Kapatmadan önce "bu dönem zaten var mı?" diye bakar; varsa anlamlı mesaj döner ("zaten kapalı, önce kilidi açın"). Kullanıcı dostu.
- **DB unique index (son hat):** `(UserId, PeriodStart, PeriodEnd)` üzerinde `UNIQUE`. Handler'daki kontrol bir yarış koşulunda (race condition) kaçsa bile veritabanı reddeder. Son savunma.

> [!tip] Neden iki katman? Handler kontrolü ile gerçek INSERT arasında teorik bir zaman penceresi var (iki istek aynı anda gelirse ikisi de "yok" görebilir). Unique index bu pencereyi kapatır. **Uygulama katmanı UX için, DB katmanı doğruluk için.** İkisi birlikte.

> [!question] Mülakat Sorusu **"Bir benzersizlik kuralını sadece uygulama kodunda kontrol etmek neden yeterli değildir?"** Cevap: Eşzamanlı istekler (race condition) kontrolü atlatabilir: iki istek aynı anda "kayıt yok" görüp ikisi de INSERT yapar. DB seviyesindeki unique index/constraint son savunmadır; eşzamanlılıkta bile tekliği garantiler. Uygulama kontrolü kullanıcıya anlamlı mesaj vermek için, DB constraint doğruluk için.

---

## 6. Unlock — Audit'li Kilit Açma (Silme YOK)

Yanlış kapatılan bir dönem düzeltilebilmeli. İki yol vardı: **(A)** kaydı sil, **(B)** kilidi aç, kayıt dursun.

**Karar: B (silme yok).** Çünkü bu bir **bordro** sistemi: "bir dönemi kapattım, açtım, düzelttim, tekrar kapattım" denetlenebilir bir olay zinciridir. Para ödemesiyle ilgili her şeyde "kim ne zaman ne yaptı" izi şart (personel itirazı, SGK/vergi denetimi). Silme bu izi yok eder. Gerçek muhasebe yazılımları da (Logo, Mikro) silme değil "düzeltme/ters kayıt" mantığıyla çalışır.

`POST /api/overtime/records/{id}/unlock` (Owner): `IsLocked=false`, `UnlockedAt=now`, `UnlockedByUserId = token'dan`. Kayıt **durur**.

> [!important] Audit izi ezilmez Tekrar kapatıldığında yeni close audit'i `LockedAt`/`LockedByUserId`'yi tazeler ama `UnlockedAt`/`UnlockedByUserId` **DURUR** — "bu dönem bir kez açılıp tekrar kapatıldı" bilgisi denetim için korunur.

> [!question] Mülakat Sorusu **"Finansal/bordro verisinde bir kaydı 'geri almak' gerektiğinde silmek yerine ne yaparsın? Neden?"** Cevap: Silmem — audit izini korumak için durumu değiştiririm (soft state: kilit aç/ters kayıt/düzeltme) ve kim/ne zaman yaptığını damgalarım. Silme, denetim ve hesap verebilirlik için gereken geçmişi yok eder. Finansal sistemlerde "değiştirilemez geçmiş + düzeltme kaydı" standarttır.

---

## 7. Recalculate — Tek `Close` Ucu, Üç Dal

Unlock'tan sonra "tekrar kapat" gerekiyordu ama çift-kapanış engeli buna takılırdı. Çözüm: ayrı bir "recalculate" ucu açmak yerine **`Close` handler'ını üç dallı** yaptık:

```
Aynı dönem kaydı?
 ├─ Var + KİLİTLİ    → HATA ("önce kilidi açın")
 ├─ Var + KİLİTSİZ   → ÜZERİNE yeniden hesapla-yaz (Id korunur, audit durur, tekrar kilitle)
 └─ Yok             → yeni kayıt oluştur
```

Böylece "aç → düzelt → tekrar kapat" döngüsü tek uçtan doğal akıyor. Silme yok, ayrı recalculate ucu yok.

> [!success] Recalculate'in kanıtı (test + curl)
> 
> - **Aynı Id döner** (yeni satır açılmaz) → üzerine yazıldı.
> - **`Single` kayıt** → tek satır kaldı.
> - **Saatler tazelendi** (8 → 13, düzeltme sonrası).
> - **`UnlockedAt` durdu** → denetim izi korundu.
> - **`LockedAt > UnlockedAt`** → kapat/aç/kapat zaman çizgisi DB'de okunabiliyor.

> [!question] Mülakat Sorusu **"Aynı doğal anahtara (örn. personel+dönem) sahip bir kaydı 'varsa güncelle, yoksa oluştur' nasıl yaparsın? (upsert)"** Cevap: Önce doğal anahtarla mevcut kaydı çekerim. Varsa alanlarını günceller (Id/CreatedAt/audit korunur), yoksa yeni eklerim. Tek `SaveChanges`. Ek olarak iş kuralı dallanması koyabilirim (örn. kilitliyse güncellemeyi reddet). DB tarafında unique index doğal anahtarı garantiler.

---

## 8. Okuma Uçları: Liste (hafif) vs. Detay (derin)

- `GET /api/overtime/records?userId=&from=&to=` — **liste**. Tüm filtreler opsiyonel. Dönem **kesişimi** ile filtreler (`PeriodEnd >= from && PeriodStart <= to`). Personel adı için User'a join. **Weeks taşımaz** (hafif tarama).
- `GET /api/overtime/records/{id:guid}` — **detay**. Weeks dahil tam kayıt + ücret alanları. Bulunamazsa 404 (tenant izolasyonu da bu yoldan: başka tenant'ın kaydı `null` → 404).

> [!note] Neden liste Weeks taşımıyor? Liste N kayıt dönebilir; her birinin haftalık kırılımını taşımak gereksiz şişme. **Liste = tarama, detay = derinleşme.** Klasik ayrım — ayrı DTO tipleri (`OvertimeRecordListItem` vs `OvertimeRecordDetail`).

> [!question] Mülakat Sorusu **"Liste ve detay uçları için neden farklı DTO döndürürsün?"** Cevap: Liste çok kayıt döner, hafif olmalı — sadece tarama için gereken alanlar. Detay tek kayıttır, ağır/iç içe veriyi (burada haftalık kırılım) taşıyabilir. Ayrı DTO; over-fetching'i (gereksiz veri taşıma) önler, entity'yi doğrudan sızdırmaz (navigation/iç alanlar), ve iki ucun ihtiyacı bağımsız evrilebilir.

---

## 9. Bir İsteğin Yolculuğu — Kapanış Döngüsü

```
POST /close (yeni dönem)
  → aynı dönem? yok → Calculator (hesapla) → map → IsLocked=true → INSERT

POST /close (kilitli, tekrar)
  → aynı dönem? var + kilitli → HATA 400 "önce kilidi açın"

POST /records/{id}/unlock
  → kayıt bul → IsLocked=false + UnlockedAt/By damgala → UPDATE → 204

[veriyi düzelt: eksik TimeClock ekle]

POST /close (kilitsiz, tekrar)
  → aynı dönem? var + kilitsiz → Calculator (yeniden) → ÜZERİNE yaz
    → IsLocked=true (LockedAt tazelenir, UnlockedAt DURUR) → UPDATE
```

Bu yol boyunca **otomatik** devrede: multi-tenancy (global filter + interceptor), auth ([Authorize(Roles="Owner")]), exception → ProblemDetails.

---

## 10. Veritabanı Durumu (Gün 11 sonu)

Yeni tablo: **`OvertimeRecords`**

- Kimlik/tenant: `Id`, `TenantId`, `UserId`
- Dönem: `PeriodStart`, `PeriodEnd` (date) — `(UserId, PeriodStart, PeriodEnd)` UNIQUE
- Saatler: `TotalHours`, `NormalHours`, `OvertimeHours` (numeric(7,2))
- Ücret (şimdilik null): `AppliedHourlyRate`, `OvertimeMultiplier`, `GrossAmount`
- Kilit audit: `IsLocked`, `LockedAt`, `LockedByUserId`
- Unlock audit: `UnlockedAt`, `UnlockedByUserId`
- Snapshot: `Weeks` (**jsonb**)
- 3 FK → Users (LockedBy / UnlockedBy / UserId), hepsi Restrict

Migration'lar: `AddOvertimeRecord`, `AddOvertimeRecordUnlockAudit` (+ Gün 10'dan `AddOvertimeSettings`).

Çalışan endpoint'ler (yeni): `POST /api/overtime/close`, `GET /api/overtime/records`, `GET /api/overtime/records/{id}`, `POST /api/overtime/records/{id}/unlock`.

Test: **43/43 yeşil** (Gün 11'den 7 yeni: kapanış+kilit, snapshot dolumu, çift kapanış, 0 saat, unlock+audit, kilitliyken kapatma engeli, recalculate döngüsü).

---

## 11. Sırada Ne Var (Gün 12)

**Bordro export.** Kapanan `OvertimeRecord`'lardan Excel/CSV üretimi (Logo/Mikro/Paraşüt formatı). Temel hazır: kayıtlar donmuş, kilitli, listelenebilir. Kararlar: CSV elle mi / Excel için paket mi (ClosedXML?), export kapsamı (tek dönem / tüm personel bir ay), format eşlemesi.

**Açık borçlar (devam):** ücret/tutar alanları boş (İK modülü + Position.HourlyRate bağı gelince dolacak); çarpanlar (gece/hafta sonu/tatil) DB'de hazır ama Calculator okumuyor; tatil takvimi yok; ay/hafta sınırı çakışması ("tam hafta" dönemde kusursuz).

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Uçucu hesap (Calculator) vs. donmuş snapshot (OvertimeRecord) — ne zaman hangisi
- [ ] Granülerlik: dönem başına tek kayıt + jsonb haftalık snapshot (hybrid)
- [ ] EF Core `OwnsMany().ToJson()` → owned collection tek jsonb kolonu
- [ ] Owned type kimliği yok, sahiple yaşar/ölür (BaseEntity DEĞİL)
- [ ] Domain kendi snapshot tipini tanımlar (Application'a bağımlı olamaz)
- [ ] Kapanış: hesapla → dondur → kilitle, kimlik token'dan
- [ ] Çift kapanış: handler (UX) + DB unique index (doğruluk) — iki katman
- [ ] Unlock: silme yok, audit'li durum değişimi (bordro denetim izi)
- [ ] Recalculate: tek Close ucu, üç dal (kilitli=hata / kilitsiz=upsert / yok=insert)
- [ ] Liste (hafif, Weeks yok) vs. detay (derin, Weeks dahil) — ayrı DTO
- [ ] Audit izi ezilmez: tekrar kapatınca UnlockedAt DURUR

#shift #dotnet #backend #faz1 #overtime #bordro #ef-core #jsonb #audit #clean-architecture