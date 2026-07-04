"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { giveShift, takeShift } from "@/lib/api-client";
import { formatTime } from "@/lib/date";
import type { ShiftDto, ShiftPoolItemDto } from "@/lib/types";

// Staff Vardiya Havuzu: (1) kendi YAYINDAKİ vardiyanı sun (give), (2) havuzdaki
// açık/sunulmuş vardiyayı kap (take). Kimlik JWT'den; client yalnızca shiftId söyler.
// Onay modu ApprovalRequired ise sun/kap Pending kalır (backend karar verir).

function dayLabel(iso: string): string {
  return `${iso.slice(8, 10)}.${iso.slice(5, 7)} ${formatTime(iso)}`;
}

export default function StaffPool({
  offerable,
  pool,
  myName,
}: {
  offerable: ShiftDto[]; // kendi Yayında (status=1) vardiyalarım
  pool: ShiftPoolItemDto[];
  myName: string | null;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function run(id: string, fn: () => Promise<void>, okText: string) {
    setBusyId(id);
    setMsg(null);
    try {
      await fn();
      setMsg({ kind: "ok", text: okText });
      router.refresh();
    } catch (err) {
      setMsg({ kind: "err", text: err instanceof Error ? err.message : "İşlem başarısız." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`rounded-lg px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-sage-soft text-sage-deep" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* ── Sun: kendi yayındaki vardiyalarım ── */}
      <section className="space-y-2">
        <h2 className="font-display text-sm font-bold text-ink">Vardiyamı Sun</h2>
        {offerable.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-center text-xs text-muted">
            Sunabileceğin yayında vardiya yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {offerable.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 shadow-card">
                <div>
                  <p className="text-sm font-semibold text-ink">{dayLabel(s.startTime)}</p>
                  <p className="text-xs text-muted">{s.positionName} • {formatTime(s.startTime)}–{formatTime(s.endTime)}</p>
                </div>
                <button
                  onClick={() => run(s.id, () => giveShift(s.id), "Vardiya havuza sunuldu.")}
                  disabled={busyId === s.id}
                  className="shrink-0 rounded-lg bg-signal px-3 py-2 text-xs font-bold text-ink shadow-card transition-colors hover:bg-signal-deep hover:text-white disabled:opacity-60"
                >
                  {busyId === s.id ? "…" : "Sun"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Kap: havuzdaki vardiyalar ── */}
      <section className="space-y-2">
        <h2 className="font-display text-sm font-bold text-ink">Havuzdaki Vardiyalar</h2>
        {pool.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-surface p-4 text-center text-xs text-muted">
            Şu an havuzda uygun vardiya yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {pool.map((p) => {
              const mine = p.userFullName != null && p.userFullName === myName;
              return (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-surface p-3 shadow-card">
                  <div>
                    <p className="text-sm font-semibold text-ink">{dayLabel(p.startTime)}</p>
                    <p className="text-xs text-muted">
                      {p.positionName} • {formatTime(p.startTime)}–{formatTime(p.endTime)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-faint">
                      {p.branchName}{p.userFullName ? ` • ${p.userFullName} sundu` : " • açık vardiya"}
                    </p>
                  </div>
                  {mine ? (
                    <span className="shrink-0 rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-signal-deep">
                      Senin
                    </span>
                  ) : (
                    <button
                      onClick={() => run(p.id, () => takeShift(p.id), "Vardiya alındı.")}
                      disabled={busyId === p.id}
                      className="shrink-0 rounded-lg border border-line-strong px-3 py-1.5 text-xs font-medium text-muted hover:bg-paper-deep disabled:opacity-60"
                    >
                      {busyId === p.id ? "…" : "Kap"}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
