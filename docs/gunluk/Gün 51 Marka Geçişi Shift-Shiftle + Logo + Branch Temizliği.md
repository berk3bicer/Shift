# Gün 51 — Marka Geçişi: Shift → Shiftle + Logo/Favicon + Branch Temizliği (Tur 21)

> Bu oturum kod değil **marka + repo hijyeni** oturumu. `shiftle.com.tr` domaini alındığı
> için ürün adı her yerde "Shiftle" oldu; ardından vardiya-temalı bir logo işareti + favicon/
> PWA/OG kuruldu; sonunda 13 ölü branch temizlenip repo sadeleştirildi. Danışman modunda
> yürüdü: Claude Code kodu yazdı, ben repodan doğrulayıp brief verdim.
>
> Commit zinciri: `a882cfa` (#13 rename) → `715d540` (#14 logo) → `d50e53c/bb322d8` (#15 auth,
> eski borç kapandı). main HEAD `a9e2c0f`.

---

## 1. Marka rename — "Shift" kelimesini KÖR değiştirmenin tuzağı

Domain `shiftle.com.tr` alındı → ürün adı "Shift" değil artık "Shiftle". Ama repoda "Shift"
üç ayrı şey demek, ve hepsini birden değiştirmek felaket olurdu:

- **Ürün/marka adı** — kullanıcının gördüğü "Shift" (hero, nav, footer, tab title, e-posta).
  → "Shiftle" olacak. **Değişen buydu.**
- **Domain kavramı `Shift` (vardiya entity'si)** — `class Shift`, `ShiftTemplate`,
  `ShiftSwap`, `ShiftNote`. Bir vardiya = *a shift*. Bu ürün adı DEĞİL, iş modeli terimi.
  → **DOKUNULMADI.** "Shiftle tablosu" diye bir vardiya olmaz; DbSet/migration/handler patlardı.
- **Kod kimliği** — `namespace Shift.API`, `IShiftDbContext`, proje adları. Kullanıcı görmez.
  → **DOKUNULMADI.** 330 dosyalık kör rename entity `Shift`'le çakışıp saatlerce CS hatası
  avına dönerdi; kozmetik fayda için değmez.

**Ders:** Bir rename'de önce kelimenin kaç anlamı olduğunu ayır. "Görünen metin / domain
terimi / kod kimliği" üç ayrı kategori; sadece ilki değişir. Kör `sed` felaket.

### Türkçe ek tuzağı (kritik incelik)
"Shiftle" **sesli harfle** (-e) biter; "Shift" **sessizle** (-t) biterdi. Türkçe ekler ses
uyumuna göre değişir, yani kör ek kopyalamak yanlış olur:

| Eski (Shift) | Kör kopya (YANLIŞ) | Doğru (Shiftle) |
|---|---|---|
| Shift'in | ~~Shiftle'in~~ | **Shiftle'nin** |
| Shift'te | ~~Shiftle'te~~ | **Shiftle'de** |
| Shift'e | ~~Shiftle'e~~ | **Shiftle'ye** |
| Shift'le | ~~Shiftle'le~~ | **Shiftle ile** |

Kaynaştırma harfi (n/y) sesliden sonra girer; "de/da" hâli ünsüz yumuşamasıyla. Bir yabancı
kökenli marka adını Türkçe çekimlerken bu elle kontrol edilir — otomatik araç beceremez.

### Config literalleri (kod içi ama kullanıcıyı etkileyen)
- `Jwt.Issuer` `ShiftAPI→ShiftleAPI`, `Audience` `ShiftClient→ShiftleClient`, `Email.FromName`.
- ⚠️ **JWT tuzağı:** Issuer/Audience `TokenValidationParameters`'ta doğrulanıyorsa, değeri
  değiştirince **eski token'lar geçersiz** olur (herkes yeniden login). Kontrol: `Program.cs`
  ve `JwtTokenGenerator.cs` aynı config anahtarından mı okuyor? Evetse tek kaynak, 401 mismatch
  YOK — sadece dev token'ları düşer (kabul edilebilir). İki yerde hardcoded olsaydı biri
  değişip biri kalır, `401` fırtınası çıkardı.

### DOKUNULMAYAN bir uç: DB adı
Connection string `Database=shift`. Lokalde o adla kurulu DB + tüm migration geçmişi var.
"shiftle" yapılsaydı uygulama açılmazdı. **Marka adı ≠ altyapı adı.** DB adı `shift` kaldı.

---

## 2. Logo — "markanın ne yaptığını geometriye göm" (AI logo değil)

Araştırma dersi: AI-üretimi logolar neden ucuz durur → raster (vektör değil), şablon, optik
düzeltme yok, **stratejik gerekçe yok**. İyi SaaS markaları (Vercel deploy oku, Linear
yörüngesi, FedEx gizli oku) harfi değil **ürünün ne yaptığını** forma gömer.

Shiftle = vardiya (İng. *shift* = vardiya; "-le" Türkçe "hallet" çağrışımı). Doğru hook:
**vardiya = çizelgedeki zaman bloğu.** Seçilen mark (Yön D): koyu yuvarlak kare içinde bir
haftalık çizelgenin blokları — 3 açık blok + soluk gri kutucuklar, ortada **amber "aktif
vardiya" bloğu**. Renkler siteyle birebir (`--color-ink #2a2521`, `--color-paper #faf7f2`,
`--color-signal #f59e0b`).

