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
        <div className={`rounded-md px-3 py-2 text-sm ${msg.kind === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* ── Sun: kendi yayındaki vardiyalarım ── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-900">Vardiyamı Sun</h2>
        {offerable.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-500">
            Sunabileceğin yayında vardiya yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {offerable.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{dayLabel(s.startTime)}</p>
                  <p className="text-xs text-gray-500">{s.positionName} • {formatTime(s.startTime)}–{formatTime(s.endTime)}</p>
                </div>
                <button
                  onClick={() => run(s.id, () => giveShift(s.id), "Vardiya havuza sunuldu.")}
                  disabled={busyId === s.id}
                  className="shrink-0 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-60"
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
        <h2 className="text-sm font-semibold text-gray-900">Havuzdaki Vardiyalar</h2>
        {pool.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-4 text-center text-xs text-gray-500">
            Şu an havuzda uygun vardiya yok.
          </p>
        ) : (
          <ul className="space-y-2">
            {pool.map((p) => {
              const mine = p.userFullName != null && p.userFullName === myName;
              return (
                <li key={p.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{dayLabel(p.startTime)}</p>
                    <p className="text-xs text-gray-500">
                      {p.positionName} • {formatTime(p.startTime)}–{formatTime(p.endTime)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {p.branchName}{p.userFullName ? ` • ${p.userFullName} sundu` : " • açık vardiya"}
                    </p>
                  </div>
                  {mine ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                      Senin
                    </span>
                  ) : (
                    <button
                      onClick={() => run(p.id, () => takeShift(p.id), "Vardiya alındı.")}
                      disabled={busyId === p.id}
                      className="shrink-0 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
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
