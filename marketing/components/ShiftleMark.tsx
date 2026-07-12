// Shiftle marka işareti — koyu yuvarlak kare içinde vardiya çizelgesi blokları
// (3 açık blok + soluk gri kutucuklar + ortada amber "aktif vardiya" bloğu). Renkler
// globals.css tokenlarıyla birebir: #2a2521=ink, #faf7f2=paper, #f59e0b=signal.
// TEK kaynak: Nav, Footer ve her yer bunu import eder (tekrar yok). Favicon/PWA/OG
// PNG'leri de aynı geometriyi scripts/gen-icons.mjs üzerinden app/icon.svg'den üretir.
//
// variant:
//  - "default": koyu zemin (açık zeminli sayfalarda — Nav). Favicon ana hali.
//  - "onDark":  amber zemin, koyu bloklar (koyu bant üstünde — Footer; kontrast için).

type MarkVariant = "default" | "onDark";

const INK = "#2a2521";
const PAPER = "#faf7f2";
const AMBER = "#f59e0b";

export default function ShiftleMark({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: MarkVariant;
}) {
  const onDark = variant === "onDark";
  const bg = onDark ? AMBER : INK;
  const block = onDark ? INK : PAPER; // ana bloklar + soluk kutucuklar
  const active = onDark ? INK : AMBER; // ortadaki "aktif vardiya" bloğu

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      className={className}
      role="img"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="96" height="96" rx="21" fill={bg} />
      <rect x="24" y="22" width="32" height="12" rx="3" fill={block} />
      <rect x="60" y="22" width="12" height="12" rx="3" fill={block} opacity="0.35" />
      <rect x="24" y="42" width="12" height="12" rx="3" fill={block} opacity="0.35" />
      <rect x="40" y="42" width="32" height="12" rx="3" fill={active} />
      <rect x="24" y="62" width="32" height="12" rx="3" fill={block} />
      <rect x="60" y="62" width="12" height="12" rx="3" fill={block} opacity="0.35" />
    </svg>
  );
}
