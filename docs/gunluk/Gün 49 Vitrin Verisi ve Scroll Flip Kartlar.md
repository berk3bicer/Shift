# Gün 49 — Vitrin Tenant'ı + Gerçek Panel Görselleri + Scroll Flip Kartlar (Tur 17)

**Kapsam:** Marketing sitesine KANIT katmanı. Üç parça: (1) tekrarlanabilir vitrin tenant seed'i
(`scripts/seed-vitrin.mjs`), (2) çalışan panelden çekilmiş 5 gerçek ekran görüntüsü
(`marketing/public/urun/`), (3) scroll'la 180° dönen karşılaştırma kartları
(`marketing/components/FlipShowcase.tsx`): arka yüz eski dünya (kağıt/mesaj grubu/defter),
ön yüz gerçek ürün ekranı. Branch: `feat/marketing-vitrin-gorseller`.

---

## 1. Vitrin seed'i — iki kanal, tek script

API her şeyi üretemiyor; seed iki kanalı birleştirir:

- **API kanalı** (`http://localhost:5203`): register (yeni tenant) → şube → pozisyon →
  personel daveti → dolu hafta vardiya + 2 açık vardiya → publish-week → kanban → checklist.
  İş kuralları bedavaya doğrulanır (çakışma 400'ü, rol yetkileri, ŞART kontrolleri).
- **psql kanalı**: yalnız API'nin İLKE gereği üretemediği iki şey — (a) geçmişe dönük puantaj:
  `clock-in` kimliği token'dan alır ve "şimdi" damgalar, geçmiş ay girilemez (doğru tasarım —
  puantaj kanıt değeri taşır); (b) davetli personeli aktifleştirme: davet akışı e-postadaki
  token'ı ister, seed'in e-postası yok. Çözüm: owner'ın BCrypt hash'i personel satırlarına
  kopyalanır — BCrypt hash'i kullanıcıya değil şifreye bağlıdır, aynı hash = aynı şifre.

> [!question] Mülakat Sorusu 1 — **"Test/demo verisini neden API üzerinden seed'lersin, doğrudan SQL yerine?"**
> API'den geçen her kayıt iş kurallarından geçer: çakışan vardiya 400 döner, rol yetkisi
> denetlenir, bildirim fan-out'u çalışır. SQL insert bu kuralları bypass eder — "üretimde
> oluşamayacak" tutarsız veri üretebilir ve FE'de asla oluşmayacak durumları debug etmekle
> vakit kaybettirir. SQL'e yalnız API'nin İLKE gereği reddettiği şeyler için inilir (geçmiş
> damgalı puantaj gibi) ve o zaman da kuralları elle taklit etme sorumluluğu sana geçer.

### Seed idempotency — neden ve nasıl

Seed'i iki kez çalıştırmak çift kayıt üretmemeli: screenshot çekimi iterasyon ister, her
"bir daha çalıştır" korkulu olmamalı. Desen: her varlık için **doğal anahtar** seç ve önce oku —
tenant için owner login'inin başarısı, pozisyon/görev için ad/başlık, vardiya için
`kişi+başlangıç saati`, SQL INSERT'ler için `NOT EXISTS (aynı kişi + aynı CheckInTime)`.
Kritik incelik: puantajdaki "gerçekçi dakika sapması" **deterministik** üretilir
(`(gün*7 + kişi*13) % 9 - 4`); `Math.random()` kullanılsaydı her çalıştırma farklı damga
üretir, `NOT EXISTS` hiç eşleşmez ve idempotency sessizce ölürdü.

> [!question] Mülakat Sorusu 2 — **"Idempotent script ne demek, nasıl garanti edersin?"**
> Aynı işlemi N kez çalıştırmak 1 kez çalıştırmakla aynı sonucu bırakır. Garanti üç adım:
> (1) her varlığa doğal anahtar (upsert edilecek kimlik), (2) yaz'madan önce oku (var mı?),
> (3) script içindeki her rastgelelik deterministik olsun — rastgele değer doğal anahtara
> sızarsa tekrar çalıştırma onu "yeni kayıt" sanır.

### KVKK-güvenli vitrin verisi

Screenshot'lar yayınlanacak → içindeki her isim/e-posta **veri işleme** sayılır. Kural: tüm
kişiler uydurma (Elif Şahin, Mert Aydın…), e-postalar rezerve `.example` TLD'sinde
(`RFC 2606` — asla gerçek posta kutusuna çözülmez), gerçek hesapla (`berke@…`) çekim yasak.
Ekranda üçüncü marka adı yok. `#vitrin-seed-prod`: script yalnız dev içindir, başına uyarı yazıldı.

## 2. Scroll-driven animation — `useScroll` + `useTransform`

Klasik animasyon **zamana** bağlıdır (0.6s'de tamamlan); scroll-driven animasyon **scroll
konumuna** bağlıdır — kullanıcı kaydırdıkça ilerler, geri kaydırınca geri sarar. Framer'da:

```tsx
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center center"] });
const rotateY = useTransform(scrollYProgress, [0, 1], [-180, 0]);
```

`offset` iki nokta tanımlar: `"start end"` = elemanın üstü viewport'un altına değdiği an
(progress 0), `"center center"` = elemanın merkezi viewport merkezine geldiği an (progress 1).
`useTransform` bu 0-1'i dereceye çevirir. React render'ı tetiklenmez — MotionValue doğrudan
style'a yazar (60fps'in sırrı bu).

**Brief'ten sapma (bilinçli):** brief `[0, 180]` diyordu — o kurguda kart merkezde 180°'de,
yani ESKİ dünyada dinlenir; argüman "artık bu"da değil "eskiden böyleydi"de biter. `[-180, 0]`
ile dönüş aynı, ama dinlenme yüzü HEP ürün ekranı. Efekt argümanın hizmetinde, tersi değil.

