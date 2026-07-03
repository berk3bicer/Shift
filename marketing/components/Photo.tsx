"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Coffee } from "lucide-react";

// Sıcaklığın ana kaynağı: gerçek kafe/insan fotoğrafı (Unsplash açık-lisans, ticari ücretsiz).
// KRİTİK: foto yüklenemezse ASLA kırık-resim ikonu gösterme → zarif SICAK placeholder'a düş
// (krem→amber degrade + silüet ikonu). Böylece "matrix"e geri dönülmez, kutu hep dolu görünür.
//
// Kullanıcının TARAYICISI Unsplash'e istek atar (build ortamı değil) — statik/SSG'de sorun yok.
// Foto ID'leri build-zamanı `curl` ile 200 doğrulandı; yine de runtime fallback güvence katmanı.
export default function Photo({
  src,
  alt,
  className = "",
  fallbackIcon: FallbackIcon = Coffee,
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[var(--color-cream)] via-[var(--color-warm-soft)]/50 to-[var(--color-signal)]/40 ${className}`}
        role="img"
        aria-label={alt}
      >
        <FallbackIcon className="h-1/4 w-1/4 max-h-24 max-w-24 text-[var(--color-signal-deep)]/60" strokeWidth={1.25} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- kasıtlı: harici Unsplash CDN + onError fallback; next/image domain config gerektirir, statik export'ta gereksiz karmaşa
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
