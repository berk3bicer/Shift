"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Menu, X } from "lucide-react";
import clsx from "clsx";
import { LOGIN_URL, REGISTER_URL } from "@/lib/config";

const LINKS = [
  { label: "Modüller", href: "#moduller" },
  { label: "Neden Shift", href: "#neden" },
  { label: "Fiyatlar", href: "#fiyat" },
];

// Sticky nav — AYDINLIK. Scroll'da kağıt beyazı + blur + ince gölge kazanır (7shifts deseni).
// Koyu metin. Mono alt-etiket ("kafe operasyonu") KALDIRILDI (kod-hissi veriyordu).
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[var(--color-line)] bg-[var(--color-paper)]/85 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#top" className="flex items-center gap-2" aria-label="Shift ana sayfa">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-signal)] font-display text-base font-extrabold text-[var(--color-ink)]">
            S
          </span>
          <span className="font-display text-xl font-extrabold text-[var(--color-ink)]">Shift</span>
        </a>

        {/* Masaüstü menü */}
        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-muted)] transition-colors hover:text-[var(--color-ink)]"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <a
            href={LOGIN_URL}
            className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:text-[var(--color-signal-deep)] sm:inline-block"
          >
            Giriş Yap
          </a>
          <a
            href={REGISTER_URL}
            className="rounded-lg bg-[var(--color-signal)] px-4 py-2 text-sm font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
          >
            Ücretsiz Başla
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)] md:hidden"
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobil açılır menü */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-[var(--color-line)] bg-[var(--color-paper)]/97 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-base font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={LOGIN_URL}
                className="rounded-lg px-3 py-2.5 text-base font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
              >
                Giriş Yap
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
