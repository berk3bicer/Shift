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

// OG (1200×630) — sade, AI'sız. Zemin sıcak kağıt + alt bant; sol-orta büyük mark; yanında
// "Shiftle" (koyu) + alt satır. Firma adı / kıyas markası YOK. Metin, mark ile aynı geometri
// grubundan (scale 2.5) çizilir. Font: sistemde kesin bulunan Helvetica/Arial (Switzer OG'de
// yok; wordmark outline'ı geldiğinde OG de ondan beslenebilir).
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
  <text x="440" y="330" font-family="Helvetica, Arial, sans-serif" font-size="110" font-weight="800" letter-spacing="-3" fill="#2a2521">Shiftle</text>
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
