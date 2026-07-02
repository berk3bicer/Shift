import { LOGIN_URL, REGISTER_URL } from "@/lib/config";

// Üst bar — koyu ink zemin (hero'yla sürekli). Linkler tek config sabitinden (APP_URL).
export default function Nav() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
      <a href="#top" className="flex items-baseline gap-2">
        <span className="font-display text-xl font-bold text-white">Shift</span>
        <span className="hidden font-mono text-[10px] text-white/40 sm:inline">kafe operasyonu</span>
      </a>

      <div className="flex items-center gap-2 sm:gap-4">
        <a
          href="#fiyat"
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-block"
        >
          Fiyatlar
        </a>
        <a
          href={LOGIN_URL}
          className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:text-white"
        >
          Giriş Yap
        </a>
        <a
          href={REGISTER_URL}
          className="rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-signal-deep)]"
        >
          Ücretsiz başla
        </a>
      </div>
    </nav>
  );
}
