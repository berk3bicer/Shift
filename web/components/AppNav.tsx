"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

// Yönetici üst navigasyonu (Tur 9). Eski hali server-side + hover-only dropdown'du:
// dokunmatik ekranda açılamıyor, aktif sekme belli olmuyor, mobilde taşıyordu.
// Şimdi: tıklamayla açılan gruplar + usePathname ile aktif vurgusu + mobil menü.
type NavChild = { href: string; label: string };
type NavItem = { label: string; href?: string; children?: NavChild[] };

const NAV: NavItem[] = [
  { label: "Ana Sayfa", href: "/dashboard" },
  { label: "Çizelge", href: "/schedule" },
  {
    label: "Ekip & Puantaj",
    children: [
      { href: "/timeclock", label: "Puantaj" },
      { href: "/timeoff", label: "İzinler" },
      { href: "/availability", label: "Müsaitlik" },
    ],
  },
  {
    label: "Operasyon",
    children: [
      { href: "/tasks", label: "Görevler" },
      { href: "/checklists", label: "Listeler" },
      { href: "/shift-notes", label: "Vardiya Defteri" },
      { href: "/announcements", label: "Duyurular" },
    ],
  },
  {
    label: "Finans",
    children: [
      { href: "/payroll", label: "Bordro" },
      { href: "/reports", label: "Raporlar" },
    ],
  },
  { label: "Ayarlar", href: "/settings" },
];

export default function AppNav({ mobileExtras }: { mobileExtras?: React.ReactNode }) {
  const pathname = usePathname();
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Rota değişince tüm menüleri kapat.
  useEffect(() => {
    setOpenGroup(null);
    setMobileOpen(false);
  }, [pathname]);

  // Grup dropdown'ı dışına tıklayınca kapat.
  useEffect(() => {
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenGroup(null);
      }
    }
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const groupActive = (item: NavItem) => item.children?.some((c) => isActive(c.href)) ?? false;

  const linkBase =
    "rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  const linkIdle = "text-muted hover:bg-paper-deep hover:text-ink";
  const linkOn = "bg-cream font-semibold text-ink";

  return (
    <div ref={rootRef} className="flex items-center">
      {/* Masaüstü nav */}
      <nav className="hidden items-center gap-1 lg:flex" aria-label="Ana menü">
        {NAV.map((item) =>
          item.href ? (
            <Link
              key={item.label}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`${linkBase} ${isActive(item.href) ? linkOn : linkIdle}`}
            >
              {item.label}
            </Link>
          ) : (
            <div key={item.label} className="relative">
              <button
                onClick={() => setOpenGroup((g) => (g === item.label ? null : item.label))}
                aria-expanded={openGroup === item.label}
                className={`${linkBase} flex items-center gap-1 ${
                  groupActive(item) ? linkOn : linkIdle
                }`}
              >
                {item.label}
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${openGroup === item.label ? "rotate-180" : ""}`}
                />
              </button>
              {openGroup === item.label && (
                <div className="absolute left-0 top-full z-50 mt-1.5 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-float">
                  {item.children!.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      aria-current={isActive(c.href) ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        isActive(c.href)
                          ? "bg-cream font-semibold text-ink"
                          : "text-muted hover:bg-paper-deep hover:text-ink"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        )}
      </nav>

      {/* Mobil: hamburger + tam genişlik panel */}
      <button
        onClick={() => setMobileOpen((o) => !o)}
        aria-expanded={mobileOpen}
        aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
        className="flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper-deep hover:text-ink lg:hidden"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {mobileOpen && (
        <div className="fixed inset-x-0 top-14 z-40 max-h-[calc(100vh-3.5rem)] overflow-y-auto border-b border-line bg-surface pb-4 shadow-float lg:hidden">
          <nav className="space-y-4 px-4 pt-3" aria-label="Ana menü (mobil)">
            {NAV.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    isActive(item.href) ? "bg-cream font-semibold text-ink" : "text-muted"
                  }`}
                >
                  {item.label}
                </Link>
              ) : (
                <div key={item.label}>
                  <div className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-faint">
                    {item.label}
                  </div>
                  {item.children!.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      aria-current={isActive(c.href) ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                        isActive(c.href) ? "bg-cream font-semibold text-ink" : "text-muted"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )
            )}
          </nav>
          {mobileExtras && (
            <div className="mt-3 border-t border-line px-4 pt-4">{mobileExtras}</div>
          )}
        </div>
      )}
    </div>
  );
}
