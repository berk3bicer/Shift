# Gün 39 — Pazarlama Sitesi Tur 8: Premium Estetik — El Yazısı Vurgular, Editöryel His, Marka Temizliği

**Kapsam:** `marketing/` görsel klasman yükseltmesi (yapı/route değişmedi) + İKİ KESİN KURAL uygulandı:
(1) "7shifts" hiçbir yerde geçmiyor, (2) hiçbir firma ismi geçmiyor — kıyaslama kavramsal kategorilerle.
`web/` + `src/` sıfır dokunuş (git diff temiz). tsc 0, build 0 (13 sayfa SSG).

---

## 1. Marka temizliği (grep ile kanıtlı)

- `grep -ri "7shifts"` → **0 sonuç** (yorum satırları dâhil ~12 yer temizlendi: layout/page/globals/Hero/Nav/Reveal/Pricing/ProblemSolution/Modules/WhyShift/ShiftGrid/kafe-rehberi).
- Yerli isimler (Restomenum, Menulux, KarekodGarson) + Logo/Mikro/Paraşüt + Hetzner → görünür metinden silindi.
  - `WHY_CARDS` rozetleri: "7shifts'te yok" → **"Türkiye'ye göre" / "Tek çatı"** (pozitif çerçeve).
  - Karşılaştırma matrisleri (landing `COMPARISON` + `/neden-shift` `COMPARISON_FULL`): kolonlar artık
    **"Shift / Tipik vardiya aracı / Tipik POS-adisyon"** — marka değil KATEGORİ; dipnot bunu açıkça söylüyor.
    Faz 2/3 dürüst etiketleri korundu (landing tablosunda Stok/Hijyen önceden yanlışlıkla "full" görünüyordu — düzeltildi, şimdi orada da faz etiketi).
  - `/neden-shift` komple yeniden kurgu: "7shifts'in bıraktığı yerde" → **"Neden Shift? Çünkü operasyonun tamamı burada."**
    İki dünya hikâyesi ("Vardiyayı çözenler" / "Satışı çözenler" / "Shift: ikisinin arasındaki her şey") — kimseyi kötülemeden, kategori düzeyinde dürüst.