### 16px optik testi — neden İKİ ayrı SVG
Ana mark 32px'e kadar okunur (gri kutucuklar dahil). 16px'de (tarayıcı sekmesi) detay çamura
döner → o boyut için **sadeleştirilmiş 3-çubuk** SVG. `favicon.ico` çok boyutlu: 16 dilimi
sade SVG'den, 32/48 dilimi ana mark'tan. **Ders:** favicon tek boyut değil; en küçük boyutta
ne okunuyorsa tasarım ona göre sadeleşir.

### Maskable ikon tuzağı (Android)
Android adaptive icon ikonu daireye/squircle'a **kırpar**. Normal 192/512 = yuvarlak-kare
olduğu gibi. Ama `maskable` varyant AYRI: zemin **tüm kanvasa** yayılır (full-bleed, kenardan
kenara), içerik orta ~%70 güvenli bölgeye sığar — yoksa kırpma blokları keser. `manifest.ts`'te
`purpose: "maskable"` ayrı dosya.

### Next 16 file-based metadata (manuel `<link>` YOK)
`marketing/app/` köküne konan özel adlar otomatik `<head>`'e bağlanır: `icon.svg`,
`favicon.ico`, `apple-icon.png`, `opengraph-image.png`. `manifest.ts` route olarak üretilir.
`metadataBase` (yeni `SITE_URL`) eklendi ki OG görseli Slack/WhatsApp'ta **mutlak URL**'le
çözülsün (yoksa `localhost`'a bakar, önizleme kırılır).

### Üretim: tek kaynak + tek script
- `ShiftleMark.tsx` — mark tek yerde (inline SVG), `variant="default"` (Nav, açık zemin) /
  `variant="onDark"` (Footer, koyu bantta amber). Nav + Footer ikisi de bunu import eder →
  tekrar yok.
- `gen-icons.mjs` (sharp + to-ico) — `icon.svg`'den tüm boyutları üretir: favicon.ico,
  apple-icon 180, icon-192/512, maskable-512, OG 1200×630. `cd marketing && node scripts/gen-icons.mjs`.

### Bouba grotesk / marka fontu (karar, henüz wire edilmedi)
Wordmark şu an `.font-brand` sınıfı → Plus Jakarta 800'e düşüyor (`letter-spacing -0.02em`,
boşluksuz tek `<span>`). Nihai font: **Switzer** veya **General Sans** (Fontshare, ücretsiz,
Türkçe tam, "bouba grotesk" = Söhne/Stripe ailesi). `next/font/local` ile bağlanınca kod
değişmeden otomatik geçer. → **açık borç.**

---

## 3. "i" noktası amber blok — denendi, İPTAL edildi (neden önemli)

