"use client";

import { useEffect } from "react";

// Service worker'ı kaydeder (offline kabuğu). Görsel çıktısı yok. Kök layout'ta global.
// SADECE production'da kayıt olur. Dev'de SW, Turbopack'in içerik-hash'siz CSS/JS
// chunk'larını cache-first sunup normal F5'te bayat tema / siyah ekran yaratıyordu
// (hard refresh SW'yi bypass ettiği için "doğru" görünüyordu). Dev'de bu yüzden kayıt
// YOK + önceki oturumlardan kalan SW kaydı ve Cache Storage aktif temizlenir ki daha
// önce "enfekte" olmuş tarayıcılar ilk yüklemede kendini iyileştirsin.
export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV !== "production") {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => regs.forEach((r) => r.unregister()))
        .catch(() => {});
      if ("caches" in window) {
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
      return;
    }

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // kayıt başarısız olsa da uygulama normal çalışır (progressive enhancement)
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);
  return null;
}
