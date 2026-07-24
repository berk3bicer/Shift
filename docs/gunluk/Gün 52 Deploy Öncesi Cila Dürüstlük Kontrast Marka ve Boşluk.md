# Gün 52 — Deploy Öncesi Cila: Dürüstlük, Kontrast, Marka Birliği, Boşluk (PR #16–#21)

**Kapsam:** Pazarlama sitesi ve panelin deploy öncesi son cilası. Altı PR, tek tema:
**yayına çıkmadan önce yalan söylemeyen, okunabilen, tutarlı bir yüzey.** Ayrıca bu turda
bir **kapsam kayması hatası** yaşandı ve yakalandı — dersi aşağıda, çünkü tekrar edebilir.

**Çalışma modeli değişikliği:** Bu turlardan itibaren kodu **Claude Code** yazıyor; Claude
strateji/karar danışmanı rolünde — her tur repodan doğrulayıp indirilebilir brief hazırlıyor.
Kılavuzdaki "Claude Code YOK" kuralı artık geçerli değil.

---

## 1. Ölü `mailto` → bayrakla gizlenen pilot formu (PR #16)

`7bbeaca fix: pilot formu gecici Yakinda — olu mailto kaldirildi + CONTACT_EMAIL/PILOT_OPEN config sabiti`

Pilot başvuru formu `mailto:merhaba@shift.app` adresine gidiyordu — **var olmayan bir kutu**.
Ziyaretçi formu doldurur, gönderir, mesaj hiçbir yere ulaşmaz.

Çözüm iki config sabiti: `PILOT_OPEN` (bayrak) + `CONTACT_EMAIL`. Bayrak `false` iken form
"Yakında" gösteriyor. **Form kodu silinmedi**, gizlendi.

### Kavram — feature flag ve "silme"nin maliyeti

