# Shift — Gün 34: Pazarlama Sitesi GÖRSEL Yeniden Yapım (7shifts kalitesi)

> [!info] Bugünün hedefi Gün 33'te `marketing/` iskeleti kuruldu (mimari + içerik + token planı DOĞRU). Ama görsel uygulama düz/cansız/amatördü. Bu tur **içeriği/mimariyi değil GÖRSEL KALİTEYİ** yeniden yaptık: hedef 7shifts.com profesyonelliği. Framer Motion + lucide-react + next/font eklendi. `web/` ve `src/`'ye yine SIFIR dokunuş.

**Tarih:** 3 Temmuz 2026 **Stack:** Next.js 16.2.9, React 19, Tailwind 4, framer-motion 12, lucide-react **Durum:** ✅ Gün 34 tamamlandı — 9 bölüm 7shifts düzeninde; sticky nav (scroll blur + hamburger), split hero + floating 3B vardiya çizelgesi (imza), ink/paper ritmi, hover mikro-etkileşimleri; tsc 0, build 0 (SSG), mobil 375px taşma yok. **1 kritik render bug bulundu ve kök nedeni çözüldü** (aşağıda §3).

---

## 1. Korunanlar (Gün 33) + Eklenenler (Gün 34)

**Korundu:** `marketing/` ayrı proje (port 3001, zero-touch), `lib/content.ts` (spec-kaynaklı içerik), `lib/config.ts` (`APP_URL`), token yönü (ink `#12182b` + amber `#f59e0b`), spec fiyatları (499/999/1.799/Özel), 7 bölüm yapısı.

**Eklendi:** `framer-motion` (scroll reveal + mobil menü + hover), `lucide-react` (tutarlı ikon seti — modül/özellik/güven kartları), `clsx`. Fontlar zaten `next/font` (Space Grotesk + IBM Plex Sans/Mono, `latin-ext` Türkçe). İçeriğe `STATS` (sosyal kanıt) + `WHY_CARDS` (farklılaştırıcı kartlar) eklendi — hepsi spec 8.2/1.2/1.4/1.5/2.3'ten, uydurma yok.

## 2. 7shifts düzeni — 9 bölüm (içerik bizim, iskelet onlardan)

1. **Sticky nav** — logo + orta menü + Giriş(ghost)/Ücretsiz Başla(amber); scroll'da blur+gölge; mobilde hamburger (framer AnimatePresence).
2. **Hero SPLIT** — sol: başlık+açıklama+2 CTA+güven rozeti; sağ: **canlı vardiya çizelgesi** (7shifts'in hero app-screenshot'ının karşılığı — bizde gerçek DOM).
3. **Sosyal kanıt şeridi** — metin tabanlı istatistik rozetleri (SAHTE logo YOK; gerçek müşteri yok).
4. **Problem → Çözüm** — before/after görsel kontrast: sol "dağınık" (eğik atılmış chip'ler: WhatsApp/kağıt/Excel) → amber ok → sağ ink kartta "toplanmış" (yeşil check'li).
5. **Modüller** — çekirdek 5, lucide ikonlu kartlar, hover'da border amber + kart kalkar.
6. **Neden Shift** — farklılaştırıcı kartlar ("7shifts'te yok" rozetli) + sadeleştirilmiş rakip matrisi.
7. **Fiyat** — 4 kart, ortadaki "Büyüme" **Popüler** rozeti + kalkık + amber ring (7shifts deseni).
8. **Kapanış CTA** — koyu ink bant + pilot formu (mailto, backend'siz).
9. **Footer** — çok kolonlu (Ürün/Başla/Yasal), KVKK placeholder.

## 3. HERO'nun imzası + kritik render bug'ı (en önemli teknik ders)

İmza: **floating 3B vardiya çizelgesi** — gün×saat ızgarası, app'in gerçek pozisyon renkleriyle (barista yeşil / kasiyer mavi / komi amber) renk-kodlu bloklar; `rotateY(-7deg) rotateX(3deg)` + yumuşak gölgeyle "kaldırılmış app-screenshot" hissi; bloklar sırayla "yerine oturur" (stagger).

> [!bug] Framer mount-animate + arka planda yüklenen sekme = içerik opacity:0'da KİLİTLİ İlk uygulama hero başlığını ve çizelgeyi framer `initial={{opacity:0}} animate={{opacity:1}}` (mount) ve `whileInView` variant-label ile canlandırıyordu. Sonuç: **hero metni ve bloklar görünmüyordu** (opacity 0'da takılı). Teşhis: `document.visibilityState === "hidden"` — önizleme sekmesi arka planda yükleniyor; framer'ın rAF-tabanlı animasyonu duraklıyor, öğe `initial` (gizli) karesinde kalıyor. CSS `transition` de aynı rAF'a bağlı → aynı takılma. **tsc 0 idi** (incremental cache yanılttı); "derleme yeşil ≠ görünür".

