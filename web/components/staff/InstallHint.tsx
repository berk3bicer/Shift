"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

// "Ana ekrana ekle" ipucu. Android/masaüstü Chrome zaten native prompt gösterir;
// iOS Safari göstermez → paylaş → "Ana Ekrana Ekle" talimatı. Zaten standalone (kurulu)
// açıldıysa hiç gösterme. Kullanıcı kapatınca oturum boyunca sessiz (sessionStorage).
export default function InstallHint() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const dismissed = sessionStorage.getItem("installHintDismissed") === "1";
    if (!standalone && isIOS && !dismissed) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-signal/20 bg-cream p-3">
      <Share className="mt-0.5 h-5 w-5 shrink-0 text-signal-deep" />
      <p className="flex-1 text-xs text-ink">
        Uygulamayı ana ekranına ekle: paylaş simgesine dokun, ardından{" "}
        <span className="font-semibold">&ldquo;Ana Ekrana Ekle&rdquo;</span>.
      </p>
      <button
        onClick={() => {
          sessionStorage.setItem("installHintDismissed", "1");
          setShow(false);
        }}
        className="shrink-0 text-faint hover:text-signal-deep"
        aria-label="Kapat"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