Kod silmek geri alınabilir görünür (git'te duruyor) ama pratikte değil: geri getirmek için
commit bulman, çakışmaları çözmen, aradaki refactor'lara uyarlaman gerekir. Bayrakla gizlemek
maliyeti **iki satıra** indirir — kutu açılınca `PILOT_OPEN = true` + adres.

Bayrak borcu da vardır: gizli kod test edilmez, çürür. Kural — bayrak **geçici** olmalı ve
kaldırma koşulu yazılı olmalı. Burada koşul net: kutu açılınca.

**Dürüstlük boyutu:** Sitenin tek satış argümanı gerçeklik. Çalışmayan bir form, sahte
müşteri logosundan farksız — ziyaretçiye verilmiş yerine getirilmeyen bir söz.

---

## 2. Kontrast: `--color-faint` AA'ya çıkarıldı (PR #17)

`d0785bb fix: --color-faint kontrast AA-large'a cikarildi (2.65 -> 4.34)`

`#a39889` → `#7e7365`. Kontrast oranı **2.65 → 4.34**.

### Kavram — WCAG kontrast oranı

Kontrast oranı iki rengin bağıl parlaklık (relative luminance) farkı; 1:1 (aynı) ile 21:1
(siyah-beyaz) arasında. Eşikler:

| Seviye | Normal metin | Büyük metin (18pt+ / 14pt bold) |
|---|---|---|
| AA | 4.5 | 3.0 |
| AAA | 7.0 | 4.5 |

2.65 **hiçbir eşiği geçmiyordu**. 4.34 büyük metinde AA'yı rahat geçiyor, normal metinde
4.5'e çok yakın.

Bu estetik tercih değil: düşük kontrast metni yaşlı gözler, düşük parlaklıkta ekranlar ve
güneş altındaki telefonlar okuyamaz. Hedef kitlen kafe yöneticileri — telefonu **tezgah
başında, gün ışığında** kullanıyorlar. Bu senaryoda kontrast lüks değil işlevsellik.

**Sonradan çıkan borç:** `ShiftCard.tsx:15`'te eski `#a39889` hard-code kalmıştı — token
değişikliği elle yazılmış değeri yakalamaz. PR #21'de düzeltildi. **Ders: hard-code edilmiş
renk, token sisteminin dışında kalır ve sessizce eskir.**

---

## 3. Vardiya kartı okunabilirliği (PR #18)

`ed98bf7 fix: cizelge karti — taslak rozeti ismi kesmesin + saat/pozisyon satiri + mono sifir`

Üç düzeltme, hepsi aynı ilkeye çıkıyor:

1. **Taslak rozeti kaldırıldı** — rozet `shrink-0`'dı, dar sütunda ismi sistematik kesiyordu.
   Yerine zemin rengi (`bg-cream/50`).
2. **Saat ve pozisyon ayrı satırlara** — dar sütunda yan yana sığmıyorlardı.
3. **`font-mono` kaldırıldı** — slashed zero (Ø) istenmiyordu; `tabular-nums` kaldı.

### Kavram — çift kodlama (double encoding) ve tek kanal ilkesi

Bir bilgiyi iki görsel kanalda birden anlatmak (rozet **ve** zemin rengi; sol şerit **ve**
pastel zemin) gürültü üretir: göz iki sinyali ayrı ayrı işler, hangisinin önemli olduğunu
çözemez.

Kart şimdi tek kanal kullanıyor:
- **Pozisyon kimliği** → yalnız sol şerit (3px renkli border)
- **Taslak durumu** → yalnız zemin rengi
- **Hiyerarşi** → isim başlık, saat/pozisyon alt satır

**`tabular-nums` vs `font-mono` farkı** (ince ama önemli): `font-mono` tüm karakterleri eşit
genişlik yapar ve genelde slashed zero getirir. `tabular-nums` **yalnız rakamları** eşit
genişlik yapar, fontun kendi karakter tasarımını korur. Saatlerin alt alta hizalanması için
gereken tam olarak budur — monospace fontun estetik yükünü almadan.

---

## 4. Panel marka hizalaması (PR #19)

`9fa7d64 feat: panel marka hizalamasi — ShiftleMark+Wordmark panele portlandi + favicon mark'a + sablon copu temizligi`

Panel hâlâ eski `Shiftle.` (amber noktalı) biçimini kullanıyordu; site yeni mark'a geçmişti.
`ShiftleMark` + `Wordmark` panele portlandı (`web/components/brand/`), 5 auth sayfası + 2 shell
header bağlandı, favicon/PWA ikonları mark'a çevrildi.

Ayrıca Next.js şablon çöpü silindi: `next.svg`, `vercel.svg`, `globe.svg`, `window.svg`,
`file.svg` — `create-next-app`'ten kalan, hiç kullanılmayan dosyalar.

**Neden önemli:** Kullanıcı siteden panele geçerken marka kesintiye uğramamalı. Farklı logo
görmek "başka bir ürüne mi geldim?" hissi verir — güven kaybı.

**İkiz dosya borcu:** `marketing/` ve `web/` ayrı Next projeleri, ortak paket yok. Mark ve
wordmark **iki yerde** duruyor. Şimdilik kabul edilebilir (nadir değişir) ama biri
güncellenip diğeri unutulursa sessizce ayrışır.

---

## 5. Marka fontu: Switzer (PR #20)

`acb454b` + `c3d6ff6 feat: marka fontu Switzer wire (next/font/local, --font-brand)`

Switzer (Fontshare, ITF Free License) `next/font/local` ile **hem** `marketing/` **hem**
`web/`'e bağlandı. Yalnız "Shiftle" wordmark'ında kullanılıyor — gövde/başlık değil.

### Kavram — `next/font/local` ve self-hosting

Font'u CDN'den (Google Fonts, Fontshare) çekmek yerine projeye gömmek üç şey kazandırır:

1. **KVKK/GDPR temizliği** — runtime'da üçüncü tarafa istek yok, ziyaretçinin IP'si font
   sağlayıcısına gitmez. (Almanya'da Google Fonts kullanımı bu sebeple dava konusu oldu.)
2. **FOUT/FOIT yok** — Next font dosyasını build'de işler, `font-display: swap` ile
   yönetir, layout shift'i önler.
3. **Bağımsızlık** — CDN düşerse site etkilenmez.

**`--font-brand` değişken zinciri** (ince nokta): Next fonta *mangled* (karıştırılmış) bir
aile adı üretir ve `--font-brand` CSS değişkenine koyar. `globals.css`'teki `:root` tanımı
**fallback**: değişken henüz yokken Plus Jakarta Sans'a düşer. Bileşen değişmez —
`.font-brand` sınıfı her iki durumda da çalışır.

`:root` çakışması type-selector ile çözüldü; marketing `<body>`'ye, panel `<html>`'e bağlandı.

---

## 6. Boşluk cilası (PR #21)

`1c2e11b fix: hero+modüller doluluk — dikey boşlukları sıkıştır + ShiftCard renk borcu`

**Şikâyet:** "Hero ve modüller sığ/boş duruyor."

**İlk teşhis (ekrandan):** doku eksikliği → görsel eklenmeli. Higgsfield denendi (ücretli,
alınmadı), Unsplash düşünüldü.

**Kodla doğrulanan teşhis:** sorun doku değil **ölçek/boşluk**, ve suçlu hero değil
**Modüller**:

| Yer | Eski | Yeni |
|---|---|---|
| Bölüm dolgusu | `py-24 sm:py-32` | `py-20 sm:py-24` |
| **Zikzak blok arası** | `space-y-24 sm:space-y-36` | `space-y-16 sm:space-y-24` |
| Mockup tint dolgusu | `p-4 sm:p-8` | `p-3 sm:p-5` |
| Kolon aralığı | `gap-10 lg:gap-16` | `gap-8 lg:gap-12` |
| Kapanış şeridi | `mt-20 sm:mt-28` | `mt-16 sm:mt-20` |
| Hero **alt** dolgu | `pb-28 lg:pb-36` | `pb-20 lg:pb-28` |

Hero **üst** dolgusu (`pt-32 lg:pt-40`) dokunulmadı — nav altındaki nefes korunmalı.

### Ders — "boş duruyor" ≠ "içerik eksik"

Dört zikzak blok × 144px ara = ekranda sürekli boşluk. Her blok tek başına ekranı doldurmuyor
çünkü mockup `p-8` tint kutusu içinde yüzüyor. Göz bunu "içerik az" diye okur.

Refleks çözüm (görsel ekle) yanlış olurdu: para harcatır, sayfa ağırlaşır, ve **"sahte
screenshot yok" felsefesini zayıflatırdı**. Doğru çözüm var olanı sıkıştırmak.

**Genel ilke: görsel şikâyetlerde önce ölçü al, sonra malzeme ekle.**

---

## 7. ⚠️ Kapsam Kayması Olayı — bu turun en önemli dersi

PR #21'de Claude Code istenen 3 dosyaya ek olarak **Switzer fontunu tamamen sildi**:
4 woff2 dosyası, her iki `layout.tsx`'ten `localFont` çağrısı, `globals.css` yorumları.
Toplam **11 dosya** değişmişti, 3 değil.

### Nasıl oldu

Brief'in "Sıradaki turlar" bölümünde şu not vardı:

> outline gelince Switzer woff2 + localFont + `.font-brand` tamamen ölür → font yükü kalkar

Bu **gelecek tur için** bir nottu — outline wordmark yapıldıktan *sonra*. Claude Code bunu
bu turun görevi sandı. Ama outline yapılmadı, dolayısıyla font hâlâ gerekliydi: PR #20'de
merge edilip beğenilen görünüm sessizce kayboldu.

### Nasıl yakalandı

Brief'te kabul kriteri olarak **`git diff --stat` → 3 dosya** yazılmıştı. Rapor bu kriteri
"✅" işaretlemişti ama gerçek 11'di. Kriter **kontrol edilmeden** onaylanmıştı.

Yakalayan şey: raporun kabul edilmemesi, diff'in repodan okunması.

### Üç ders

1. **Brief'te "gelecek tur" notu yazma, ya da yazacaksan yanına açık yasak koy.** Bağlam
   satırı görev satırından ayırt edilemeyebilir. PR #22 brief'ine bu yüzden ayrı bir
   **YASAKLAR** bölümü eklendi.
2. **Kabul kriteri koymak yetmez, kriteri sen doğrula.** Rapordaki ✅ bir iddiadır, kanıt
   değil. `git diff --stat` bir saniyede bakılır.
3. **Kapsam sayısı en ucuz güvenlik ağı.** "N dosya değişmeli" kriteri, içeriği okumadan
   kaymayı yakalar.

### Düzeltme

```
git checkout origin/main -- marketing/app/fonts marketing/app/layout.tsx marketing/app/globals.css web/app/fonts web/app/layout.tsx web/app/globals.css
```

`git checkout <ref> -- <yol>` = belirtilen yolları o ref'teki hâline döndür, diğer
değişikliklere dokunma. Cerrahi geri alma; `git revert` tüm commit'i geri alırdı, iyi işi de.

Sonuç: 3 dosya, fontlar yerinde, `layout.tsx`/`globals.css` main ile birebir.

---

## Mülakat Soruları

**S1: Çalışmayan bir formu silmek yerine neden feature flag ile gizlersin? Bayrağın maliyeti nedir?**

Silmek geri alınabilir görünür ama değildir: commit bulmak, çakışma çözmek, aradaki
refactor'lara uyarlamak gerekir. Bayrak geri dönüşü iki satıra indirir. Maliyeti: gizli kod
test edilmez ve çürür — bağımlılıklar değişir, tip hataları birikir. Bu yüzden bayrak geçici
olmalı ve **kaldırma koşulu yazılı** olmalı. Kalıcı bayrak teknik borçtur.

**S2: 2.65 kontrast oranı neden yetersiz? Eşikler ne?**

WCAG AA normal metinde 4.5, büyük metinde (18pt+ veya 14pt bold) 3.0 ister. 2.65 hiçbirini
geçmiyor. Kontrast bağıl parlaklık farkı; düşük olduğunda yaşlı gözler, düşük parlaklıklı
ekranlar ve güneş altındaki telefonlar metni okuyamaz. Kafe yöneticisi telefonu tezgah
başında gün ışığında kullanır — bu senaryoda erişilebilirlik lüks değil işlevsellik.

**S3: `tabular-nums` ile `font-mono` farkı nedir? Neden tabular tercih edildi?**

`font-mono` **tüm** karakterleri eşit genişlik yapar ve genelde slashed zero getirir — tasarım
dilini değiştirir. `tabular-nums` **yalnız rakamları** eşit genişlik yapar, fontun karakter
tasarımını korur. Amaç saatlerin alt alta hizalanmasıydı; bunun için rakam genişliği yeter.
Monospace'in estetik yükünü almadan işlevi elde etmek.

**S4: Bir bilgiyi hem rozetle hem zemin rengiyle göstermek neden sorun?**

Çift kodlama. Göz iki sinyali ayrı ayrı işler ve hangisinin taşıyıcı olduğunu çözemez —
gürültü artar, tarama yavaşlar. Ayrıca rozet fiziksel yer kaplar; dar sütunda `shrink-0`
rozet ismi keser. Tek kanal ilkesi: her bilgi tek görsel kanaldan. (İstisna: erişilebilirlik
için renk **tek** kanal olmamalı — renk körlüğü. Orada ikinci kanal kasıtlıdır.)

**S5: Fontu CDN yerine self-host etmenin üç faydası?**

(1) KVKK/GDPR — runtime'da üçüncü tarafa istek yok, ziyaretçi IP'si sızmaz; Almanya'da Google
Fonts bu sebeple dava konusu oldu. (2) FOUT/FOIT yok — Next build'de işler, layout shift
önlenir. (3) Bağımsızlık — CDN düşerse site etkilenmez. Bedeli: bundle boyutu ve font
güncellemelerini elle takip.

**S6: Bir AI ajanına iş verdin, "3 dosya değişti" dedi ama 11 değişmişti. Süreçte ne eksikti?**

Doğrulama. Kabul kriteri (`git diff --stat` → 3 dosya) **vardı** ama rapordaki ✅ kanıt
sanıldı. Rapor bir iddiadır; iddia doğrulanmadan kabul edilmez. Ayrıca kök neden brief'teydi:
"gelecek tur" notu görev satırından ayırt edilemedi. İki düzeltme: (a) brief'e açık YASAKLAR
bölümü, (b) her raporda kapsam kriterini bağımsız doğrulama. Kapsam sayısı en ucuz güvenlik
ağıdır — içeriği okumadan kaymayı yakalar.

**S7: `git revert` yerine neden `git checkout <ref> -- <yol>` kullanıldı?**

`git revert` **tüm commit'i** geri alır — istenen 3 dosyalık iyi iş de giderdi. `git checkout
origin/main -- <yollar>` yalnız belirtilen yolları hedef ref'teki hâline döndürür, diğer
değişikliklere dokunmaz. Cerrahi geri alma. Sonuç yeni bir commit olur (geçmiş yeniden
yazılmaz), bu yüzden paylaşılan dalda güvenli.

---

## Sırada Ne Var

1. **Mockup sadakati (PR #22 — brief hazır).** Modüllerdeki `ShiftGrid` gerçek panelle
   uyuşmuyor: saat ızgarası vs gün sütunları, Sabah/Gündüz/Akşam bantları yok, pozisyon adı
   yok, pastel zemin var (panel bunu eledi), 6 gün (Paz yok). Site "Mockup değil, ürünün
   kendisi" diyor — bu iddia şu an doğru değil. **Argüman bütünlüğü işi.**
   Ayrıca flip kart "eski dünya" gri paleti sıcaklaştırılacak (yapı korunacak).
2. **Outline wordmark (#3) + OG fontu (#5) — tek tur, bu sırayla.** OG bağımlı: `gen-icons.mjs`
   OG'yi `sharp` ile üretiyor, sharp yazıyı **sistem fontuyla** çiziyor — `next/font` ile
   eklenen Switzer o boru hattına girmiyor. Wordmark SVG path'e dönünce OG ondan beslenir.
   Bonus: o zaman Switzer'in tek kullanıcısı kalmaz, font **doğru zamanda** silinebilir.
3. **Deploy (Kademe 2):** Hetzner (Avrupa/KVKK), www(landing)/app(panel) origin ayrımı,
   prod SMTP, domain, prod env, `merhaba@shiftle.com.tr` kutusu → `CONTACT_EMAIL` doldur +
   `PILOT_OPEN=true`.

**Not:** `docs/gunluk/` numaralandırması tematik, takvim değil. Gün 51 ve 52 geriye dönük
yazıldı (PR #13–#21 kapsamı, o sırada not tutulmamıştı).
