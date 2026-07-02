import type { Metadata, Viewport } from "next";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Display: Space Grotesk (geometrik/teknik — "ızgara" dünyasına uyar, Inter refleksi DEĞİL).
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin", "latin-ext"], // latin-ext = Türkçe ş/ğ/ı/İ/ö/ü/ç
  display: "swap",
});

// Body: IBM Plex Sans (mühendis hissi + güçlü Türkçe diakritik desteği).
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Mono: IBM Plex Mono (çizelge saat etiketleri — 08:00… — "gerçek araç" hissi).
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
  themeColor: "#12182b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
