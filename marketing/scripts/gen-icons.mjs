// gen-icons.mjs — kaynak SVG'lerden tüm favicon/PWA/OG rasterlerini üretir.
// Çalıştır (marketing/ içinden): npm i -D sharp to-ico && node scripts/gen-icons.mjs
//
// Kaynak:
//   app/icon.svg        → ana mark (koyu zemin, tüm bloklar) — 32/48/180/192/512 için
//   app/favicon-16.svg  → 16px sadeleştirme (gri kutucuklar erir, 3 çubuk) — ico 16 dilimi
//   (maskable + OG SVG'leri bu dosyada inline — ayrı asset kirliliği yok)
import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, ".."); // marketing/
const APP = join(ROOT, "app");
const PUBLIC = join(ROOT, "public");

const mainSvg = readFileSync(join(APP, "icon.svg"));
const smallSvg = readFileSync(join(APP, "favicon-16.svg"));

// Maskable (Android): koyu zemin TÜM kanvasa (yuvarlak-kare DEĞİL, tam kare) — daire/squircle
// kırpması blokları kesmesin diye bloklar merkezde güvenli bölgede kalır (bbox merkezi 48,48,
// span ~%54 → %80 güvenli daire içinde). Bloklar ana mark ile aynı geometri.
const maskableSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="#2a2521"/>
  <rect x="24" y="22" width="32" height="12" rx="3" fill="#faf7f2"/>
  <rect x="60" y="22" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
  <rect x="24" y="42" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
  <rect x="40" y="42" width="32" height="12" rx="3" fill="#f59e0b"/>
  <rect x="24" y="62" width="32" height="12" rx="3" fill="#faf7f2"/>
  <rect x="60" y="62" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
</svg>`);

// "Shiftle" wordmark — Switzer-Extrabold outline path (components/Wordmark.tsx ile AYNI kaynak).
// Eskiden OG'de "Shiftle" sistem fontuyla (Helvetica) çiziliyordu → sitedeki Switzer wordmark ile
// tutarsızdı. Artık aynı path gömülü: site ve paylaşım kartı birebir aynı harfler. Gövde ink,
// i-noktası amber. baseline y=0, advance 0..3062, cap 694 (upm 1000).
const WORDMARK_BODY_D =
  "M219 -503C219 -536 250 -557 296 -557C355 -557 389 -528 400 -468H595C575 -629 448 -698 304 -698C130 -698 32 -604 32 -484C32 -218 427 -321 427 -186C427 -147 395 -123 333 -123C269 -123 225 -157 215 -219H23C45 -59 166 18 331 18C494 18 614 -66 614 -209C614 -486 219 -372 219 -503Z M684 0H857V-308C857 -375 892 -419 945 -419C993 -419 1018 -390 1018 -325V0H1192V-360C1192 -497 1112 -559 1011 -559C946 -559 892 -530 857 -468V-720H684Z M1283 0H1456V-541H1283Z M1507 -409H1570V0H1743V-409H1833V-541H1743C1743 -586 1757 -614 1821 -614H1833V-721C1817 -729 1785 -738 1740 -738C1634 -738 1571 -670 1570 -541H1507Z M1905 -182C1905 -53 1964 18 2084 18C2130 18 2167 10 2186 1V-130H2154C2091 -130 2079 -158 2079 -207V-409H2187V-541H2079V-666H1905V-541H1843V-409H1905Z M2252 0H2425V-720H2252Z M3040 -178H2858C2843 -137 2816 -119 2772 -119C2716 -119 2682 -159 2674 -234H3036V-272C3036 -450 2932 -559 2766 -559C2603 -559 2495 -454 2495 -270C2495 -92 2602 18 2772 18C2909 18 3012 -54 3040 -178Z M2766 -422C2814 -422 2845 -390 2856 -329H2677C2688 -390 2718 -422 2766 -422Z";
const WORDMARK_DOT_D = "M1283 -588H1456V-720H1283Z";

// OG (1200×630) — sade, AI'sız. Zemin sıcak kağıt + alt bant; sol-orta büyük mark; yanında
// "Shiftle" wordmark (outline path) + alt satır. Firma adı / kıyas markası YOK.
// Wordmark: baseline y=330 (eski metinle aynı), scale 0.11 → cap ~76px, genişlik ~337px.
const ogSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#faf7f2"/>
  <rect y="560" width="1200" height="70" fill="#f2ece2"/>
  <g transform="translate(140,195) scale(2.5)">
    <rect width="96" height="96" rx="21" fill="#2a2521"/>
    <rect x="24" y="22" width="32" height="12" rx="3" fill="#faf7f2"/>
    <rect x="60" y="22" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
    <rect x="24" y="42" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
    <rect x="40" y="42" width="32" height="12" rx="3" fill="#f59e0b"/>
    <rect x="24" y="62" width="32" height="12" rx="3" fill="#faf7f2"/>
    <rect x="60" y="62" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
  </g>
  <g transform="translate(440,330) scale(0.11)">
    <path d="${WORDMARK_BODY_D}" fill="#2a2521"/>
    <path d="${WORDMARK_DOT_D}" fill="#f59e0b"/>
  </g>
  <text x="444" y="392" font-family="Helvetica, Arial, sans-serif" font-size="40" font-weight="500" fill="#5f5e5a">Kafe &amp; Restoran Operasyonu</text>
</svg>`);

// SVG'yi yüksek yoğunlukta rasterle → keskin küçük ikon (viewBox 96 birim, density px sağlar).
const raster = (svg, w, h = w, density = 512) =>
  sharp(svg, { density }).resize(w, h, { fit: "contain" }).png().toBuffer();

const write = (p, buf) => {
  writeFileSync(p, buf);
  console.log("  ✓", p.replace(ROOT + "/", ""));
};

console.log("gen-icons: rasterleniyor…");

// favicon.ico — 16 (sade), 32/48 (ana mark)
const ico16 = await raster(smallSvg, 16);
const ico32 = await raster(mainSvg, 32);
const ico48 = await raster(mainSvg, 48);
write(join(APP, "favicon.ico"), await toIco([ico16, ico32, ico48]));

// Apple touch + PWA ana ikonları (ana mark)
write(join(APP, "apple-icon.png"), await raster(mainSvg, 180));
write(join(PUBLIC, "icon-192.png"), await raster(mainSvg, 192));
write(join(PUBLIC, "icon-512.png"), await raster(mainSvg, 512));

// Maskable (ayrı, full-bleed)
write(join(PUBLIC, "icon-maskable-512.png"), await raster(maskableSvg, 512));

// OG 1200×630 (intrinsic zaten 1200 geniş → düşük density yeter)
write(join(APP, "opengraph-image.png"), await sharp(ogSvg, { density: 96 }).resize(1200, 630).png().toBuffer());

console.log("gen-icons: tamam.");
