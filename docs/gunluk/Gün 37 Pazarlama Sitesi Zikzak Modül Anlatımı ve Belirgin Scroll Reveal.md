# Shift — Gün 37: Zikzak Görselli Modül Anlatımı + Belirgin Scroll-Reveal + Metin Temizliği (Tur 6)

> [!info] Bugünün hedefi Tur 6 üç iş istedi: (1) **iki metni sil** — hero'daki "Ayşe giriş yaptı · 08:02" chip'i ve "kafede çalışmış biri / içeriden yazıldı" temasının tamamı; (2) 7shifts'in asıl "ürünü görüyorum" bölümü olan **alternating (zikzak) görselli feature blokları** — her çekirdek modül kendi sahnesinde, bir yanda ürün mockup'ı bir yanda metin; (3) Tur 5'te eklenen scroll geçişleri **zayıf/görünmez kalıyordu** — kök nedeni bul, gerçekten hissedilir yap. Görsel yön / renk / font / mimari DEĞİŞMEDİ; `web/` + `src/` yine **SIFIR dokunuş**.

**Tarih:** 3 Temmuz 2026 · **Stack:** Next.js 16.2.9, React 19, Tailwind 4, framer-motion 12, lucide-react · **Durum:** ✅ Tur 6 tamamlandı — 4 modüllük zikzak showcase (ShiftGrid + 3 yeni DOM-mockup), scroll-reveal kök nedeni bulunup düzeltildi (tetik `amount` → negatif `rootMargin` + mesafe 20→36px + yatay `RevealX`), iki metin her yerden silindi; tsc 0, build 0 (SSG), mobil 375px taşma 0px, reduced-motion tam sayfa doğrulandı.

---

## 1. Parça 1 — Silinenler ve yerine gelenler

- **"Ayşe giriş yaptı · 08:02" chip'i** (hero fotoğrafı üstündeki bindirme) → tamamen kaldırıldı. Çizelge kartı (ShiftGrid) hero'da duruyor.
- **Hero eyebrow** "Kafede çalışmış biri tarafından, kafeler için yapıldı." → **"Kafe ve restoranlar için hepsi-bir-arada operasyon platformu"** (nötr, ürün-odaklı).
- **Neden-Shift "İçeriden yazıldı" kartı** → **"10 dakikada kurulum"** kartı (ikon `Coffee`→`Zap`, rozet "Kolay başlangıç"). Kart sayısı 4'te kaldı; yeni kart gerçek bir farklılaştırıcı (spec 1.2/12.1: kurulum kolaylığı, register+onboarding wizard Gün 32'de gerçekten inşa edildi — boş vaat değil).
- `grep` ile doğrulandı: "içeriden", "kafede çalışmış", "giriş yaptı" ifadeleri `marketing/` içinde artık **hiçbir dosyada yok**.

## 2. Parça 2 — Zikzak feature blokları (7shifts deseni)

Düz 6'lı kart ızgarası yerine, **kartların dönüştürülmesi** seçildi (altına ikinci bir showcase eklemek aynı içeriği iki kez anlatacaktı — tekrar riski). Yeni yapı (`Modules.tsx`):

1. Bölüm başlığı korundu ("Genişlik değil, derinlik.")
2. **4 zikzak blok** — `CORE_MODULES`'tan `vardiya / gorev / puantaj / havuz`. Her blok `lg:grid-cols-2`, dikey ortalı, bloklar arası `space-y-20 sm:space-y-28` (havadar). Çift bloklar görsel-sol/metin-sağ, tekler ters (`lg:order-2`). Mobilde tek kolon: **görsel üstte** (DOM sırası), metin altta.
3. **Duyuru + "ve dahası"** altta kompakt 2'li şerit olarak kaldı — içerik kaybolmadı, hiyerarşisi değişti.

**Mockup kararı — gerçek DOM, stok foto değil** (`FeatureMocks.tsx`): hero'daki ShiftGrid ile aynı felsefe; sıcak beyaz kart + pastel rol paleti (`--color-barista/kasiyer/komi`), UI-mavisi/generic görünüm bilinçli yok:

| Modül | Görsel | İçerik detayı |
|---|---|---|
| Vardiya Çizelgesi | **ShiftGrid yeniden kullanıldı** (hero'daki canlı çizelge) | renk kodlu bloklar, "Aç" vardiya hücresi |
| Görev Panosu | `KanbanMock` — 3 sütun mini Kanban | Yapılacak/Devam/Tamam, foto-kanıt ikonu, üstü çizili tamamlar |
| Giriş-Çıkış & Mesai | `TimeclockMock` — koyu QR/PIN kiosk + haftalık mesai listesi | 42s/45s amber uyarı çubuğu, "fazla mesai %50 zamlı" dipnotu |
| Vardiya Havuzu | `PoolMock` — sun→kap akışı | "Ayşe sundu → Mehmet kaptı ✓ Onaylandı" + "Onay bekliyor" ikinci kart, İş Kanunu dipnotu |

Her mockup dekoratif: kök `role="img"` + Türkçe `aria-label`, iç DOM `aria-hidden` (ekran okuyucu 40 parça mini-metin yerine tek anlamlı cümle duyar). Görsel sahnesi: krem/şeftali-krem (`cream`/`cream-2` dönüşümlü) yuvarlak panel + hafif sıcak radial ışıma.

> [!question] Mülakat Sorusu **"Ürün mockup'larını neden screenshot ya da görsel dosya değil, CSS/DOM ile yaptın?"** Cevap: (1) Gerçek app screenshot'ı yok — app'in görsel dili henüz pazarlama kalitesinde değil ve her app değişikliğinde görsel eskir; (2) DOM-mockup **sitenin kendi token'larını** kullanır (palet, font, radius) → hero'daki çizelgeyle mükemmel tutarlı, retina'da her boyutta keskin, dark-bg'siz; (3) bakımı kod diff'iyle görünür, binary asset yönetimi yok. Trade-off: DOM-mockup "ürünün gerçek görüntüsü değil" — bu bilinçli bir gap (aşağıda etiketli), pilot olgunlaşınca gerçek screenshot'larla değişecek.

## 3. Parça 3 — Scroll-reveal kök neden analizi ve düzeltme

**Kök neden (ölçülerek bulundu):** Tur 5'teki `viewport={{ amount: 0.2 }}` tetiklemesi, öğe viewport'un **en alt kenarında** %20'si görünür olur olmaz animasyonu başlatıyordu. Kullanıcı o sırada ekranın ortasına bakıyor; reveal ekran kenarında, göz oraya varmadan bitiyor. Üstüne `y: 20px` mesafe zaten algı eşiğinin altında → "animasyon yok" hissi.

**Düzeltme (`Reveal.tsx`):**

- **Tetik çizgisi:** `amount` yerine **negatif alt rootMargin** — `viewport={{ once: true, margin: "0px 0px -15% 0px" }}`. Öğe alt kenardan %15 **içeri girince** oynar: tam kullanıcının baktığı bölgede. (`RevealItem`'da -%12: kart ızgaraları biraz daha erken akmaya başlar, stagger 0.08→0.1 ile sıra hissi netleşti.)
- **Mesafe:** `Reveal` y 20→**36px**, `RevealItem` 24→**32px** — hissedilir ama sarsıntısız; süre 0.6s, ease `[0.22,1,0.36,1]` (yumuşak out).
- **Yeni `RevealX`:** zikzak blokları için yatay reveal — görsel geldiği taraftan `x: ±32→0` + fade, metin karşı taraftan `delay: 0.1` ile. Yalnız `transform`+`opacity` (layout tetiklemez); `Modules` section'ına `overflow-hidden` eklendi ki x-ofset animasyon sırasında yatay scroll doğurmasın.

**Scroll davranışı sadece screenshot'la değil, ölçümle doğrulandı** (DevTools eval, gerçek scroll):

```
blok viewport'un 50px altında  → opacity: 0, transform: translateX(-32px)  (bekliyor)
blok ekrana %25 girdi, +150ms  → opacity: 0.30, x: -22.1px                 (TAM O ANDA oynuyor)
+800ms                         → opacity: 1, transform: none               (yerine oturdu)
```

Ayrıca sayfa başında 37 reveal öğesinin **37'si** fold altında `opacity: 0`'da bekliyor (above-fold hero CSS-keyframe'de, hiçbir şey animasyon-bekler görünmüyor — Gün 34 dersi sabit).

> [!question] Mülakat Sorusu **"IntersectionObserver'da `threshold` (framer `amount`) ile `rootMargin` (framer `margin`) farkı ne; reveal için neden `rootMargin` doğru araç?"** Cevap: `threshold` öğenin **yüzde kaçının** kesiştiğine bakar — tetik anı öğenin *boyutuna* bağlıdır ve kesişim viewport'un tam kenarında başlar. `rootMargin` ise **gözlem alanının kendisini** büyütüp küçültür: `-15%` alt marj, "viewport'un alt %15'ini sayma" demek → öğe boyutundan bağımsız, ekranın *kullanıcının gerçekten baktığı* bölgesine giriş anını yakalar. Reveal UX'inde istenen şey "öğe göz hizasına girerken oyna" olduğundan doğru araç `rootMargin`; `amount` büyük bloklarda ya çok erken (kenarda) ya hiç (öğe viewport'tan büyükse %20'ye ulaşamaz) tetiklenir.

> [!question] Mülakat Sorusu **"Animasyonu 'hissedilir' yapmakla 'rahatsız edici' yapmak arasındaki çizgiyi nasıl çektin?"** Cevap: Üç sınır koyduk: (1) **mesafe** 32–36px — insan gözünün "hareket var" dediği eşiğin üstü ama içeriğin "zıpladığı" 60px+ bölgesinin altı; (2) **süre/ease** 0.55–0.65s + agresif olmayan ease-out — Apple/7shifts bandı, sarsıntı yok; (3) **bir kez** (`once:true`) ve **yalnız transform+opacity** — scroll-up'ta tekrar oynayıp yormaz, layout reflow tetiklemez. Ve mutlak taban: `prefers-reduced-motion` → tüm reveal'ler kapalı, içerik yerinde. "Hissedilir" olan animasyonun kendisi değil, *sayfanın scroll'a cevap vermesi*; rahatsız eden ise kontrolün kullanıcıdan alınması (parallax/scroll-jacking) — o çizgiyi hiç geçmedik.

## 4. Doğrulama

- **tsc 0, build 0** (SSG, 3 statik sayfa).
- **Silme kontrolü:** `body.innerText` üzerinde "giriş yaptı" / "İçeriden yazıldı" / "Kafede çalışmış" → yok; yeni eyebrow + yeni kart → var.
- **Zikzak:** 4 blok; masaüstünde sıra dönüşümlü, mobil 375px'te tek kolon görsel-üst/metin-alt, yatay taşma **0px** (animasyon sırasında da — `overflow-hidden`).
- **Reduced-motion:** tam sayfa PNG'ler `--force-prefers-reduced-motion` ile alındı — masaüstü (1440×7436) ve mobil (375×12598) baştan sona eksiksiz render; hiçbir içerik gizli kalmıyor. → `img/tur6-desktop.png`, `img/tur6-mobile.png`
- **Öz-eleştiri (brief istedi):** Geçişler artık gerçekten hissediliyor mu? **Evet — ölçümle:** tetik anı ekrana-girişte (yukarıdaki tablo), 36px mesafe + iki-yandan-kayma belirgin. Zikzak profesyonel mi? Kompozisyon ve mockup tutarlılığı iyi; en zayıf nokta mockup'ların **gerçek ürün görüntüsü olmaması** (etiketli gap) ve `TimeclockMock`'taki koyu kiosk panelinin sayfanın tek koyu above-footer öğesi olması — bilinçli bırakıldı (kiosk gerçekte koyu ekran, kontrast hikâyeyi güçlendiriyor) ama Berke isterse açık varyanta çevrilir.

## 5. Dosya değişiklikleri (özet)

| Dosya | Değişiklik |
|---|---|
| `components/Hero.tsx` | "Ayşe giriş yaptı" chip'i silindi; eyebrow nötr ürün cümlesine döndü. |
| `lib/content.ts` | `WHY_CARDS`: "İçeriden yazıldı" → "10 dakikada kurulum" (`Zap`, "Kolay başlangıç"). |
| `components/WhyShift.tsx` | İkon haritası `Coffee`→`Zap`. |
| `components/Reveal.tsx` | Tetik `amount`→negatif `rootMargin`; y 20→36 / 24→32; stagger 0.1; **`RevealX` eklendi** (yatay reveal). |
| `components/FeatureMocks.tsx` | **YENİ** — `KanbanMock`, `TimeclockMock`, `PoolMock` (DOM-mockup, sıcak palet, a11y-etiketli). |
| `components/Modules.tsx` | Düz kart ızgarası → **4 bloklu zikzak showcase** + Duyuru/"ve dahası" kompakt şerit; section `overflow-hidden`. |
| `.claude/launch.json` | `shift-marketing` (port 3001) dev-server konfigürasyonu eklendi (doğrulama aracı). |

## 6. Bu turda etiketlenen gap'ler (kapatılmadı)

- **Gerçek app screenshot'ları** — DOM-mockup'lar pilot/app olgunlaşınca gerçek görüntülerle değişecek.
- **Ağır parallax / scroll-jacking / pinning** — bilinçli yapılmadı (mobil + erişilebilirlik kararı, Gün 36'dan sabit).
- Önceki gaplar değişmez: **#P1** lead backend, **#P2** KVKK metni, **#P3** domain deploy, **#P6** OG/favicon.