> [!important] Çözüm: above-the-fold içeriği JS/rAF'a bağlama — SAF CSS keyframe Hero + çizelge girişi artık `@keyframes` + `animation-fill-mode: both` (`.anim-rise`, `.anim-settle`, stagger için `animation-delay`). CSS keyframe **son kareye çözülür** (forwards/both) → sekme arka planda olsa bile içerik asla görünmez kalmaz. `prefers-reduced-motion` globals.css'te animasyonu kapatıp opacity:1 yapar. Bu, Gün 33'te sorunsuz render eden desenin ta kendisiydi. Framer, scroll-reveal bölümleri + mobil menü + hover için korundu (gerçek/görünür sekmede kusursuz çalışır; scroll-reveal'ın doğal yeri).

> [!question] Mülakat Sorusu **"Neden hero'da framer değil CSS keyframe? Framer daha 'modern' değil mi?"** Cevap: Araç seçimi bağlama bağlı. Framer'ın mount/whileInView animasyonu `requestAnimationFrame`'e dayanır; tarayıcı arka plan sekmesinde rAF'ı kısar/durdurur → animasyon başlamaz, `initial={{opacity:0}}` uygulanmış öğe **gizli kalır**. Above-the-fold, LCP içeriği için bu kabul edilemez — bir kullanıcı sekmeyi arka planda açsa (yeni sekmede link) hero'yu boş görür. CSS `@keyframes ... both` ise zaman-tabanlıdır ve son kareye çözülür; animasyon oynamasa bile içerik görünür. Yani **kritik içeriğin görünürlüğünü asla bir JS animasyonunun tamamlanmasına bağlama**. Framer'ı scroll-reveal gibi "kullanıcı zaten baktığında" tetiklenen, ilerici-geliştirme (progressive enhancement) katmanlarında kullan. Doğru araç, doğru katman.

## 4. Görsel kalite çıtası — generic-AI'dan çıkış (uygulanan)

