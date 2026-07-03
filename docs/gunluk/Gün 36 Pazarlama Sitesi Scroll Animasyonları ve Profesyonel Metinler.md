# Shift — Gün 36: Pazarlama Sitesi Scroll-Reveal Animasyonları + Profesyonel TR Metinler (Tur 5)

> [!info] Bugünün hedefi Gün 35'in aydınlık/sıcak sitesi **görsel** olarak onaylanmıştı. Bu tur iki iş yaptı, ikisi de "his" işi: (1) **scroll-reveal animasyonları** — aşağı kaydırınca bölümler/kartlar yumuşakça belirsin (Apple.com ve 7shifts'teki akış hissi) + istatistikler **count-up** (0'dan hedefe saysın); (2) **pazarlama metinleri profesyonelleşsin** — 7shifts'in copy _deseninden_ ilham, ama Shift'e özgü, Türkçe, telifsiz. Görsel yön / renk / font / mimari **DEĞİŞMEDİ** — sadece hareket + kelimeler. `web/` ve `src/`'ye yine **SIFIR dokunuş**.

**Tarih:** 3 Temmuz 2026 · **Stack:** Next.js 16.2.9, React 19, Tailwind 4, framer-motion 12, lucide-react · **Durum:** ✅ Tur 5 tamamlandı — 9 bölüm scroll-reveal + stagger, istatistik count-up, tüm metinler `content.ts`/bileşenlere uygulandı, `prefers-reduced-motion` güvenli, dürüstlük çerçevesi korundu (ölçülmemiş "%X tasarruf" iddiası SÖKÜLDÜ); tsc 0, build 0 (SSG), mobil 390px taşma yok.

---

## 1. Ne korundu, ne değişti

**Korundu (elle dokunulmadı):** aydınlık/sıcak palet (paper zemin, ink metin, amber+şeftali aksan, pastel çizelge), insan fotoğrafları + `Photo.tsx` fallback, Plus Jakarta Sans başlık + mono yalnız veri etiketinde, `marketing/` ayrılığı (port 3001, `web/`+`src/` zero-touch), `lib/config.ts` `APP_URL`, spec fiyatları (499/999/1.799/Özel), 9 bölüm yapısı, hero'nun **CSS-keyframe** giriş animasyonu (above-fold, Gün 34 dersi), karşılaştırma matrisi.

**Değişti:** (a) her ana bölüme + kart grubuna **framer `whileInView` reveal** (fade + yukarı kayma) ve **stagger**; (b) istatistik şeridine **count-up**; (c) hero eyebrow/alt-copy, problem/çözüm, modüller, neden-Shift, fiyat, kapanış CTA, footer metinleri — **profesyonel, sonuç-odaklı, dürüst** yeniden yazıldı; (d) modül seti güncellendi (Checklist → Görev Panosu'nun içine katlandı, **Vardiya Havuzu** çekirdek karta çıktı); (e) "ve dahası" gerçek sonraki-faz modüllerine döndü (Stok/Tedarik/Hijyen/İK/Analitik/Çok Şube).

## 2. Scroll-reveal — kavram ve neden bu haliyle

**His:** Apple ve 7shifts'te bir bölüm ekrana girerken hafifçe **alttan yukarı süzülür + belirir** (opacity 0→1, y 24→0), ~0.5s, yumuşak ease-out. Kart grupları **tek tek** akar (stagger). Bu "sayfa yaşıyor" hissini verir ama dikkat dağıtmaz.

Uygulama üç parça (`components/Reveal.tsx`):

- **`Reveal`** — tek bölüm/blok sarıcısı. `whileInView={{opacity:1, y:0}}`, `viewport={{once:true, amount:0.2}}`.
- **`RevealStagger` + `RevealItem`** — kart ızgaraları. Konteyner çocuklarına **artan `delay`** enjekte eder; her çocuk kendi `whileInView`'iyle açılır → "kartlar sırayla akar" hissi.
- **`CountUp`** — bu turda eklendi (§3).

> [!question] Mülakat Sorusu **"framer'da stagger için hazır `staggerChildren`/`variants` varken neden `delay`'i elle enjekte ettin?"** Cevap: framer-motion 12 + React 19 kurulumunda **string variant-label propagasyonu** (`animate="show"` → çocuk `variants`) bu ortamda güvenilir tetiklenmiyordu; öğeler `opacity:0`'da takılabiliyordu (Gün 34'te bu bir kez ısırdı). Kararlı yol: her yerde **obje-tabanlı** `initial/whileInView` + stagger'ı `React.Children.map` ile `cloneElement` üzerinden `delay` olarak vermek. Sonuç aynı görünür, ama kırılgan string-label yoluna bağımlı değil. "En zarif API değil, en dayanıklı olan" tercihi.

> [!question] Mülakat Sorusu **"Neden parallax / scroll-jacking / pinning yok? Apple bunları yapıyor."** Cevap: Bilinçli **yapılmadı** (gap değil, karar). Parallax ve scroll-jacking mobilde titrer, erişilebilirliği bozar, `prefers-reduced-motion` ile uyumu zordur ve bakım maliyeti yüksek. Bu site için "hafif + sağlam" > "gösterişli + kırılgan". Sadece reveal + stagger + count-up: her cihazda akıcı, her zaman güvenli.

## 3. Count-up — istatistikler 0'dan hedefe saysın

İstatistik şeridindeki sayılar (10 dk, 5–50, 11) viewport'a girince **0'dan hedefe akar**. `CountUp` bileşeni: `useInView(once, amount:0.6)` ile tetiklenir, framer'ın `animate(0, to, …)`'ı `onUpdate`'te `Math.round` ile bir `useState`'i besler. `prefix`/`suffix` metni sabit kalır (ör. `10` sayar, ` dk` sabit).

> [!important] Reduced-motion + "asla boş kalmaz" garantisi `prefers-reduced-motion: reduce` → sayı **direkt hedefte** başlar (0'da takılmaz), reveal'ler kapanır, içerik yerinde. Bu hem erişilebilirlik hem de Gün 34 dersinin devamı: **hiçbir koşulda içerik animasyon-bekler halde görünmez/boş kalmaz.** `once:true` → bir kez sayar, her scroll'da tekrar tetiklenip yormaz.

> [!question] Mülakat Sorusu **"Headless screenshot'ta count-up'ı '4 dk' diye yakaladın — bu bir bug mu?"** Cevap: Hayır, **tam tersi kanıt**. `img/tur5-countup-midanim.png`'de sayılar `4 dk / 5–19 / 4` — hepsi ~%40 ilerlemede: yani screenshot animasyon _ortasında_ düştü, bu da count-up'ın gerçekten çalıştığını gösterir. Temiz "yerleşmiş" deliverable için ise `--force-prefers-reduced-motion` ile çektim (§7) → `10 dk / 5–50 / 11` son değerde. Aynı numara reduced-motion yolunu da doğrular: tek taşla iki kuş.

## 4. Metinler — 7shifts deseni, Shift'e özgü, telifsiz

7shifts'in copy formülü (analiz): **somut fayda vaadi + ağrı noktası isimlendirme + "sektörü bilen biri yaptı" hikayesi + sonuç-odaklı özellik başlıkları.** Bu desenle, ama 7shifts'in cümleleri _birebir çevrilmeden_, özgün TR metin yazıldı. Öne çıkanlar:

- **Hero eyebrow:** "Kafede çalışmış biri tarafından, kafeler için yapıldı." · **Alt-copy** güçlendirildi (planlamadan giriş-çıkışa… 10 dakikada kur, bugün başla).
- **Modüller sonuç-odaklı başlıklarla** ("ne yapar" değil "sana ne kazandırır"): Vardiya Çizelgesi → _"Haftalık programı dakikalar içinde kur"_, Görev Panosu → _"Hiçbir iş unutulmasın"_, Giriş-Çıkış → _"Mesai hesabı elle bitsin"_, Vardiya Havuzu → _"'Bugün gelemiyorum' krize dönüşmesin"_, Duyuru → _"Herkes aynı bilgiyle çalışsın"_.
- **Neden Shift:** "7shifts'in bıraktığı yerde, Türkiye için." + 4 dürüst fark kartı (İş Kanunu mesai / KVKK-tedarik-hijyen / Türkçe kafe diliyle / **İçeriden yazıldı**).
- **Fiyat:** "Şube başına, aylık. Sürpriz yok." · **Kapanış CTA:** "Tanıdık kafelerle ücretsiz pilot başlıyoruz." (brief'teki "KafenNI" yazım hatası → **"Kafeni"** düzeltildi.)

> [!important] Dürüstlük çerçevesi — ölçülmemiş "%50" iddiası SÖKÜLDÜ 7shifts "%80 zaman tasarrufu" gibi **kendi ölçtüğü** verileri kullanıyor; bizim henüz müşteri verimiz **yok**. Eski istatistik şeridindeki `%50 daha az WhatsApp trafiği` **uydurma-istatistik riskiydi** ve kaldırıldı. Yerine yalnız doğrulanabilir çerçeve rakamları: `Tek çatı` (niteliksel) · `10 dk` kurulum · `5–50` personel · `11` modül. Rakamlar "iddia" değil "vaat/çerçeve" tonunda. Pilot verisi gelince gerçek "%X" iddiaları eklenecek — o zamana kadar dürüst kalıyoruz.

> [!question] Mülakat Sorusu **"Checklist gerçek bir Faz-1 modülü; neden çekirdek karttan çıkarıp Görev Panosu'nun içine kattın?"** Cevap: Landing'in işi 11 modülü dökmek değil, **5 güçlü vaat** sunmak (spec 12.1 "derinlik > genişlik"). Checklist operasyonel olarak görev akışının parçası ("açılış/kapanış checklist'leri" = tekrar eden görev), o yüzden Görev Panosu kartının nokta-listesine doğal oturdu. Boşalan çekirdek slot, satışta daha _kanca_ olan **Vardiya Havuzu**'na (WhatsApp takas kaosunu çözen, 7shifts'in de öne çıkardığı özellik) verildi. Modül _kaybolmadı_, hikâyedeki yeri değişti.

## 5. Bileşen değişiklikleri (özet)

| Dosya | Değişiklik |
|---|---|
| `components/Reveal.tsx` | `CountUp` eklendi (framer `animate` + `useInView` + reduced-motion). |
| `components/SocialProof.tsx` | `STATS` → `CountUp` (sayısal olanlar) / düz metin (`Tek çatı`). |
| `components/Modules.tsx` | İkon haritası `ListChecks`→`ArrowRightLeft` (Vardiya Havuzu). |
| `components/WhyShift.tsx` | İkon `Boxes`→`Coffee` (İçeriden yazıldı kartı) + başlık/alt metin. |
| `components/{Hero,ProblemSolution,Pricing,PilotCTA,Footer}.tsx` | Metin güncellemeleri; PilotCTA kartına `Reveal` sarıcı. |
| `lib/content.ts` | `PROBLEM_SOLUTION`, `CORE_MODULES`, `STATS`, `WHY_CARDS`, `MORE_MODULES` yeniden yazıldı. |

## 6. Kalite tabanı (korundu + genişletildi)

- `prefers-reduced-motion: reduce` → **tüm** scroll animasyonu + count-up kapanır, içerik yerinde (§3'te ekran görüntüsüyle doğrulandı).
- `once:true` her reveal/count-up'ta → tekrar tetiklenmez.
- Above-the-fold hero girişleri hâlâ **saf CSS keyframe** (JS/hydration'a bağlı değil) → arka plan sekmesinde bile görünür.
- Animasyonlar yumuşak ve hızlı (0.4–0.6s reveal, 1.2s count-up), abartısız; parallax/scroll-jacking yok.
- tsc 0 · `next build` 0 (SSG, 3 statik sayfa) · mobil 390px yatay taşma yok · konsol hatasız.

## 7. Ekran görüntüleri (headless PNG)

Chrome `--headless=new --screenshot` + **uzun `--window-size`** (tüm bölümler viewport içinde → `whileInView` tetiklenir) + `--force-prefers-reduced-motion` (count-up son değerde "yerleşmiş" görünür). Gerçek sayfa yüksekliği CDP `Runtime.evaluate` (`scrollHeight`) ile ölçüldü: masaüstü 1440×6015, mobil 390×10389.

![Masaüstü — tam sayfa (yerleşmiş)](img/tur5-desktop.png)

![Mobil 390px — tam sayfa](img/tur5-mobile.png)

![Count-up hareket halinde (screenshot animasyon ortasında düştü: 4 dk / 5–19 / 4)](img/tur5-countup-midanim.png)

## 8. Bu turda çıkan/duran gap'ler

- **Parallax/scroll-jacking** → bilinçli yapılmadı (karar, gap değil).
- **Gerçek ölçülmüş istatistikler** ("%X tasarruf") → pilot verisi gelince eklenecek.
- Önceki gaplar değişmedi: **#P1** lead backend, **#P2** KVKK metni, **#P3** domain deploy, **#P6** OG/favicon.

---

**Özet:** Site artık hem _kayarken yaşıyor_ (reveal + stagger + count-up) hem de _profesyonelce konuşuyor_ (7shifts deseni, özgün TR, dürüst çerçeve). Hareket sakin ve erişilebilir; metin somut fayda + ağrı noktası + "içeriden yazıldı" hikâyesiyle satıyor, uydurma istatistik yok. `web/`+`src/` git diff temiz.
