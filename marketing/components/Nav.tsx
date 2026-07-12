"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowRightLeft,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock,
  KanbanSquare,
  Menu,
  Newspaper,
  Package,
  SprayCan,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { LOGIN_URL, REGISTER_URL } from "@/lib/config";
import { MODULE_PAGES } from "@/lib/modules";
import ShiftleMark from "@/components/ShiftleMark";
import Wordmark from "@/components/Wordmark";

// Tur 7: mega-menü nav. Anchor-scroll YOK — tüm linkler GERÇEK route geçişi.
// Masaüstü: "Modüller" ve "Kaynaklar" hover/tıkla açılan panel; "Neden Shift" ve "Fiyatlar"
// direkt link. Mobil: hamburger → tam ekran menü, gruplar accordion. Route değişince menü
// otomatik kapanır (usePathname). prefers-reduced-motion'da panel animasyonsuz açılır.

const MODULE_ICONS: Record<string, LucideIcon> = {
  CalendarDays,
  KanbanSquare,
  Clock,
  ArrowRightLeft,
  Package,
  SprayCan,
};

const RESOURCES = [
  {
    href: "/kaynaklar/kafe-rehberi",
    icon: BookOpen,
    title: "Kafe Operasyon Rehberi",
    desc: "Verilerle ekip yönetimi — kaynaklı sektör verileri",
  },
];

type PanelKey = "moduller" | "kaynaklar";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // mobil menü
  const [panel, setPanel] = useState<PanelKey | null>(null); // masaüstü mega panel
  const [accordion, setAccordion] = useState<PanelKey | null>("moduller"); // mobil grup
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduce = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Route değişince tüm menüleri kapat
  useEffect(() => {
    setOpen(false);
    setPanel(null);
  }, [pathname]);

  // Escape ile paneli kapat (klavye erişilebilirliği)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Hover ile aç/kapa — kapanışa küçük gecikme (panele inen imleç düşmesin)
  function openPanel(key: PanelKey) {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setPanel(key);
  }
  function scheduleClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setPanel(null), 140);
  }

  const solid = scrolled || panel !== null || open;

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Link href="/" className="flex items-center gap-2" aria-label="Shiftle ana sayfa">
          <ShiftleMark className="h-8 w-8" />
          <Wordmark className="text-xl text-[var(--color-ink)]" />
        </Link>

        {/* Masaüstü menü */}
        <div className="hidden items-center gap-1 md:flex">
          <PanelTrigger
            label="Modüller"
            active={panel === "moduller" || pathname.startsWith("/moduller")}
            expanded={panel === "moduller"}
            onEnter={() => openPanel("moduller")}
            onLeave={scheduleClose}
            onClick={() => setPanel((p) => (p === "moduller" ? null : "moduller"))}
          />
          <TopLink href="/neden-shift" label="Neden Shiftle" active={pathname === "/neden-shift"} />
          <TopLink href="/fiyatlar" label="Fiyatlar" active={pathname === "/fiyatlar"} />
          <PanelTrigger
            label="Kaynaklar"
            active={panel === "kaynaklar" || pathname.startsWith("/kaynaklar")}
            expanded={panel === "kaynaklar"}
            onEnter={() => openPanel("kaynaklar")}
            onLeave={scheduleClose}
            onClick={() => setPanel((p) => (p === "kaynaklar" ? null : "kaynaklar"))}
          />
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

      {/* Masaüstü mega panel — nav'ın hemen altında, aydınlık kart.
          Giriş animasyonu SAF CSS keyframe (.anim-settle): framer mount-animate arka plan/
          headless sekmede rAF durunca yarı-saydam takılıyordu (Gün 34 dersi) — keyframe her
          koşulda son kareye çözülür. Kapanış animasyonsuz (hover menüde anında kapanış doğal). */}
      {panel && (
        <div
          key={panel}
          onMouseEnter={() => openPanel(panel)}
          onMouseLeave={scheduleClose}
          className="anim-settle absolute inset-x-0 top-full hidden justify-center px-5 pt-2 md:flex"
          style={{ animationDuration: "0.2s" }}
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-float)]">
            {panel === "moduller" ? <ModulesPanel /> : <ResourcesPanel />}
          </div>
        </div>
      )}

      {/* Mobil tam menü — gruplar accordion */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="max-h-[calc(100dvh-3.75rem)] overflow-y-auto border-t border-[var(--color-line)] bg-[var(--color-paper)]/97 backdrop-blur-lg md:hidden"
          >
            <div className="flex flex-col px-5 py-4">
              <MobileGroup
                label="Modüller"
                expanded={accordion === "moduller"}
                onToggle={() => setAccordion((a) => (a === "moduller" ? null : "moduller"))}
              >
                {MODULE_PAGES.map((m) => {
                  const Icon = MODULE_ICONS[m.icon] ?? CalendarDays;
                  return (
                    <Link
                      key={m.slug}
                      href={`/moduller/${m.slug}`}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--color-paper-deep)]"
                    >
                      <Icon size={17} className="shrink-0 text-[var(--color-signal-deep)]" />
                      <span className="text-[15px] font-medium text-[var(--color-ink)]">{m.name}</span>
                      {m.phase && (
                        <span className="ml-auto rounded-full bg-[var(--color-cream)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-signal-deep)]">
                          Yakında
                        </span>
                      )}
                    </Link>
                  );
                })}
                <Link
                  href="/moduller"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--color-signal-deep)] hover:bg-[var(--color-paper-deep)]"
                >
                  Tüm modüller <ArrowRight size={14} />
                </Link>
              </MobileGroup>

              <Link
                href="/neden-shift"
                className="rounded-lg px-3 py-3 text-base font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
              >
                Neden Shiftle
              </Link>
              <Link
                href="/fiyatlar"
                className="rounded-lg px-3 py-3 text-base font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
              >
                Fiyatlar
              </Link>

              <MobileGroup
                label="Kaynaklar"
                expanded={accordion === "kaynaklar"}
                onToggle={() => setAccordion((a) => (a === "kaynaklar" ? null : "kaynaklar"))}
              >
                {RESOURCES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--color-paper-deep)]"
                  >
                    <r.icon size={17} className="shrink-0 text-[var(--color-signal-deep)]" />
                    <span className="text-[15px] font-medium text-[var(--color-ink)]">{r.title}</span>
                  </Link>
                ))}
                <span className="flex items-center gap-3 rounded-lg px-3 py-2.5 opacity-60">
                  <Newspaper size={17} className="shrink-0 text-[var(--color-muted)]" />
                  <span className="text-[15px] font-medium text-[var(--color-muted)]">Blog — yakında</span>
                </span>
              </MobileGroup>

              <a
                href={LOGIN_URL}
                className="mt-1 rounded-lg border-t border-[var(--color-line)] px-3 pb-2 pt-4 text-base font-medium text-[var(--color-ink)]"
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

