import type { MetadataRoute } from "next";

// Web App Manifest (Next 16 native convention → /manifest.webmanifest). "Ana ekrana
// ekle" + standalone (adres çubuğu gizli) için gerekli. Staff mobil deneyiminin kabuğu.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shiftle — Vardiya",
    short_name: "Shiftle",
    description: "Kafe/restoran vardiya ve operasyon uygulaması",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#f59e0b",
    lang: "tr",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