İstenen: wordmark'taki "i" noktasını amber yatay bloğa çevirmek (mark'ın DNA'sı kelimede
tekrar etsin — FedEx oku mantığı). **Teknik gerçek:** bir metinde "i"nin noktası ile gövdesi
tek karakter; CSS ile ayrı boyanamaz. İki yol denendi:
- **Yöntem 1** — "Shiftle" tek `<span>` kalır, üstüne `position:absolute` amber kutucuk biner
  (i-noktasının yerine). `em` cinsi → her font-size'da orantılı. Kalibrasyon Jakarta 800 için
  ~`left:1.30em, top:0.10em` (ölçümle: i-merkezi ~1.42em).
- **Yöntem 2** — noktasız "ı" + amber blok. Reddedildi: kopyalanınca "Shıftle", SEO/erişim bozuk.

Yöntem 1 uygulandı, dev'de çalıştı — **ama Berke görsel olarak beğenmedi → iptal.** Branch
(`fix/wordmark-i-dot`) merge edilmeden silindi.

**Ders (kalıcı):** font-overlay ile harf detayı taklit etmek **kırılgan** — font değişince
(Switzer) yeniden ölçmek gerekir, ve overlay hiçbir zaman gerçek glyph kadar "oturmuş"
görünmez. Bu tür marka detayının **doğru yeri outline SVG wordmark**: kelime path'e çevrilir,
"i" noktası ayrı `<path>` olur, amber boyanır — fonttan bağımsız, her yerde birebir. Yani amber
i-noktası ölmedi; sadece "geçici CSS hilesi" reddedildi, outline turunda düzgün gelebilir (Berke
o zaman yeniden karar verir).

---

## 4. Branch temizliği — "hepsini sil main hariç" neden tehlikeliydi

Repo 14 branch'le şişmişti. Berke "main hariç hepsini sileyim mi" dedi. Kör silme tehlikeliydi:

- **`git branch -r --merged origin/main`** → main'e girmiş, silmesi güvenli (içerik main'de).
- **`git branch -r --no-merged origin/main`** → main'de OLMAYAN iş. Silmek = **kalıcı kayıp.**

Ayrım yapılınca 11 merged + 1 bilerek-iptal (i-dot) = 12 güvenli çıktı. Ama `--no-merged`
listesinde ⚠️ **`feat/auth-guvenlik-tutarliligi`** vardı: devir promptu bunu "deploy öncesi
kapatıldı (main'de)" sayıyordu **ama Git aksini söyledi** — 184 satır kod (`AuthController`,
`AuthRateLimitPolicies`, `ForgotPasswordHandler` + 2 test) + Gün 46 notu main'de YOKtu, sadece
o branch'teydi. Silinseydi iş uçardı. Merge edildi (#15), sonra silindi.

**Ders:** Devir promptu/hafıza ≠ gerçeğin kaynağı. **Git gerçeğin kaynağı.** "Kapattım"
demek merge edildi demek değil — `--no-merged` ile teyit et. Bir de: lokal `git branch -D`
komutu benim remote silme listemden fazlasını sildi (lokaldeki eski dallar dahil), auth
branch'ini de lokalden uçurdu — **ama remote'ta durduğu için kayıp olmadı**, `git checkout`
ile geri gelir. Remote hayatta oldukça lokal silme geri alınabilir.

### zsh tuzağı (yine)
İlk silme komutu `quote>`'ta takıldı — çok satırlı `\` + yorum satırı (`#`) birlikte
yapıştırılınca zsh tırnak moduna girdi. **Çözüm:** yorumsuz, tek satır, backslash'siz yapıştır.
(Kılavuzdaki "yorum + komut aynı blokta olmaz" kuralı bir kez daha kanıtlandı.)

---

