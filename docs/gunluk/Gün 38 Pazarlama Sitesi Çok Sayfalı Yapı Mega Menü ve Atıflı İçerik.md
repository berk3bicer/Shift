# Gün 38 — Pazarlama Sitesi Tur 7: Çok Sayfalı Yapı, Mega Menü ve Atıflı İçerik Sayfası

**Kapsam:** `marketing/` tek sayfadan (anchor-scroll) **10 route'luk çok sayfalı siteye** dönüştü — 7shifts www deseni. `web/` + `src/` sıfır dokunuş (git diff temiz).

---

## 1. Route haritası (hepsi SSG, build'de statik prerender)

```
/                          Ana sayfa (landing korundu; Nav+Footer artık layout'ta)
/moduller                  11 modülün özeti: 6 detay kartı (linkli) + yol haritası şeridi (linksiz)
/moduller/vardiya          Vardiya & Planlama     (spec Modül 1)
/moduller/gorev            Görev & Checklist      (spec Modül 2)
/moduller/giris-cikis      Giriş-Çıkış & Mesai    (spec Modül 3, TR farkı güçlü)
/moduller/vardiya-havuzu   Vardiya Havuzu         (spec Modül 1.4)
/moduller/stok-tedarik     Stok & Tedarik         (spec Modül 4+5) — "Faz 2 — Yakında" rozetli
/moduller/hijyen           Hijyen & HACCP         (spec Modül 6)   — "Faz 3 — Yakında" rozetli
/neden-shift               Dürüst karşılaştırma + TAM matris (spec 1.5, 4 sütun × 11 satır)
/fiyatlar                  Pricing (spec 12.3) + güven şeridi + SSS (native <details>)
/kaynaklar/kafe-rehberi    İÇERİK SAYFASI — atıflı gerçek veri (aşağıda)
```

Mimari kararlar:
- **Ortak Nav + Footer `app/layout.tsx`'e taşındı** — sayfalar yalnız içerik render eder.
- **Modül detayları tek dinamik route** (`/moduller/[slug]` + `generateStaticParams`) — 6 sayfa tek şablon, içerik `lib/modules.ts`'te veri olarak (spec'ten birebir, MVP/Faz/TR etiketleriyle). Şablon: hero+mock → özellikler → nasıl çalışır (3 adım) → TR farkı → CTA bandı.
- Her derin sayfada **CTA bandı** (`CtaBand.tsx`): kompakt koyu bant; büyük pilot formu ana sayfada kaldı, bant oraya (`/#pilot`) yönlendirir.
- Karşılaştırma matrisi `ComparisonTable` olarak dışa çıkarıldı — landing sade `COMPARISON`'ı, `/neden-shift` genişletilmiş `COMPARISON_FULL`'u aynı bileşenle çizer.
- 2 yeni DOM-mockup: `StockMock` (PAR uyarısı + sipariş çipi), `HygieneMock` (checklist + sıcaklık kayıtları) — mevcut Frame/palet dili.

## 2. Mega-menü nav (7shifts deseni)

- **Modüller ▾**: 6 modül (ikon + tek satır + "Yakında" rozetleri) + altta "Tüm modüller →". **Kaynaklar ▾**: Kafe Rehberi + "Blog — yakında" (linksiz placeholder). Neden Shift / Fiyatlar direkt link.
- Hover VE tıkla açılır; kapanışta 140ms gecikme (imleç panele inerken düşmesin); Escape kapatır; `aria-expanded/haspopup`; route değişince otomatik kapanır (`usePathname` effect).
- **Mobil:** hamburger → tam menü, Modüller/Kaynaklar accordion (tek grup açık).
- Panel girişi **CSS keyframe** (`.anim-settle`) — framer mount-animate arka plan/headless'ta yarı saydam takılıyordu (Gün 34 dersinin tekrarı; aşağıda #3'le aynı kök aile).

## 3. KÖK NEDEN AVI: reduced-motion'da görünmez içerik (gerçek a11y bug'ı)

Ekran görüntüsü doğrulamasında yeni sayfalar `--force-prefers-reduced-motion` altında **boş** çıktı; ana sayfa çıkmadı. Sistematik daralttık:

1. Dev'de "compile yarışı" hipotezi → prod build + `next start`'a geçildi → **hâlâ boş** (hipotez çürüdü).
2. DOM dump karşılaştırması: takılan sayfalarda reveal öğelerinde SSR'dan gelen `style="opacity:0;transform:…"` **aynen duruyor**; çalışan sayfalarda stil temizlenmiş.
3. Kök neden: eski reduce yolu `initial={false} + whileInView={undefined}` idi → framer öğeye **hiç stil yazmıyor**; SSR (sunucuda `useReducedMotion`=null → falsy) hep `opacity:0` basıyor; **React 19 hydration attribute uyuşmazlığını yamamıyor** (sadece uyarır) → reduce açık kullanıcıda içerik SONSUZA DEK gizli.
4. Fix (`Reveal`/`RevealX`/`RevealItem`): reduce'ta `initial={{opacity:1, …:0}}` (açık görünür değer → framer mount'ta stili **imperatif yazar**, SSR kalıntısını ezer) + `whileInView` hep tanımlı + `transition={reduce ? {duration:0} : …}`. Animasyonlu yol birebir korundu (canlıda doğrulandı: viewport'takiler görünür, altı scroll bekliyor).

> [!question] Mülakat Sorusu — **"SSR + animasyon kütüphanesi + prefers-reduced-motion üçlüsünde ne ters gidebilir?"**
> Cevap: Sunucu kullanıcının tercihini bilemez → SSR "animasyon başlangıç" stilini (opacity:0) basar. İstemcide tercih "reduce" çıkarsa ve kod animasyonu tamamen kapatırsa, o stili **geri alacak kimse kalmaz**; React 19 hydration'da attribute farklarını düzeltmez. Doğru desen: reduce yolunda hedef durumu AÇIK değerlerle render etmek (duration:0), "hiçbir şey yapma" ile değil. "Hareket yok" ≠ "stil yok".

## 4. Chrome headless'ın gizli 500px tabanı (mobil screenshot tuzağı)

375px mobil çekimlerde tüm sayfalar sağdan kırpık çıktı; canlıda `scrollWidth=375` (taşma yok). Deney: `--window-size=375` → `innerWidth=500`. **Chrome headless pencereyi 500px altına indirmiyor**; PNG 375'e kırpılınca "taşma" illüzyonu doğuyor. (Gün 36'nın 390px mobil çekimlerinde de aynı kusur varmış — fark edilmemiş.)
Çözüm: `playwright-core` (npm'den yalnız sürücü; tarayıcı ~/Library/Caches/ms-playwright'taki mevcut chromium_headless_shell) → gerçek 375 viewport + `reducedMotion:"reduce"` + `fullPage` (yükseklik ölçmek de gereksizleşti). Script her sayfada `scrollWidth==viewport` assert ediyor → **375'te taşma olmadığı programatik kanıtlı**.

