# Gün 50 — Flip Kart Cilası: Sinematik 3D + Scroll Tetik Düzeltmesi (Tur 19)

**Kapsam:** Gün 49'da kurulan `FlipShowcase.tsx`'in iki kusurunu gidermek — tek dosya, tek
mesele: **dönüş mekaniği**. Arka yüz eski-dünya çizimlerine (kağıt çizelge, mesaj grubu, mesai
defteri, ıslak form) dokunulmadı; onlar zaten güçlü. Değişen yalnız (1) dönüşün NE ZAMAN
başladığı ve (2) NASIL göründüğü. Branch: `feat/flip-sinematik-3d` (base `main` değil,
`feat/marketing-vitrin-gorseller` — flip orada yaşıyor, henüz merge olmadı).

---

## 1. Kusur — dönüş göz açısının dışında bitiyordu

Eski offset: `["start end", "center center"]`. `"start end"` = kartın **üstünün** viewport'un
**altına** değdiği an (progress 0). O anda kart daha görünür bile değil — en alttan yeni
belirmeye başlıyor. Dönüş burada başlayıp `center center`'da (kart tam ortada) bitince,
kullanıcı karta gözünü diktiğinde dönüş çoktan tamamlanmış oluyordu: "yavan, kımıldamayan kart"
şikâyeti aslında **erken tetik** şikâyetiydi.

Yeni offset: `["start 0.6", "center 0.45"]`. Dönüş penceresi kartın alt-orta banttan ekran
ortasına çıktığı aralığa çekildi — göz odağı tam oraya düşer. `"start 0.6"` = kartın üstü
viewport'un %60'ına girdiğinde başla; `"center 0.45"` = kartın ortası merkezin biraz üstüne
gelince bitir.

### Ama asıl kök neden offset değil — `ref` neyi ölçüyordu (Tur 19b)

İlk düzeltmede sadece offset sayısını değiştirdik ve dönüş HÂLÂ erken bitiyordu. Gerçek sebep:
`ref` en dış div'e bağlıydı ve o div **kartı + altındaki `<Caption>` başlığını birlikte**
kapsıyordu. `useScroll` ölçüm hedefinin geometrisini okur; hedef kart+caption olunca `"center"`
= **kart + caption'ın ortası**, bu nokta kartın görsel merkezinin epeyce ALTINDA. Sonuç: dönüş
penceresi yukarı kayıyor, kart tam ekrana oturmadan progress 1.0'a varıp dönüş bitiyordu —
"daha görmeden dönmüş" tam olarak buydu. Düzeltme yapısal: `ref` yalnız 16:10 kart kapsayıcısına
taşındı, caption ölçüm dışında kaldı. `role`/`aria-label` en dış div'de korundu (erişilebilirlik
kökü kaymasın). Ancak bundan sonra offset kurcalaması tutarlı sonuç verir.

> [!question] Mülakat Sorusu 1b — **"`useScroll({ target: ref })` tam olarak neyin pozisyonunu ölçer, yanlış elemana bağlamak neyi bozar?"**
> `ref`'in işaret ettiği DOM elemanının **bounding box'ını** viewport'a göre ölçer; `offset`'teki
> `start`/`center`/`end` bu kutunun kenarlarına/merkezine göredir. Hedef, görmek istediğinden
> daha büyük bir kapsayıcıysa (ör. kart + altındaki başlık), kutunun merkezi görsel öğenin
> merkezinden kayar → animasyon penceresi kayar, efekt yanlış anda tetiklenir. Ders: `ref` yalnız
> animasyonu sürükleyen görsel öğeyi sarmalasın; ölçüme dahil her ek eleman pencereyi öteler.
> offset "ince ayar", ref hedefi ise "kök tanım" — önce ref'i doğrula.

> [!question] Mülakat Sorusu 1 — **"framer `useScroll` `offset: ['start end', ...]` — bu iki string tam olarak neyi tanımlar?"**
> Her offset iki jeton taşır: **birincisi hedef elemanın kenarı**, **ikincisi viewport'un
> kenarı/oranı**, ve bunların çakıştığı an bir progress kilometre taşıdır. `"start end"` =
> elemanın ÜSTÜ (`start`) viewport'un ALTINA (`end`) değdiği an → progress 0. `"center center"`
> = elemanın merkezi viewport merkezinde → progress 1. Sayısal biçim de geçerli: `"start 0.75"`
> = elemanın üstü, viewport'un tepesinden %75 aşağıda. Yani ilk çift animasyonun BAŞLADIĞI
> hizayı, ikincisi BİTTİĞİ hizayı söyler — ikisi arası scroll'da 0→1 lineer akar. Sık hata:
> iki jetonu "eleman-eleman" ya da "viewport-viewport" sanmak; doğrusu **eleman kenarı ↔
> viewport konumu**.

