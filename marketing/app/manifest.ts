import type { MetadataRoute } from "next";

// PWA manifest — route olarak (en temiz; Next otomatik <link rel="manifest"> bağlar).
// İkonlar scripts/gen-icons.mjs ile public/ altına üretilir. theme/background renkleri
// layout.tsx viewport.themeColor (#faf7f2) ile aynı.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shiftle",
    short_name: "Shiftle",
    description: "Kafe & restoran operasyonunu dijitalleştir.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#faf7f2",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
