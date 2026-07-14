// App (uygulama) yüzeyinin adresi — pazarlama sitesindeki TÜM "Giriş Yap / Kayıt ol"
// linkleri TEK bu sabitten türer. Tur 3'te (domain işi) app ayrı deploy'a (app.shift...)
// taşınınca yalnız NEXT_PUBLIC_APP_URL değişir; hiçbir bileşende hard-code adres yok.
// Dev'de app :3000'de çalışır (marketing :3001, backend :5203 ile çakışmaz).
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const LOGIN_URL = `${APP_URL}/login`;
export const REGISTER_URL = `${APP_URL}/register`;

// Pazarlama sitesinin KENDİ kanonik adresi — metadataBase (OG/twitter görsel mutlak URL'i)
// buradan gelir; env yoksa marka domaini. Slack/WhatsApp önizlemesi mutlak URL ister,
// aksi halde og:image localhost'a düşer.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiftle.com.tr";

// Pilot bayrağı — pilot başvuru formu (PilotCTA) canlı mı? Şu an FALSE: kutu/ekip hazır
// olmadan ölü mailto yayınlamıyoruz. Form kodu YERİNDE, sadece render edilmiyor.
// CONTACT_EMAIL dolunca + PILOT_OPEN=true olunca form iki satırla geri gelir.
export const PILOT_OPEN = false;
export const CONTACT_EMAIL = ""; // gerçek iletişim adresi netleşince doldurulacak

