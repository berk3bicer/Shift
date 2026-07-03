"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// NOT: framer-motion 12 + React 19 kurulumunda STRING variant-label propagasyonu
// (parent animate="show" → child variants) bu ortamda tetiklenmiyordu; öğeler initial
// state'te (opacity 0) takılı kalıyordu. Çözüm: her yerde OBJE-tabanlı initial/animate/
// whileInView kullan (bu güvenilir çalışıyor), stagger'ı elle delay ile ver.

// Bölüm/öğe giriş animasyonu — viewport'a girince fade + hafif yukarı kayma.
// prefers-reduced-motion → hareket YOK, öğe direkt yerinde (kalite tabanı).
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`reveal${className ? ` ${className}` : ""}`}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// Stagger konteyner — çocuklara artan delay enjekte eder (obje-tabanlı; string variant YOK).
export function RevealStagger({
  children,
  className,
  stagger = 0.08,
  baseDelay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  baseDelay?: number;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) =>
        isValidElement<{ delay?: number }>(child)
          ? cloneElement(child, { delay: baseDelay + i * stagger })
          : child,
      )}
    </div>
  );
}

// Count-up — sayı viewport'a girince 0'dan hedefe akar (Apple/7shifts istatistik hissi).
// prefers-reduced-motion → animasyon YOK, sayı direkt hedefte (erişilebilirlik + Gün 34 dersi:
// içerik hiçbir koşulda boş/0'da takılı kalmaz). once: bir kez sayar, tekrar tetiklenmez.
export function CountUp({
  to,
  prefix = "",
  suffix = "",
  duration = 1.2,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? to : 0);

  useEffect(() => {
    if (reduce) {
      setN(to);
      return;
    }
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, to, reduce, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {n}
      {suffix}
    </span>
  );
}

// Stagger çocuğu — kendi whileInView'iyle açığa çıkar; delay RevealStagger'dan enjekte edilir.
export function RevealItem({
  children,
  className,
  y = 24,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={`reveal${className ? ` ${className}` : ""}`}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
