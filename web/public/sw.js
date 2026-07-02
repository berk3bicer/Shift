// Shift service worker — temel offline kabuğu (push YOK; push ayrı altyapı turu, gap #13).
// Strateji:
//  - Navigasyon (sayfa) istekleri: network-first → başarılıyı cache'le → offline'da
//    son görülen sayfayı, o da yoksa /offline fallback'ini göster.
//  - Statik varlıklar (_next/static, ikonlar, font): cache-first.
//  - /api/* HİÇ cache'lenmez (auth'lu, taze veri; mutasyon asla cache'lenmemeli).
const CACHE = "shift-v1";
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

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // mutasyonlar (POST/PUT/DELETE) asla cache'lenmez
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // yalnız kendi origin
  if (url.pathname.startsWith("/api/")) return; // auth/taze veri — cache'leme

  // Sayfa gezinmeleri: network-first, offline'da cache → /offline fallback.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Statik varlıklar: cache-first, yoksa network + cache'e ekle.
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => cached)
    )
  );
});
