import type { ReactNode } from "react";

// Başlık içi el yazısı vurgu + elde çizilmiş squiggle altçizgi — ABOVE-FOLD güvenli sürüm.
// Saf CSS keyframe ile "çiziliyor" efekti (.scribble-css, globals.css): framer'a bağlı değil,
// arka plan sekmede/JS'siz de son karede görünür (Gün 34 dersi). Scroll-tetikli karalamalar
// için Scribble.tsx (client) kullanılır.
export default function ScriptWord({
  children,
  delay = "0.6s",
  className,
}: {
  children: ReactNode;
  /** squiggle çizim gecikmesi — başlık fade'inden sonra başlasın */
  delay?: string;
  className?: string;
}) {
  return (
    <span className={`relative inline-block whitespace-nowrap${className ? ` ${className}` : ""}`}>
      <span className="font-script font-bold text-[var(--color-signal-deep)]">{children}</span>
      <svg
        className="scribble-css absolute -bottom-2 left-0 w-full"
        viewBox="0 0 220 12"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ animationDelay: delay }}
      >
        <path
          d="M3 8.5C40 3.5 75 9.5 110 6.5C145 3.5 180 8.5 217 5"
          pathLength={1}
          stroke="var(--color-signal)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