---

## 2. Sinematik 3D — dört katman, hepsi aynı `scrollYProgress`'e bağlı

"Havada dönen kart" hissi tek bir `rotateY`'la olmuyor; dönüşe derinlik + canlılık katan dört
`useTransform` eklendi. Hepsi aynı progress'e abone, yani hepsi scroll'la senkron akar:

```tsx
const rotateY = useTransform(scrollYProgress, [0, 1], [-180, 0]);         // eski→ürün
const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [0, 6, 0]);    // hafif tepeden eğim
const scale   = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1.04, 1]); // orta nabız
```

`rotateY` bitiş yüzü HER ZAMAN ürün ekranı olacak şekilde `-180→0` (Gün 49 kararı: efekt
argümanın hizmetinde). `scale` ve `rotateX` **üç noktalı**: uçlarda oturur (0 ve 1), ortada
(0.5) zirve yapar → kart dönüşün ortasında hafif öne gelip tepeden eğilir, sonra yerine oturur.

### `perspective` — derinliğin ayar düğmesi

Sarmalayıcının `perspective`'i 3B sahnenin **kamera mesafesidir**: küçük değer = kameraya yakın
= güçlü perspektif = kart hacimli/dramatik döner; büyük değer = uzak = yassı/zayıf efekt. Gün
49'daki `1200px` fazla uzaktı (dönüş yassı görünüyordu). `900px`'e çekildi → 3B belirgin.
Ayrıca `perspectiveOrigin: "50% 40%"` eklendi: bakış noktası merkezin hafif üstünde → sinematik
"tepeden hafif bakış" hissi.

> [!question] Mülakat Sorusu 2 — **"CSS 3B transform'da `perspective` değerini küçültmek görüntüyü nasıl etkiler? Neden?"**
> `perspective` gözün sahneye uzaklığıdır (px). Küçültmek gözü yaklaştırır → yakınsama açısı
> artar → aynı `rotateY` çok daha derin/abartılı görünür; kartın yakın kenarı büyür, uzak kenarı
> küçülür (foreshortening). Büyütmek gözü uzaklaştırır → ışınlar paralelleşir → dönüş ortogonal/
> yassı görünür. Sonsuza giderken perspektif tamamen kaybolur (izometrik). Yani `perspective`
> "ne kadar 3B" düğmesidir; `1200px→900px` daha yakın bakış, daha hacimli dönüş.

### Gölge — string interpolate edilemez, `useMotionTemplate` ile parçalanır

Kart dönüşün ortasında "havadayken" gölgesi derinleşmeli, uçlarda oturmalı. Ama framer-motion
bir MotionValue'ya tek `box-shadow` **string'ini** interpolate ettiremez ("0px 12px 24px …" →
"0px 34px 60px …" arası ara değer üretemez). Çözüm: her sayısal parçayı ayrı MotionValue olarak
sür, sonra bir **template literal** ile birleştir:

```tsx
const shadowBlur  = useTransform(scrollYProgress, [0, 0.5, 1], [24, 60, 30]);
const shadowY     = useTransform(scrollYProgress, [0, 0.5, 1], [12, 34, 16]);
const shadowAlpha = useTransform(scrollYProgress, [0, 0.5, 1], [0.18, 0.42, 0.22]);
const boxShadow = useMotionTemplate`0px ${shadowY}px ${shadowBlur}px -12px rgba(40,35,30,${shadowAlpha})`;
```

`useMotionTemplate` etiketli şablon; içine gömülü MotionValue'lardan **yeni bir MotionValue
string** üretir ve onlar değiştikçe kendini günceller — React render'ı tetiklemeden, doğrudan
style'a yazarak. Ortada blur 60 / y 34 / alpha 0.42 (derin, yayvan), uçlarda oturmuş gölge.

> [!question] Mülakat Sorusu 3 — **"Neden `useTransform` ile `box-shadow`'u doğrudan animasyonlayamazsın, `useMotionTemplate` ne çözer?"**
> `box-shadow` skaler değil, birden çok sayı + renk içeren **bileşik string**. `useTransform`
> sayıdan sayıya (ya da framer'ın tanıdığı renk/birim tipine) ara değer üretir; keyfi string'i
> ("0px 12px 24px …") çözümleyip her parçasını ayrı interpolate edemez. `useMotionTemplate`
> string'i sabit metin + gömülü MotionValue parçalarına böler: sayısal parçaları (`shadowY`,
> `shadowBlur`, `shadowAlpha`) ayrı `useTransform`'larla sürer, template onları her frame'de
> birleştirip tek bir MotionValue<string> verir. Böylece bileşik CSS özelliği, alt bileşenleri
> bağımsız animasyonlanarak "sanki interpolate ediliyormuş gibi" akar.