// Mobil accordion grubu — başlığa dokununca alt linkler açılır (tek grup açık kalır).
function MobileGroup({
  label,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <div className="border-b border-[var(--color-line)] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-base font-medium text-[var(--color-ink)] hover:bg-[var(--color-paper-deep)]"
      >
        {label}
        <ChevronDown size={16} className={clsx("transition-transform duration-200", expanded && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-2 pl-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TopLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-[var(--color-ink)]",
        active ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]",
      )}
    >
      {label}
    </Link>
  );
}

function PanelTrigger({
  label,
  active,
  expanded,
  onEnter,
  onLeave,
  onClick,
}: {
  label: string;
  active: boolean;
  expanded: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="true"
      className={clsx(
        "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-[var(--color-ink)]",
        active ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]",
      )}
    >
      {label}
      <ChevronDown size={14} className={clsx("transition-transform duration-200", expanded && "rotate-180")} />
    </button>
  );
}

function ModulesPanel() {
  return (
    <div>
      <div className="grid grid-cols-2 gap-1 p-3 lg:grid-cols-3">
        {MODULE_PAGES.map((m) => {
          const Icon = MODULE_ICONS[m.icon] ?? CalendarDays;
          return (
            <Link
              key={m.slug}
              href={`/moduller/${m.slug}`}
              className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--color-cream)]/60"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-cream)] text-[var(--color-signal-deep)] transition-colors group-hover:bg-[var(--color-signal)] group-hover:text-[var(--color-ink)]">
                <Icon size={17} />
              </span>
              <span>
                <span className="flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                  {m.name}
                  {m.phase && (
                    <span className="rounded-full bg-[var(--color-cream)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-signal-deep)]">
                      Yakında
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-xs leading-snug text-[var(--color-muted)]">{m.short}</span>
              </span>
            </Link>
          );
        })}
      </div>
      <div className="border-t border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-3">
        <Link
          href="/moduller"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--color-signal-deep)] transition-colors hover:text-[var(--color-ink)]"
        >
          Tüm modüller <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}

function ResourcesPanel() {
  return (
    <div className="grid gap-1 p-3 sm:grid-cols-2">
      {RESOURCES.map((r) => (
        <Link
          key={r.href}
          href={r.href}
          className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--color-cream)]/60"
        >
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-cream)] text-[var(--color-signal-deep)] transition-colors group-hover:bg-[var(--color-signal)] group-hover:text-[var(--color-ink)]">
            <r.icon size={17} />
          </span>
          <span>
            <span className="block text-sm font-bold text-[var(--color-ink)]">{r.title}</span>
            <span className="mt-0.5 block text-xs leading-snug text-[var(--color-muted)]">{r.desc}</span>
          </span>
        </Link>
      ))}
      {/* Blog placeholder — link YOK, dürüst "yakında" */}
      <div className="flex items-start gap-3 rounded-xl p-3 opacity-60">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-paper-deep)] text-[var(--color-muted)]">
          <Newspaper size={17} />
        </span>
        <span>
          <span className="block text-sm font-bold text-[var(--color-muted)]">Blog — yakında</span>
          <span className="mt-0.5 block text-xs leading-snug text-[var(--color-muted)]">
            Kafe operasyonu üzerine yazılar hazırlanıyor
          </span>
        </span>
      </div>
    </div>
  );
}
