// Pazarlama sitesinin adresi — panel ile marketing AYRI origin'ler (deploy'da app. vs www.).
// KVKK metni marketing'te yayınlanır; paneldeki rıza kutuları oraya link verir. Deploy'da
// (#P3 turu) yalnız NEXT_PUBLIC_MARKETING_URL değişir; bileşenlerde hard-code adres yok.
// Dev'de marketing :3001'de çalışır (panel :3000, backend :5203 ile çakışmaz).
export const MARKETING_URL =
  process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3001";