### `preserve-3d` + `backface-visibility` — kartın anatomisi

- Dış sarmalayıcı: `perspective: 1200px` — 3B sahnenin "kamera mesafesi". Bu olmadan rotateY
  yassı bir sıkışma gibi görünür.
- Dönen kart: `transform-style: preserve-3d` — çocukların 3B konumları korunur. Varsayılan
  `flat`'te iki yüz aynı düzleme ezilir ve arka yüz hiç görünmez.
- İki yüz de `backface-visibility: hidden`: bir eleman ekrana SIRTINI döndüğünde çizilmez.
  Arka yüz baştan `rotateY(180deg)` ile ters konur → kart 0°'deyken arka yüz sırtı dönük
  (görünmez), 180°'de öne gelir. İkisi `position:absolute; inset:0` ile üst üste.

> [!question] Mülakat Sorusu 3 — **"CSS'te kart çevirme efekti nasıl çalışır? `backface-visibility` olmasa ne olur?"**
> Perspective'li sarmalayıcı + preserve-3d'li kart + iki mutlak konumlu yüz; arka yüz önceden
> 180° çevrilir, kart döndükçe yüzler sırayla kameraya bakar. `backface-visibility: hidden`
> olmasa dönen yüzün AYNADAKİ görüntÜSÜ (yazılar ters) görünmeye devam eder — efekt "kart
> çevirme" değil "şeffaf cam döndürme" olur.

### Performans: kart başına bağımsız abonelik + koşullu `will-change`

Her kart kendi `ref`'i ve kendi `useScroll` aboneliğiyle bağımsız bileşen — tek merkezi scroll
dinleyip 4 kartı hesaplamak yerine her kart yalnız kendi progress'ini türetir.
`will-change: transform` sabit değil, `useTransform` ile koşullu: yalnız `0 < progress < 1`
iken `transform`, dışında `auto`. Sabit will-change 4 kartı kalıcı compositor katmanında tutar
(bellek); koşullusu katmanı yalnız dönüş sürerken ister.

## 3. Reduced-motion: "kapat" değil, "alternatif sun"

`prefers-reduced-motion` vestibüler rahatsızlıkları olan kullanıcılar içindir — 3B dönen büyük
bir kart tam da tetikleyici türden harekettir. Ama dönüşü sadece KAPATMAK arka yüzü (eski dünya
argümanının yarısını) erişilmez bırakırdı. Çözüm: reduce'ta iki yüz YAN YANA statik grid
("Eskiden" / "Shift'te" rozetleriyle) — hareket sıfır, bilgi tam. Tur 7 dersinin genellemesi:
*erişilebilirlik modu içerik eksiltemez.*

### Hydration tuzağı (bu turun kendi yarası)

İlk sürüm `reduce ? <StaticCard/> : <FlipCard/>` diye render'da dallanıyordu. SSR her zaman
`reduce=false` varsayar → sunucu flip HTML'i basar, reduce'lu istemcinin İLK render'ı yan-yana
basar → React 19 "Hydration failed, tree regenerated" fırlatır (tüm sayfa istemcide yeniden
kurulur). Çözüm: **mounted-gate** — `useState(false)` + `useEffect(setMounted(true))`; ilk
istemci render'ı SSR ile birebir aynı (flip), yan-yanaya geçiş yalnız mount SONRASI. İçerik
hiçbir aşamada gizli değil (flip düzeninde de bir yüz her zaman görünür).

> [!question] Mülakat Sorusu 4 — **"SSR'lı React'te `useReducedMotion`/`matchMedia` ile layout değiştirmek neden tehlikeli, doğrusu ne?"**
> Sunucu media query okuyamaz; istemcinin ilk render'ı sunucudan farklı ağaç üretirse hydration
> kırılır. Doğrusu iki desenden biri: (1) mounted-gate — ilk render SSR ile özdeş, farklılaşma
> effect sonrası; (2) ağacı hiç değiştirmeyip farkı CSS media query'ye (`motion-reduce:`)
> bırakmak. Aynı hatanın sitedeki mevcut örneği `Reveal.tsx`'te tespit edildi (initial'ı
> reduce'a göre değişiyor) — ayrı işe bölündü.

## 4. Tur sırasında bulunan gerçek bug

`PayrollBoard` alt toplamı `781.8999999999999s` gösteriyordu — IEEE 754 float toplama artığı
doğrudan UI'a sızmış. Screenshot'ta yakalandı (vitrin verisinin yan faydası: gerçek veri gerçek
bug çıkarır). Düzeltme: `toFixed(2)`. Satır bazlı değerler backend'den `numeric(7,2)` geldiği
için temizdi; yalnız istemcide toplananlar etkileniyordu.

## Açık borçlar

- **#P6 favicon/OG:** hâlâ açık — bu turda bilinçli yapılmadı, ayrı tur.
- **#vitrin-seed-prod:** seed yalnız dev; prod'da asla. Script başında uyarı var.
- **#unsplash-bagimliligi:** Hero + PilotCTA hâlâ Unsplash CDN'de (`Photo.tsx`), ayrı karar.
- **#reveal-hydration:** `Reveal.tsx` reduce'ta hydration hatası üretiyor (main'de de var,
  bu turdan bağımsız) — ayrı işe bölündü.
- **#checklist-damga:** seed'in checklist saat damgaları psql ile sabaha çekiliyor; API'ye
  "geçmiş damgalı run" desteği eklemek istenirse ayrı tartışma (muhtemelen istenmez — kanıt değeri).
