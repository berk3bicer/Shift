"use client";

import { Children, cloneElement, isValidElement, useEffect, useRef, useState } from "react";
import { animate, motion, useInView, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

// NOT: framer-motion 12 + React 19 kurulumunda STRING variant-label propagasyonu
// (parent animate="show" → child variants) bu ortamda tetiklenmiyordu; öğeler initial
// state'te (opacity 0) takılı kalıyordu. Çözüm: her yerde OBJE-tabanlı initial/animate/
// whileInView kullan (bu güvenilir çalışıyor), stagger'ı elle delay ile ver.

// Tur 6 kök neden düzeltmesi: önceki `amount: 0.2` öğe viewport'un EN ALT kenarında %20
// görünür olur olmaz tetikliyordu → reveal ekran kenarında, kullanıcı bakmadan bitiyordu.
// Yeni tetik: negatif alt rootMargin — öğe alt kenardan ~%15 İÇERİ girince oynar (kullanıcı
// tam o bölgeye bakarken). Mesafe de 20px→36px: hissedilir ama sarsıntısız (Apple/7shifts).
const VIEWPORT = { once: true, margin: "0px 0px -15% 0px" } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

// Tur 7 KÖK NEDEN düzeltmesi (reduced-motion görünmez içerik): eski yol `initial=false +
// whileInView=undefined` idi — framer öğeye HİÇ stil yazmıyordu, SSR'dan gelen inline
// `opacity:0` kalıcı oluyordu (React 19 hydration attribute uyuşmazlığını YAMAMAZ, sadece
// uyarır). Sonuç: reduce açık kullanıcıda içerik sonsuza dek gizli. Yeni yol: reduce'ta
// initial AÇIK görünür değerler taşır (opacity:1) → framer mount'ta stili imperatif yazar
// ve SSR kalıntısını ezer; whileInView hep tanımlı, reduce'ta duration:0 (hareket hissi yok).

// Bölüm/öğe giriş animasyonu — viewport'a girince fade + aşağıdan yukarı belirgin kayma.
// prefers-reduced-motion → hareket YOK, öğe direkt yerinde (kalite tabanı).
export default function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
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
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ ...VIEWPORT, once }}
      transition={reduce ? { duration: 0 } : { duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Yatay reveal — zikzak feature blokları için: görsel bir yandan, metin diğer yandan kayarak
// belirir (x: ±32→0 + fade). Mobil dahil transform+opacity (layout tetiklemez, akıcı).
export function RevealX({
  children,
  className,
  from = "left",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  from?: "left" | "right";
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const x = from === "left" ? -32 : 32;
  return (
    <motion.div
      className={`reveal${className ? ` ${className}` : ""}`}
      initial={reduce ? { opacity: 1, x: 0 } : { opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={reduce ? { duration: 0 } : { duration: 0.65, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

// Stagger konteyner — çocuklara artan delay enjekte eder (obje-tabanlı; string variant YOK).
export function RevealStagger({
  children,
  className,
  stagger = 0.1,
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
  y = 32,
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
      initial={reduce ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