- **Derinlik:** katmanlı gölge token'ları (`--shadow-card/float/cta`), ince gradient'ler (ink kartlarda `from-ink-soft to-ink`), hero'da amber ışıma + ızgara deseni. Düz renk bloğu yok.
- **Ritim:** ink → paper → ink → paper → ink alternasyonu (göz yorulmaz, 7shifts gibi).
- **Mikro-etkileşim:** CTA hover (kalkma + gölge), kart hover (border amber'a döner + kalkar), nav scroll'da blur/gölge. Framer + CSS.
- **Tipografi:** hero başlık büyük/sıkı tracking (Space Grotesk, `-0.02em`), gövde okunur (Plex Sans), mono etiketler (Plex Mono). Playfair/Inter refleksi YOK.
- **Boşluk:** cömert bölüm padding'i (py-20/28), nefes alan yerleşim.
- **Responsive:** mobilde split tek kolona iner, nav hamburger, 375px yatay taşma YOK (doğrulandı).
- **Kalite tabanı:** amber `focus-visible` halkası, `prefers-reduced-motion` (tüm animasyonlar kapanır), ink üstü beyaz/amber AA kontrast, çizelgeye `role="img"`+`aria-label`.

## 5. Kendi işini eleştir (skill: "picture worth 1000 tokens")

Masaüstü + mobil ekran görüntüleri tarayıcıda alındı ve incelendi. Değerlendirme: ink+amber palet, Space Grotesk display, mono veri etiketleri ve **floating operasyon-paneli çizelgesi** siteyi "her yerdeki AI SaaS landing"inden ayırıyor — indigo-on-white değil, cream-serif-terracotta değil, black-acid-green değil. Modül kartları (lucide ikon + renkli badge), "7shifts'te yok" farklılaştırıcıları ve Popüler-rozetli fiyat kartı 7shifts kalite hissini veriyor. Küçük gözlem: mobilde çizelge blok etiketleri kısalıyor ("Ay…") — dar ekranda "gerçek program" hissini bozmuyor, kabul edildi.

> [!note] Ekran görüntüleri / Berke onayı Önizleme sekmesi başsız (headless) çalıştığı için PNG dosyaları repo'ya otomatik gömülemedi (gap #P7). Görsel onay için **canlı sunucu:** `cd marketing && npm run dev` → `http://localhost:3001`. Masaüstü hero, modüller, neden-Shift, fiyat, pilot ve mobil görünümler doğrulama sırasında tek tek incelendi.

## 6. Geçti Kriteri

| # | Senaryo | Sonuç | Doğrulama |
|---|---------|-------|-----------|
| 1 | framer-motion + lucide + clsx yüklü; next/font aktif (Türkçe ş/ğ/ı) | ✓ | package.json + DOM (fontFamily "Space Grotesk") |
| 2 | 9 bölüm 7shifts düzeni; hero split (sol metin, sağ canlı çizelge) | ✓ | screenshot + DOM (heroCols "540px 515px") |
| 3 | Hero çizelgesi stagger "yerleşme"; reduced-motion'da kapalı | ✓ (CSS keyframe) | görsel + globals.css |
| 4 | Bölümler ink/paper ritmi; gölge/katman/derinlik (flat değil) | ✓ | screenshot'lar |
| 5 | CTA + kart hover; nav scroll blur/gölge; mobil menü | ✓ | DOM (aria-expanded toggle) + görsel |
| 6 | Fiyat 4 kart, "Büyüme" Popüler; spec 12.3 birebir | ✓ | screenshot (499/999/1.799/Özel) |
| 7 | Mobil 375px: tek kolon, hamburger, yatay taşma yok | ✓ | DOM (docW==innerW==375) |
| 8 | Screenshot + öz-eleştiri (generic-AI değil) | ✓ | §5 |
| 9 | tsc 0, build 0 (SSG); web/+src/ zero-touch | ✓ | terminal + git |

## 7. Açık gap'ler

- **#P7 — Ekran görüntüsü dosyaları:** headless önizlemeden PNG gömülemedi; canlı :3001 ile onay.
- **#P1 lead-capture backend**, **#P2 KVKK metni**, **#P3 domain deploy (Tur 4)**, i18n, blog, **OG/favicon** — Gün 33'ten devam.
- Gerçek app screenshot'ları (hero'ya) → şimdilik canlı-DOM çizelge; Lottie/video hero → gap.

## 8. Değişen dosyalar (hepsi `marketing/` — `web/`/`src/` zero-touch)

**Yeni:** `components/Reveal.tsx` (framer whileInView + stagger, `.reveal` işaretçi).
**Yeniden yazıldı:** `Nav` (sticky+hamburger), `Hero` (CSS keyframe split), `ShiftGrid` (CSS keyframe floating 3B), `ProblemSolution` (before/after), `Modules` (lucide+hover), `WhyShift` (farklılaştırıcı kartlar+matris), `Pricing` (Popüler+lucide), `PilotCTA` (lucide), `Footer`, `app/page.tsx` (Nav+ritim), `app/globals.css` (gölge/gradient token'ları + keyframe'ler), `lib/content.ts` (icon+STATS+WHY_CARDS).
**Bağımlılık:** `package.json` (framer-motion, lucide-react, clsx).