## Sonuç durumu
- main HEAD `a9e2c0f`. Remote'ta sadece `main` (auth kabuğu da merge sonrası silinecek/silindi).
- Rename (#13) + logo/favicon/OG (#14) + auth güvenlik (#15) hepsi main'de.
- Site canlı: nav/footer "Shiftle" + mark, favicon vardiya-bloğu, OG 1200×630.

## Açık borçlar
- `#mailto-shift-app` — Footer `mailto:merhaba@shift.app` hâlâ eski/çalışmayan domain. Mail
  kutusu (`merhaba@shiftle.com.tr`) HENÜZ YOK. **Deploy-blocker** — canlıya çıkmadan halledilmeli
  (kutu kurulunca çevir, ya da İletişim linkini geçici yönlendir/kaldır). **UNUTMA.**
- `#switzer-wire` — marka fontu (Switzer/General Sans) `next/font/local` ile bağlanmadı; wordmark
  hâlâ Jakarta 800.
- `#outline-wordmark` — "Shiftle" outline SVG'ye dönmedi; amber i-noktası (istenirse) burada gelir.
- `#panel-ikonlari` — `web/` paneline favicon/PWA ikonu eklenmedi (marketing'de var). Ayrı commit.
- `#og-helvetica` — OG görselindeki metin Helvetica (sharp'ta Switzer yok); Switzer gelince OG yenilenir.
- `#staff-ui` — panelde personel yönetim ekranı hâlâ yok (eski borç).
- `#kvkk-kalici-riza` / `#kvkk-hukuki-onay` — rıza DB'ye yazılmıyor + KVKK metni avukat onayı bekliyor.

---

## Mülakat Soruları

**1) Bir ürünün adını `Shift`'ten `Shiftle`'a çevirirken, kod tabanında "Shift" kelimesini kör
`sed` ile değiştirmek neden felakettir? En az iki farklı "Shift" anlamı söyle.**
> Çünkü "Shift" üç ayrı şey: (a) marka adı (kullanıcı görür, değişmeli), (b) domain entity'si
> `class Shift` = vardiya (iş terimi, değişmemeli — yoksa DbSet/migration patlar, anlamsız olur),
> (c) kod kimliği `namespace Shift.*`/`IShiftDbContext` (kullanıcı görmez, değişmesi gereksiz +
> riskli). Kör sed üçünü birden vurur.

**2) Bir tarayıcı favicon'unu neden tek bir SVG'den tüm boyutlarda üretmek yerine 16px için ayrı
bir sadeleştirilmiş sürüm çizersin?**
> 16px'de ince detay (gri kutucuklar) fiziksel piksele sığmaz, çamura döner ve okunurluk düşer.
> Ayrı 3-çubuk sürümü o boyutta net kalır. Favicon "aynı görselin küçüğü" değil, "o boyutta
> okunan sürüm"dür.

**3) Android `maskable` ikon ile normal ikon arasındaki fark nedir, neden ayrı dosya gerekir?**
> Android maskable'ı daireye/squircle'a kırpar. Normal ikon yuvarlak-kare olduğu gibi durur ama
> maskable'da zemin full-bleed (kenardan kenara) olmalı ve içerik orta ~%70 güvenli bölgeye
> sığmalı; yoksa kırpma içeriği keser. Bu yüzden `purpose:"maskable"` ayrı üretilir.

**4) JWT `Issuer`/`Audience` değerini rename sırasında değiştirdin. Bunun 401 fırtınasına yol
açmaması için neyi kontrol ettin?**
> Token üretimi (`JwtTokenGenerator`) ve doğrulaması (`Program.cs` `ValidIssuer/ValidAudience`)
> **aynı config anahtarından** mı okuyor. Evetse tek kaynak, ikisi birlikte değişir, sadece eski
> token'lar düşer (yeniden login). İki yerde hardcoded olsaydı biri değişir biri kalır → sürekli 401.

**5) `git branch --merged` ve `--no-merged` ayrımı bir "hepsini sil" temizliğinde neden hayat
kurtarır?**
> `--merged` içeriği main'de olan, silmesi güvenli dalları verir. `--no-merged` main'de OLMAYAN
> iş demek — silmek kalıcı kayıp. Bu oturumda `--no-merged` bir güvenlik branch'ini (184 satır +
> not) yakaladı; kör silinseydi uçardı. Hafıza/prompt "kapattım" dese de Git gerçeği söyler.

**6) "i" harfinin noktasını amber yapmak için neden CSS overlay yerine outline SVG doğru çözümdür?**
> Metinde nokta+gövde tek glyph, CSS ayıramaz; overlay `position:absolute` bir hile ve font
> değişince (Jakarta→Switzer) yeniden ölçmek gerekir, hiçbir zaman glyph kadar oturmaz. Outline'da
> kelime path'e çevrilir, nokta ayrı `<path>` olur, fonttan bağımsız birebir sabitlenir.
