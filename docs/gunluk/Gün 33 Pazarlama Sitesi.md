# Shift — Gün 33: Pazarlama Sitesi (`marketing/`) — 7shifts `www` Karşılığı

> [!info] Bugünün hedefi App tarafının "kaydol → kur → kullan" zinciri (Gün 32) tamamdı. Bu tur 7shifts modelinin **`www` (pazarlama) yüzeyini** kuruyoruz: ürünü tanıtan, halka açık, oturumsuz, SEO'lu statik site. Kritik mimari karar: bu **`web/` app'inden FİZİKSEL OLARAK AYRI bir Next projesi** — ayrı klasör, ayrı `node_modules`, ayrı port, ayrı deploy. App'e / PWA'ya / service worker'a / proxy'ye / backend'e **sıfır dokunuş.**

**Tarih:** 2 Temmuz 2026 **Stack:** Next.js 16.2.9, React 19, TypeScript, Tailwind 4 (app ile aynı ki tanıdık gelsin, ama bağımsız) **Durum:** ✅ Gün 33 tamamlandı — `marketing/` ayrı proje, :3001'de çalışıyor; hero (canlı vardiya ızgarası) + problem/çözüm + modüller + neden-Shift + fiyat + pilot formu + footer; tsc 0, build 0 (statik SSG), `web/` ve `src/` git'te **tertemiz**.

---

## 1. Neden ayrı proje — "route grubu" değil, fiziksel izolasyon

7shifts `www` (pazarlama) ile `app` (uygulama) yüzeylerini ayrı tutar. İki yüzeyin gereksinimleri **zıt**:

| | Pazarlama (`marketing/`) | Uygulama (`web/`) |
|---|---|---|
| Erişim | Herkese açık, oturumsuz | Auth-korumalı |
| SEO | İndekslenmeli (Google'da "kafe vardiya programı") | İndekslenmemeli |
| PWA/SW | YOK | Var (offline, install) |
| Render | Statik/SSG | Dinamik, kişiye özel |

> [!important] Neden route grubu ((marketing) klasörü) YETMEZ Aynı Next projesinde tutsaydık: **service worker pazarlama sayfasını cache'lerdi** (Gün 31'deki `sw.js` redirect tuzağının kardeşi), **proxy matcher** landing'i auth guard'ına sokardı, PWA manifesti pazarlama sayfasına da uygulanırdı. Bu tuzaklar "aynı proje" sınırında büyür. Ayrı klasör = ayrı `package.json` = ayrı `node_modules` = ayrı build/deploy. İzolasyon **fiziksel** olmalı, mantıksal değil. `marketing/` repo kökünde `web/`, `src/`, `docs/` ile kardeş; `web/`'in İÇİNE konmadı.

> [!question] Mülakat Sorusu **"Tek Next projesinde `(marketing)` ve `(app)` route grupları neden daha kötü?"** Cevap: Route grubu yalnız düzen paylaşımıdır; build çıktısı, bağımlılık ağacı ve runtime **tektir**. Service worker scope'u origin geneldir → pazarlama sayfasını da yakalar; proxy/middleware matcher tüm path'lere bakar → landing'i istisna etmek için sürekli negatif-lookahead bakımı gerekir; PWA manifest/tema tek. Yani "ayrı yüzey" iddiası her katmanda sızıntı yapar. Fiziksel ayrım bu sınıf hataların **tamamını** kökten keser — pahasına biraz kod tekrarı (Tailwind config, tsconfig), ki bu ucuz. 7shifts de tam bu yüzden `www` ve `app`'i ayırır.

---

## 2. İçerik — spec'ten, uydurma YOK

