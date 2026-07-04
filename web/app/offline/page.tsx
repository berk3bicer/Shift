import { WifiOff } from "lucide-react";

// Çevrimdışı fallback — service worker, ağ yokken ve sayfa cache'te de yoksa bunu gösterir.
// Auth grubu DIŞINDA (kök layout) → oturum gerektirmez, offline'da güvenle açılır.
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-paper-deep">
        <WifiOff className="h-8 w-8 text-faint" />
      </div>
      <div>
        <h1 className="font-display text-lg font-bold text-ink">Çevrimdışısın</h1>
        <p className="mt-1 max-w-xs text-sm text-muted">
          İnternet bağlantısı yok. Daha önce açtığın sayfalar çevrimdışı görüntülenebilir;
          yeni veri için bağlantını kontrol et.
        </p>
      </div>
    </main>
  );
}