- **Bilinçli istisna (Berke'ye not):** kafe-rehberi'ndeki kâr marjı atfının GÖRÜNÜR etiketi "ABD restoran sektörü analizi" olarak markasızlaştırıldı ama **URL korundu** (pos.toasttab.com) — atıfsız veri, dürüstlük çerçevesini bozar diye linki tuttum. İstenirse kaynak tamamen değiştirilebilir.
- WhatsApp/Excel referansları kaldı: bunlar rakip değil, problem-uzayı araçları; sitenin çekirdek anlatısı ("WhatsApp'ta vardiya dönmesin") onlarsız çöker.

## 2. Yeni görsel kimlik — "elde işlenmiş premium" his

- **Script font: Caveat** (`next/font/google`, `latin-ext` → ş/ğ/ı/İ/ö/ü/ç tam; screenshot'ta "haftanın çizelgesi, hazır" ve "Sürpriz yok." doğrulandı). SADECE vurgu: sayfa başına 3–5 dokunuş.
  - Ana sayfa: hero "**tek ekranda**" (script + çizilen squiggle), fotoğraf üstü el notu "haftanın çizelgesi, hazır" + kıvrık ok (terra), problem eyebrow "*tanıdık geldi mi?*", modüller "**derinlik**", neden "**bütününü**".
  - Alt sayfalar: birer başlık vurgusu ("tamamı", "Sürpriz yok.", "her parçası", "verilerle", modül şablonunda "Üç adımda") + koyu CTA bandında amber "*hadi, birlikte kuralım*".
- **El-çizimi SVG altyapısı** (iki katman — Gün 34 dersine sadık):
  - `ScriptWord.tsx` (server): başlık içi script kelime + squiggle altçizgi; çizim **saf CSS keyframe** (`.scribble-css`, `pathLength=1` + dashoffset 1→0) → above-fold, arka plan sekmede/JS'siz bile görünür.
  - `Scribble.tsx` (client): scroll-tetikli karalamalar (underline/circle/arrow) framer `motion.path` `whileInView` pathLength 0→1 — "yazılıyor" hissi; `useReducedMotion` → direkt çizili.
  - reduced-motion: `.scribble-css` media query'de `dashoffset:0; animation:none` — dekor asla gizli kalmaz.
- **Palet zenginleşti (tek-amber kırıldı):** `--color-sage/sage-deep/sage-soft` (adaçayı yeşili — rozet, eyebrow, güven ikonları) + `--color-terra/terra-soft` (toprak — el notları, eyebrow'lar, "Boşluk:" vurguları). Metin tonları AA gözetilerek koyu seçildi (sage-deep #46603e, terra #a8542f — kağıt zemin üzerinde 4.5:1+).
- **Dokulu derinlik:** `body::after` sabit **grain** overlay (SVG feTurbulence data-URI, opacity 0.05) — flat dijital yüzey yerine hafif kâğıt dokusu. Kartlarda `gradient-to-b from-surface to-paper` katmanlı "kâğıt" hissi.
- **Editöryel kompozisyon:** bölüm paddingleri py-20/28 → **py-24/32–36**, zikzak blok arası space-y-36'ya; radius'lar 2xl → **3xl / 2.5rem** (organik); hero başlığı 3.6 → **3.8rem**; zikzak görsel zeminleri krem→adaçayı→şeftali→toprak rotasyonunda. Problem bölümü hikâye tonuna yazıldı ("Bir vardiya değişikliği, üç ayrı yere yazılıyor…").

## 3. KÖK NEDEN AVI #1: Tailwind `@theme inline` + next/font değişkeni = script fontun sessizce sans'a düşmesi

İlk screenshot'ta "tek ekranda" Caveat değil, Jakarta çıktı. Teşhis (`preview_eval` computed style): `.font-script` öğesinde `--font-script` **boş**, family varsayılan `ui-sans-serif`.
Kök neden zinciri: `@theme inline`'a `--font-script: var(--font-caveat)` ekleyince Tailwind kendi **`font-script` utility'sini üretiyor**; utility katmanı custom sınıfımı eziyor; `inline` modda değer build anında çözülmeye çalışılıyor ama `--font-caveat` next/font tarafından **runtime'da body'ye** konduğu için çözülemiyor → varsayılan sans.
**Fix:** token @theme'den çıkarıldı (yorumda gerekçesiyle), `.font-script` doğrudan `var(--font-caveat)` kullanıyor. Ders: *Tailwind v4'te `--font-*`/`--color-*` theme anahtarları utility namespace'i işgal eder — custom sınıf adını theme anahtarıyla çakıştırma.*

> [!question] Mülakat Sorusu — **"CSS'te aynı isimli iki kaynak (framework utility + custom sınıf) çakışırsa ne olur, nasıl ayıklarsın?"**
> Cevap: Katman (layer) sırası kazanır, specificity değil — Tailwind utilities katmanı custom base CSS'ten sonra gelir. Ayıklama: DevTools computed → hangi kural kazanmış; sonra kuralın ÜRETİLME nedenini bul (burada theme anahtarı utility üretti). Çözüm isim çakışmasını kaldırmak, `!important` değil.

## 4. KÖK NEDEN AVI #2: Uzun süredir açık dev sunucu ESKİ globals.css chunk'ı servis ediyordu

Grain/`.font-script`/yeni token'lar derlenmiş CSS'te YOKTU (curl ile kanıt: `--color-terra` tanımı yok, `feTurbulence` 0) ama bileşen değişiklikleri vardı — yani Turbopack **kısmî** HMR durumunda; `touch globals.css` bile aynı bayat chunk'ı döndürdü. Fix: dev sunucu yeniden başlatıldı → her şey derlendi. Ders: *"CSS değişikliğim etki etmedi" şüphesinde önce servis edilen chunk'ı curl'le — kaynağı değil, teli doğrula.*

## 5. Screenshot tuzağı (yeni): Playwright fullPage + dsf 1.5 = 16384px yüzey sınırında İÇERİK DUPLİKASYONU

Mobil fullPage PNG'de sayfa **iki kez** göründü (alt yarıda hero tekrar). Neden: sayfa ~13.100 CSS px × dsf 1.5 = ~19.700 device px > Chromium'un 16384px yüzey sınırı → Playwright'ın parça-birleştirmesi (stitch) bozuluyor. Fix: mobil çekimde `deviceScaleFactor: 1`. Ayrıca `--force-prefers-reduced-motion` bayrağının bu Chrome'da etkisiz olduğu görüldü → Playwright'ın kendi `reducedMotion: "reduce"` context seçeneği kullanıldı (ilk turda fold-altı tüm Reveal'ler opacity:0'da "boş sayfa" çekilmişti — bayrağa değil, context seçeneğine güven).

## 6. Doğrulama

- `npx tsc --noEmit` 0 · `next build` 0 hata, 13 sayfa SSG · `git status web/ src/` boş.
- Konsol taraması (playwright, 6 sayfa): hata yok (tek seferlik favicon 404 — bilinen gap #P6).
- Screenshot seti `docs/gunluk/img/tur8-*.png` (7 sayfa × masaüstü 1440 + mobil 375 = 14 PNG, reducedMotion:reduce ile — içerik tam görünür = a11y kanıtı).
- **Öz-eleştiri:** hero + neden-shift + fiyatlar + kafe-rehberi + modül şablonu yakın plan incelendi; ilk turda 3 kusur bulunup düzeltildi (script font sans'a düşmüş; `<em>` sonrası bitişik "operasyonuiçin"; dev-tools rozeti karede). Sonuç his: sıcak zemin + Caveat vurgular + terra/adaçayı ara tonlar + el notu/ok "şablon yapay-zeka sitesi" görünümünden belirgin uzaklaştı; asıl sıçrama el notu + ok gibi asimetrik insan dokunuşlarından geldi. En zayıf kalan yer: modül detay şablonunun özellik kartları hâlâ düzenli grid (kabul — dürüst içerik yoğun sayfa).

## 7. Gap'ler (etiketlendi, kapatılmadı)

- Özel illüstrasyon/çizim seti (script + SVG şimdilik yeterli) → **gap**.
- Video/Lottie hero → **gap**.
- Toast URL'si görünür metin markasız ama link domain'i marka içeriyor → Berke kararı (bkz. §1).
- Önceki gap'ler: #P1 lead backend, #P2 KVKK metni, #P3 domain deploy, #P6 OG/favicon, işletme-tipi sayfaları.
