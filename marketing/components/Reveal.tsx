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
// tam o bölgeye bakarken). Mesafe de 20px→36px: hissedilir ama sarsıntısız.
const VIEWPORT = { once: true, margin: "0px 0px -15% 0px" } as const;
const EASE = [0.22, 1, 0.36, 1] as const;

// Tur 7 KÖK NEDEN düzeltmesi (reduced-motion görünmez içerik): eski yol `initial=false +
// whileInView=undefined` idi — framer öğeye HİÇ stil yazmıyordu, SSR'dan gelen inline
// `opacity:0` kalıcı oluyordu. Sonuç: reduce açık kullanıcıda içerik sonsuza dek gizli.
// ŞART: reduce'ta içerik her koşulda görünür hale gelmeli.

// Tur 18 hydration düzeltmesi: Tur 7'nin `initial={reduce ? görünür : gizli}` yolu SSR/istemci
// uyuşmazlığı yaratıyordu — SSR hep reduce=false varsayar (opacity:0 basar), reduce açık
// istemcide ilk render opacity:1 üretir ve React 19 "Hydration failed" fırlatıp TÜM ağacı
// yeniden üretir. Yeni yol (FlipShowcase Tur 17 mounted-gate dersi): initial HEP gizli değerleri
// taşır (SSR ile birebir aynı), reduce dalı yalnızca mount SONRASI devreye girer — `animate`
// duration:0 ile görünür değerleri ANINDA imperatif yazar (IntersectionObserver'ı beklemez,
// SSR kalıntısı opacity:0 ezilir). Tur 7 şartı korunur: reduce'ta içerik görünür, hareket yok.
export function useStillMode() {
  const reduce = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !!reduce;
}

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
  const still = useStillMode();
  return (
    <motion.div
      className={`reveal${className ? ` ${className}` : ""}`}
      initial={{ opacity: 0, y }}
      animate={still ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ ...VIEWPORT, once }}
      transition={still ? { duration: 0 } : { duration: 0.6, delay, ease: EASE }}
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
  const still = useStillMode();
  const x = from === "left" ? -32 : 32;
  return (
    <motion.div
      className={`reveal${className ? ` ${className}` : ""}`}
      initial={{ opacity: 0, x }}
      animate={still ? { opacity: 1, x: 0 } : undefined}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={still ? { duration: 0 } : { duration: 0.65, delay, ease: EASE }}
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

// Count-up — sayı viewport'a girince 0'dan hedefe akar (premium istatistik hissi).
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
  // Tur 18: başlangıç HEP 0 (SSR ile aynı) — `reduce ? to : 0` SSR/istemci metin uyuşmazlığı
  // yaratıyordu (hydration hatası). Reduce'ta effect mount'ta hedefi anında yazar.
  const [n, setN] = useState(0);

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
  const still = useStillMode();
  return (
    <motion.div
      className={`reveal${className ? ` ${className}` : ""}`}
      initial={{ opacity: 0, y }}
      animate={still ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={still ? { duration: 0 } : { duration: 0.55, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
