import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import PwaRegistrar from "@/components/PwaRegistrar";

// Pazarlama sitesiyle aynı font ailesi (Tur 9 hizalama). Caveat (script) BİLEREK yok:
// panel iş aracı, el yazısı vurgu siteye özgü. latin-ext = Türkçe ş/ğ/ı/İ/ö/ü/ç tam.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Mono yalnız veri etiketlerinde (saat/tutar rakamları) — başlık/gövdede kullanılmaz.
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// Marka wordmark fontu — Switzer (Fontshare, ITF Free License). Pazarlamayla birebir aynı
// rol: SADECE "Shiftle" wordmark'ında (Wordmark bileşeni). Gövde/başlık DEĞİL — Plex Sans/
// Jakarta aynen. next/font/local: self-host (runtime istek yok), FOUT yok (display: swap).
// `variable: "--font-brand"` → html className'ine düşünce Wordmark otomatik Switzer'e geçer.
const switzer = localFont({
  variable: "--font-brand",
  src: [
    { path: "./fonts/Switzer-Bold.woff2", weight: "700", style: "normal" },
    { path: "./fonts/Switzer-Extrabold.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shiftle",
  description: "Shiftle operasyon platformu",
  // manifest link'ini Next, app/manifest.ts konvansiyonundan otomatik ekler.
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Shiftle" },
  icons: { apple: "/icon-192x192.png" },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  // Panel tek tema: açık. CSS'ten önce/bağımsız <meta name="color-scheme"> ile sabitlenir —
  // stil yüklemesi gecikse bile tarayıcı UA-dark'a düşüp siyah ekran göstermesin (Tur 9 fix).
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${jakarta.variable} ${plexSans.variable} ${plexMono.variable} ${switzer.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PwaRegistrar />
        {children}
      </body>
    </html>
  );
}