## 5. /kaynaklar/kafe-rehberi — dürüstlük çerçevesi

7shifts'in emsal sayfası kendi 1.074 kişilik anketine dayanır; **bizim öyle verimiz yok** → "biz araştırdık" tonu YASAK (Berke onaylı çerçeve). Uygulanan kurallar:
- Sayfa başında **görünür şeffaflık kutusu**: "veriler resmi mevzuata ve üçüncü taraf araştırmalara dayanır; kendi anketimiz henüz yok; pilot verisi geldikçe güncellenecek."
- 4 insight kartı — her biri kaynak linkli, "Shift bunu nasıl çözer" + ilgili modül sayfasına link:
  1. **45s/11s/%50** — 4857 sayılı İş Kanunu Md. 41/63 (mevzuat.gov.tr, resmi metin linki). Count-up 45.
  2. **%3–9 net kâr marjı** — Toast sektör analizi (link; içerik WebSearch ile doğrulandı: 3–9 bandı güncel raporlarla tutarlı). Count-up 9.
  3. **Personel devri** — SAYI VERMEDEN niteliksel; atıf akademik çalışma (ResearchGate, organize perakende/Türkiye). TİSK'e özgü link bulunamadı → "TİSK'e göre" DENMEDİ (uydurma atıf yerine bulunabilen gerçek kaynak).
  4. **WhatsApp+Excel+kağıt** — açıkça "istatistik değil, sahadan gözlem" etiketiyle; yüzde yok. Kart rozeti "Sahadan gözlem".
- Sayfa altında kaynak listesi + "mevzuat yorumu değildir" notu + erişim tarihi.

Diğer dürüstlük kararları: stok-tedarik/hijyen sayfaları hero'da "Faz 2/3 — Yakında" rozeti + CTA metni "çekirdek modüllerle bugün başla" (olmayan modül satmıyor); `/neden-shift` TAM matrisinde Shift sütunundaki inşa edilmemiş satırlar yeşil tik DEĞİL amber "Faz 2/3" etiketi; SSS'te "stok fiyata dahil mi?" sorusuna "henüz yayında değil" cevabı; `/moduller`'de sayfası olmayan modüller linksiz yol-haritası kartı.

## 6. İrili ufaklı düzeltmeler

- SWC/Turbopack, satır içi kapanış etiketinden SONRAKİ boşluğu yutuyor (`</em> için` → "operasyonuiçin") → riskli 5 yerde açık `{" "}`.
- `Pricing`'e `hideHeader` prop'u (sayfa hero'suyla çakışmasın); "İletişime geç" `#pilot`→`/#pilot` (artık iki sayfada render ediliyor).
- Footer kolonları gerçek route'lara + `next/link`.

## 7. Doğrulama

- `tsc` 0 · `next build` 0 — 13 statik sayfa (6'sı generateStaticParams'lı SSG).
- Route geçişleri GERÇEK (client-side nav; menüden tıklamayla doğrulandı, panel rotada kapanıyor).
- 24 PNG `docs/gunluk/img/tur7-*.png`: 11 sayfa × masaüstü(1440)+mobil(375) + mobil menü ×2. Mobilde taşma yok (assert'li).
- App/backend regresyon riski yok: `web/` + `src/` diff boş.

## 8. Gap'ler (etiketli, kapatılmadı)

- Blog/CMS altyapısı → statik placeholder ("Blog — yakında").
- Kendi pilot verimizle içerik → pilot sonrası (şeffaflık kutusu bunu zaten ilan ediyor).
- İşletme-tipi sayfaları ("Built for Bakeries" benzeri) → sonraki tur.
- Önceki gap'ler durur: #P1 lead backend, #P2 KVKK metni, #P3 domain, #P6 OG/favicon.

> [!question] Mülakat Sorusu — **"6 modül sayfasını neden 6 ayrı page.tsx değil tek dinamik route yaptın?"**
> Cevap: Şablon tutarlılığı sözleşmeye döner (veri tipi `ModulePage` alanları eksikse tsc kırılır), yeni modül sayfası = `lib/modules.ts`'e bir kayıt, tasarım düzeltmesi tek dosyada 6 sayfayı düzeltir. `generateStaticParams` ile çıktı yine 6 statik HTML — SSG maliyeti sıfır. Trade-off: sayfaya özgü serbest bölüm eklemek zorlaşır; o gün gelirse slug'a koşullu bölüm ya da MDX'e geçiş.
