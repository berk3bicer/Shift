"use client";

import { useEffect } from "react";

// Service worker'ı kaydeder (offline kabuğu). Görsel çıktısı yok. Kök layout'ta global.
// Not: SW yalnızca production build'de değil, dev'de de kayıt olur; /sw.js public'ten servis edilir.
export default function PwaRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
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