Tüm ürün/fiyat iddiaları `docs/spec/Shift_Spesifikasyon.md`'den birebir. `lib/content.ts`'te her blok kaynak bölümüyle etiketli:
- **Problem→Çözüm:** spec 1.1 / 1.3 değer önerisi tablosu (sadeleştirilmiş 6 satır).
- **Modüller:** spec Bölüm 4 — ama spec 12.1 "**derinlik > genişlik**" ilkesi gereği 11 modül dökülmedi; **çekirdek 5** (Vardiya, Görev, Giriş-Çıkış+Mesai, Checklist, Duyuru) fayda cümlesiyle öne çıktı, gerisi "ve dahası" rozetleriyle özetlendi. Landing'in kendisi ürün prensibini yansıtır.
- **Neden Shift:** spec 1.5 rakip matrisi (Shift / 7shifts / Yerli POS) — farklılaştırıcılar (Stok/Tedarik/Hijyen 7shifts'te YOK) + Türkiye kazanan kartları (İş Kanunu / KVKK / Türkçe).
- **Fiyat:** spec 12.3 birebir — Başlangıç 499, Büyüme 999 (önerilen), Pro 1.799, Enterprise Özel; kapsamlar tabloyla aynı.
- **Güven:** spec 2.3 / 10.3 — İş Kanunu (11s/45s, %50 zamlı), KVKK (veriler AB/Türkiye, Hetzner), Türkçe+kafe jargonu.
- **Jargon sıcaklığı (spec 2.2):** "badem sütü bitti, 14:00 rezervasyon", "espresso makinesi ısındı mı" — masabaşı değil, tezgah dili.

> [!important] Spec dosyası repo'da yoktu → DUR-ve-SOR Brief "spec'i OKU" diyordu ama `Shift_Spesifikasyon.docx` repo'da / home'da / git geçmişinde yoktu (arandı). Uydurma yasak olduğundan **durup sordum**; kullanıcı `.md` sürümünü `docs/spec/`'e koydu. Ancak **Downloads TCC-korumalı** (macOS gizlilik) → sandbox'tan okunamadı; kullanıcı repo içine kopyalayınca okundu. "Kaynağı doğrulamadan pazarlama iddiası yazma" ilkesi bir turu kısa kesip beklemeye değer.

---

## 3. Tasarım — generic-AI landing'den bilinçli kaçış (iki-pass token planı)

> [!important] Pass 1 — reddedilen "AI default" refleksi Her SaaS landing'i: indigo `#4f46e5`-on-white, gri body, her yerde Inter, mor gradient hero, yuvarlak kartlar. Brief ayrıca üç "AI tell"i yasakladı: **cream+serif+terracotta** (`#D97757` = Claude'un kendi aksanı), **black+acid-green**, **broadsheet/hairline**. Bunların hiçbirine sapılmadı.

**Pass 2 — konudan türeyen yön: "kafe arka-ofis operasyon paneli"**

