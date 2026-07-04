// Shift service worker — temel offline kabuğu (push YOK; push ayrı altyapı turu, gap #13).
// NOT: yalnız PRODUCTION'da kayıt olur (PwaRegistrar) — dev'de SW, Turbopack'in
// hash'siz CSS/JS chunk'larını cache-first sunup BAYAT tema/siyah ekran yaratıyordu
// (Tur 9 fix). Cache adı bump'landı ki eski sürümün bayat kopyaları activate'te silinsin.
// Strateji:
//  - Navigasyon (sayfa) istekleri: network-first → başarılıyı cache'le → offline'da
//    son görülen sayfayı, o da yoksa /offline fallback'ini göster.
//  - /_next/static/*: cache-first — SADECE burası; prod'da içerik-hash'li ve immutable.
//  - Diğer her şey (ikon, manifest, RSC payload'ı, /_next/image): network-first →
//    offline'da cache fallback. Cache-first OLMAZ: URL'leri içerik-hash'li değil,
//    bayat veri/stil servis eder (F5 bayat-CSS kök nedeni buydu).
//  - /api/* HİÇ cache'lenmez (auth'lu, taze veri; mutasyon asla cache'lenmemeli).
const CACHE = "shift-v2";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.add(OFFLINE_URL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Ağdan geleni cache'e kopyalayıp yanıtı döndürür (başarılıysa).
function fetchAndCache(req) {
  return fetch(req).then((res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // mutasyonlar (POST/PUT/DELETE) asla cache'lenmez
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // yalnız kendi origin
  if (url.pathname.startsWith("/api/")) return; // auth/taze veri — cache'leme

  // Sayfa gezinmeleri: network-first, offline'da cache → /offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetchAndCache(req).catch(() =>
        caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  // İçerik-hash'li immutable varlıklar: cache-first (hızlı; URL değişince zaten yenisi iner).
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then((cached) => cached || fetchAndCache(req))
    );
    return;
  }

  // Gerisi: network-first, yalnız offline'da cache fallback — asla bayat servis etme.
  event.respondWith(
    fetchAndCache(req).catch(() => caches.match(req))
  );
});
