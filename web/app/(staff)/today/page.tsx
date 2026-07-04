import Link from "next/link";
import { CalendarDays, Clock, ListChecks, CalendarPlus, Repeat } from "lucide-react";
import InstallHint from "@/components/staff/InstallHint";

// Staff ana ekranı — büyük dokunmatik kartlar. Hazır olan aksiyonlar aktif link;
// backend self-read ucu bekleyenler "yakında" (gated) olarak pasif gösterilir.
type Card = {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  ready: boolean;
};

const CARDS: Card[] = [
  { href: "/today/shifts", title: "Vardiyalarım", desc: "Programın", icon: CalendarDays, ready: true },
  { href: "/today/tasks", title: "Görevlerim", desc: "Atanan işler", icon: ListChecks, ready: true },
  { href: "/today/pool", title: "Vardiya Havuzu", desc: "Vardiya ver / al", icon: Repeat, ready: true },
  { href: "/today/timeoff", title: "İzin Talebi", desc: "Yeni talep + geçmişin", icon: CalendarPlus, ready: true },
  { href: "/today/clock", title: "Giriş / Çıkış", desc: "Puantaj", icon: Clock, ready: true },
];

export default function StaffTodayPage() {
  return (
    <div className="space-y-4">
      <InstallHint />
      <h1 className="font-display text-xl font-bold text-ink">Bugün</h1>
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map((c) => {
          const Icon = c.icon;
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-signal-deep" />
                {!c.ready && (
                  <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10px] font-medium text-faint">
                    yakında
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-sm font-semibold text-ink">{c.title}</p>
                <p className="mt-0.5 text-xs text-muted">{c.desc}</p>
              </div>
            </>
          );
          return c.ready ? (
            <Link
              key={c.href}
              href={c.href}
              className="rounded-xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-signal hover:bg-cream"
            >
              {inner}
            </Link>
          ) : (
            <div
              key={c.href}
              aria-disabled
              className="cursor-not-allowed rounded-xl border border-line bg-surface p-4 opacity-60"
            >
              {inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}