- **İmza öğe (signature):** Hero'da **canlı haftalık vardiya ızgarası** — gün×saat grid, app'in **gerçek pozisyon renkleriyle** kodlu bloklar (barista `#22C55E` / kasiyer `#3B82F6` / komi `#F59E0B`). Bloklar yüklenince "yerleşir" (stagger fade+rise, `.shift-block`), `prefers-reduced-motion` → statik. İlk ekranda "ürün buymuş" hissi. Saf CSS animasyon, JS yok.
- **Renk:** mürekkep lacivert taban `#12182B` (hero+footer, ki renkli ızgara parlasın) + **amber `#F59E0B`** marka aksanı/CTA. Neden amber: kafe sıcaklığı (crema/bal) **ama terracotta değil** (yasaklı bölge — kahve-kahverengi tuzağından kasıtlı kaçış); ayrıca ızgaradaki "komi" bloğunun rengi → marka ↔ veri bağı. Zemin serin kağıt `#F5F6F8` (**cream değil**). Bilinçli olarak indigo-on-white **değil**.
- **Tipografi:** **Space Grotesk** (display — geometrik/teknik, "ızgara" dünyası) + **IBM Plex Sans** (body — mühendis hissi, güçlü Türkçe diakritik) + **IBM Plex Mono** (ızgara saat etiketleri 08:00… → "gerçek araç" dokusu). Playfair/Inter refleksinden çıkış. `latin-ext` subset'i Türkçe ş/ğ/ı/İ için şart.
- **Kalite tabanı:** mobil-öncelikli (kafe sahibi telefondan bakar — 375px'te yatay taşma YOK), amber `focus-visible` halkası, `prefers-reduced-motion`, semantik HTML, ızgaraya `role="img"`+`aria-label`.

> [!question] Mülakat Sorusu **"Kafe konusu 'sıcak' renk ister; neden terracotta/kahverengi değil de amber+lacivert?"** Cevap: İki sebep. (1) `#D97757` terracotta tam da "AI-yapımı landing" sinyali — brief onu ismen yasakladı; kahve→kahverengi en bariz (ve en generic) çağrışım, ondan kaçmak ayırt edicilik kazandırır. (2) Ürünün özü "sıcak kafe" değil, **"operasyonu kontrol eden panel"** — lacivert taban + tek amber aksan bu "temiz operasyon paneli" hissini verir; renkli veri (vardiya blokları) koyu zeminde parlar, tıpkı gerçek bir çizelge dashboard'u gibi. Amber, sıcaklığı terracotta'ya sapmadan taşır ve pozisyon paletine bağlanır. Renk konudan türedi ama klişeden kaçtı.

---

## 4. App'e bağlantı — tek config sabiti (`APP_URL`)

`lib/config.ts`: `APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"`. "Giriş Yap" → `${APP_URL}/login`, "Ücretsiz başla / Başla" → `${APP_URL}/register`. **Hiçbir bileşende hard-code adres yok** — 6+ yerde link var, hepsi bu sabitten türer. Tur 3'te app `app.shift...` alt-domain'ine taşınınca yalnız env değişir. Doğrulama: tüm login link'leri `http://localhost:3000/login`, register'lar `/register` (tarayıcı DOM).

## 5. Pilot formu — backend'siz, sahte endpoint YOK

Brief: gerçek lead-capture ucu ayrı tur (gap). Sahte POST uydurmak yerine form, girilen bilgiyle **önceden doldurulmuş bir `mailto:`** üretir → kullanıcının e-posta istemcisine gerçekten devreder. Submit → "Neredeyse tamam!" state → prefill'li "E-postayı gönder" butonu. `merhaba@shift.app` = PLACEHOLDER adres (gerçek domain Tur 3 → gap). Doğrulama: form dolduruldu → teşekkür state + mailto `Berke Kahve` içeriyor (tarayıcı).

---

## 6. Geçti Kriteri — tarayıcı + DOM + git (derleme değil)

| # | Senaryo | Sonuç | Doğrulama |
|---|---------|-------|-----------|
| 1 | `marketing/` ayrı proje, :3001 | Ready, hero render, 18 vardiya bloğu | tarayıcı |
| 2 | `web/` ve `src/` dokunuş | **git'te tertemiz** (`git status` sadece `marketing/` + `docs/spec/`) | git |
| 3 | Tüm bölümler | hero+problem/çözüm+moduller+neden+fiyat+pilot+footer (7 bölüm) | DOM |
| 4 | Ürün/fiyat iddiaları | spec ile birebir (499/999/1.799/Özel; farklılaştırıcılar) | DOM+spec |
| 5 | App linkleri | Giriş→`APP_URL/login`, Başla→`APP_URL/register` (tek sabit) | DOM |
| 6 | Pilot formu | teşekkür state + prefill mailto (Berke Kahve), sahte endpoint yok | tarayıcı |
| 7 | Responsive | 375px'te yatay taşma YOK; split-hero lg'de iki kolon; mobil kartlar temiz | DOM+screenshot |
| 8 | Tasarım | ink+amber, Space Grotesk/Plex, canlı ızgara — AI-default'a düşmedi | screenshot |
| 9 | tsc / build | tsc **0**, build **0** (statik SSG, `○ /` prerender) | terminal |
| 10 | App/backend regresyon | YOK (ayrı proje, sıfır dokunuş) | git |

---

## 7. Açık gap'ler (etiketlendi, kapatılmadı)

- **gap #P1 — Gerçek lead-capture backend'i:** pilot formu şu an mailto; DB/e-posta ucu ayrı tur.
- **gap #P2 — KVKK/Gizlilik metni:** footer linkleri placeholder (`#`); gerçek yasal metin ayrı tur.
- **gap #P3 — Domain/subdomain deploy (`www` vs `app`):** **Tur 3**. Bu tur yalnız `APP_URL` config'i hazırlandı; `merhaba@shift.app` ve app adresi placeholder.
- **gap #P4 — i18n / İngilizce:** şimdilik yalnız Türkçe (hedef pazar TR).
- **gap #P5 — Blog/içerik ("kafe yönetiminde 10 hata" — spec 12.2):** büyüme fazı.
- **gap #P6 — OG görseli / favicon:** metadata var ama gerçek OG image + favicon üretilmedi (marka görseli ayrı iş).

## 8. Eklenen dosyalar (hepsi `marketing/` altında — `web/`/`src/` sıfır)

**Konfig:** `package.json` (port 3001), `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `.gitignore`, `.claude/launch.json`
**Uygulama:** `app/layout.tsx` (3 font + SEO metadata), `app/globals.css` (Tailwind 4 @theme token'ları), `app/page.tsx`
**Config/İçerik:** `lib/config.ts` (APP_URL), `lib/content.ts` (spec-kaynaklı sabitler)
**Bileşenler:** `Nav`, `Hero`, `ShiftGrid` (imza), `ProblemSolution`, `Modules`, `WhyShift`, `Pricing`, `PilotCTA` (client form), `Footer`
**Kaynak:** `docs/spec/Shift_Spesifikasyon.md` (referans; kullanıcı ekledi)
