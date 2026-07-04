"use client";

import { motion, useReducedMotion } from "framer-motion";

// El-çizimi SVG karalamalar (Tur 8) — amber "insan eli" dokunuşları: dalgalı altçizgi,
// daire içine alma, kıvrık ok. Scroll'da viewport'a girince "çiziliyor" hissiyle akar
// (pathLength 0→1). prefers-reduced-motion → direkt çizili (dekor gizli kalmaz).
// NOT: above-fold karalamalar bu bileşeni DEĞİL globals.css'teki .scribble-css sınıfını
// kullanır (framer mount-animate arka plan sekmede takılır — Gün 34 dersi).

const SHAPES: Record<string, { viewBox: string; d: string | string[] }> = {
  // Başlık altı dalgalı vurgu çizgisi (hafif iki tepeli — cetvelle çizilmemiş his)
  underline: {
    viewBox: "0 0 220 12",
    d: "M3 8.5C40 3.5 75 9.5 110 6.5C145 3.5 180 8.5 217 5",
  },
  // Kelimeyi daire içine alma — ucu kapanmayan, elde atılmış tur
  circle: {
    viewBox: "0 0 200 70",
    d: "M144 12C96 2 18 10 12 34C6 58 66 68 116 64C166 60 196 44 188 26C181 11 152 6 128 8",
  },
  // Kıvrık işaret oku (sağ-aşağı) — küçük el notlarından hedefe
  arrow: {
    viewBox: "0 0 90 70",
    d: ["M8 6C30 10 62 22 72 52", "M58 44L73 56L79 38"],
  },
};

export default function Scribble({
  shape = "underline",
  className,
  stroke = "var(--color-signal)",
  strokeWidth = 3,
  delay = 0.2,
}: {
  shape?: keyof typeof SHAPES;
  className?: string;
  stroke?: string;
  strokeWidth?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const { viewBox, d } = SHAPES[shape];
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      className={className}
      viewBox={viewBox}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {paths.map((p, i) => (
        <motion.path
          key={i}
          d={p}
          pathLength={1}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
          transition={reduce ? { duration: 0 } : { duration: 0.7, delay: delay + i * 0.35, ease: [0.65, 0, 0.35, 1] }}
        />
      ))}
    </svg>
  );
}

// Küçük el yazısı kenar notu — script font + opsiyonel hafif dönüş. Sayfa başına 1-2 adet
// (abartma yok); "insan eli değmiş" hissinin metin tarafı.
export function HandNote({
  children,
  className,
  color = "var(--color-terra)",
  rotate = -3,
}: {
  children: React.ReactNode;
  className?: string;
  color?: string;
  rotate?: number;
}) {
  return (
    <span
      className={`font-script inline-block text-xl sm:text-2xl${className ? ` ${className}` : ""}`}
      style={{ color, transform: `rotate(${rotate}deg)` }}
    >
      {children}
    </span>
  );
}
