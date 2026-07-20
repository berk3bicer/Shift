// gen-icons.mjs — panel favicon + PWA rasterlerini tek kaynaktan üretir.
// Çalıştır (web/ içinden): npm i -D sharp to-ico && node scripts/gen-icons.mjs
//
// Kaynak: public/icon.svg = Shiftle marka işareti (ShiftleMark geometrisi ile birebir;
// pazarlama marketing/app/icon.svg ile aynı). Tek geometri → tutarlı favicon/PWA.
// Maskable (Android tam-kare, yuvarlak-kare DEĞİL) bu dosyada inline; bloklar merkezde
// güvenli bölgede kaldığı için daire/squircle kırpması onları kesmez.
import sharp from "sharp";
import toIco from "to-ico";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, ".."); // web/
const APP = join(ROOT, "app");
const PUBLIC = join(ROOT, "public");

const mainSvg = readFileSync(join(PUBLIC, "icon.svg"));

// Maskable: koyu zemin TÜM kanvasa (yuvarlak köşe yok); bloklar ana mark ile aynı geometri.
const maskableSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
  <rect width="96" height="96" fill="#2a2521"/>
  <rect x="24" y="22" width="32" height="12" rx="3" fill="#faf7f2"/>
  <rect x="60" y="22" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
  <rect x="24" y="42" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
  <rect x="40" y="42" width="32" height="12" rx="3" fill="#f59e0b"/>
  <rect x="24" y="62" width="32" height="12" rx="3" fill="#faf7f2"/>
  <rect x="60" y="62" width="12" height="12" rx="3" fill="#faf7f2" opacity="0.35"/>
</svg>`);

// SVG'yi yüksek yoğunlukta rasterle → keskin küçük ikon (viewBox 96 birim, density px sağlar).
const raster = (svg, w, h = w, density = 512) =>
  sharp(svg, { density }).resize(w, h, { fit: "contain" }).png().toBuffer();

const write = (p, buf) => {
  writeFileSync(p, buf);
  console.log("  ✓", p.replace(ROOT + "/", ""));
};

console.log("gen-icons: rasterleniyor…");

// favicon.ico — 16/32/48 (Next app/favicon.ico'yu otomatik servis eder)
const ico16 = await raster(mainSvg, 16);
const ico32 = await raster(mainSvg, 32);
const ico48 = await raster(mainSvg, 48);
write(join(APP, "favicon.ico"), await toIco([ico16, ico32, ico48]));

// PWA ikonları (manifest.ts bunlara bakar)
write(join(PUBLIC, "icon-192x192.png"), await raster(mainSvg, 192));
write(join(PUBLIC, "icon-512x512.png"), await raster(mainSvg, 512));

// Maskable (ayrı, full-bleed) — manifest maskable girişi buna işaret eder
write(join(PUBLIC, "icon-maskable-512.png"), await raster(maskableSvg, 512));

console.log("gen-icons: tamam.");
