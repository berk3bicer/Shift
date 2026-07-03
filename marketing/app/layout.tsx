import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display: Plus Jakarta Sans — sıcak, humanist, yuvarlak hatlı sans. Space Grotesk'in
// teknik/geometrik hissi yerine daha DAVETKÂR bir başlık sesi (7shifts aydınlık yönü).
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin", "latin-ext"], // latin-ext = Türkçe ş/ğ/ı/İ/ö/ü/ç
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

// Body: IBM Plex Sans — temiz, okunur, güçlü Türkçe diakritik desteği.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Mono: IBM Plex Mono — ARTIK yalnız minik veri etiketlerinde (çizelge saat rakamları 08:00…).
// Başlık/gövde/nav'da KULLANILMAZ (eski "kod/terminal" hissi buradan geliyordu).
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shift — Kafe & Restoran Operasyonunu Dijitalleştir",
  description:
    "Vardiya, görev, giriş-çıkış, checklist ve duyuru tek platformda. Kafeler için İş Kanunu ve KVKK uyumlu, Türkçe operasyon yazılımı. WhatsApp'ta vardiya, kağıtta hijyen bitiyor.",
  keywords: [
    "kafe vardiya programı",
    "restoran personel yönetimi",
    "vardiya planlama",
    "kafe operasyon yazılımı",
    "puantaj",
    "giriş çıkış takibi",
  ],
  openGraph: {
    title: "Shift — Kafe & Restoran Operasyonunu Dijitalleştir",
    description:
      "Vardiya, görev, giriş-çıkış, checklist ve duyuru tek platformda. Kafeler için, Türkçe, İş Kanunu + KVKK uyumlu.",
    locale: "tr_TR",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf7f2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${jakarta.variable} ${plexSans.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