---

## 3. `backface + shadow` tuzağı ve iki cila kararı

**Tuzak (brief'in uyarısı):** `boxShadow` dönen `motion.div`'e binince, kart 90°'yi geçtikten
sonra gölge de elemanla birlikte 3B'de döner; ikinci yarıda "arkaya" gidip ters/tuhaf
görünebilir. Bu turda gölge x-ofseti **0** ve dönüş yalnız Y ekseni etrafında → 180°'lik dönüş
gölgeyi yatayda aynalar (görünmez, çünkü zaten simetrik), dikey ofset altta kalır. Yani mevcut
haliyle güvenli. **Görsel testte** ikinci yarıda gölge tuhaflaşırsa çözüm: gölgeyi dönmeyen bir
sarmalayıcıya taşı (perspektif div'i ↔ motion.div arasına bir katman) ve `scale`'i orada uygula.
Berke bunu deneyip karar verebilir; şu an gölge dönen kabukta.

**Çift gölge kararı:** ön yüzde eskiden statik `shadow-[var(--shadow-float)]` vardı. Dönen
kabuğa animasyonlu `boxShadow` ekleyince ikisi üst üste binerek dinlenme halinde **daha koyu bir
çift gölge** üretiyordu. Ön yüzün statik gölgesi kaldırıldı → gölge tek ve dönüşle canlı.
Ayrıca `motion.div`'e `rounded-2xl` verildi: box-shadow yuvarlatılmamış elemanın kutusundan
düşer; yüzler yuvarlak, kabuk köşeli olsaydı gölge keskin dikdörtgen olurdu.

> [!question] Mülakat Sorusu 4 — **"3B dönen bir elemana `box-shadow` verdiğinde nasıl bir görsel hata oluşabilir, nasıl kaçınırsın?"**
> `box-shadow` elemanın kendi düzleminde çizilir, sonra eleman gibi 3B transform edilir. Eleman
> 90°'yi geçince gölge de kameraya göre "arkaya" düşer, ters/kayık görünebilir; ayrıca eleman
> `backface-visibility:hidden` olsa da gölge yüzden bağımsız çizildiği için kaybolmaz, dönüşle
> beraber savrulur. Kaçınma: gölgeyi DÖNMEYEN bir sarmalayıcıya koy (yalnız kart döner, gölge
> sabit kalır), ya da gölgeyi simetrik tut (x-ofset 0) ki tek eksenli dönüşün aynalaması
> görünmesin. Bonus: gölge kabuğun köşe yarıçapını izlesin diye dönen elemana da köşe yarıçapı
> ver, yoksa yuvarlak kartın altında keskin dikdörtgen gölge oluşur.

---

## 4. reduced-motion — dokunulmadı, teyit edildi

`StaticCard` (yan-yana öncesi/sonrası) yolu ve mounted-gate mantığı (Gün 49/Tur 18) aynen
korundu. Sinematik efektler yalnız hareketli `FlipCard` yolunda; reduce açıkken hiçbir
scale/shadow/rotate animasyonu yok, iki yüz sabit yan yana durur. Erişilebilirlik modu içerik
eksiltmez ilkesi bozulmadı.

## Ayar sabitleri (Berke görsel testte kurcalar)

Brief'teki sayılar **başlangıç**, "böyle bitecek" değil. İnce ayar için dokunulacaklar:

- **Tetik penceresi:** `offset` içindeki `0.75` ve `0.52` — dönüşün nerede başlayıp bittiği.
- **Nabız:** `scale` orta değeri `1.04`, `rotateX` orta değeri `6`.
- **Gölge derinliği:** `shadowBlur/shadowY/shadowAlpha`'nın orta (0.5) değerleri.
- **Perspektif:** `900px` ve `perspectiveOrigin: "50% 40%"`.

## Açık borçlar

- **#flip-shadow-ayrik-katman:** gölge şu an dönen kabukta; ikinci yarıda tuhaflaşırsa dönmeyen
  sarmalayıcıya taşınacak (bkz. §3 tuzak).
- Gün 49'un açık borçları (favicon/OG, unsplash-bağımlılığı) bu turda kapsam dışı, sürüyor.
