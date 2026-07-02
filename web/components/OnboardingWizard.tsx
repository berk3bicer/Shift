"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBranch, createPosition, ApiClientError } from "@/lib/api-client";
import type { BranchDto, PositionDto } from "@/lib/types";

// Kafe için hazır pozisyon önerileri (tek tıkla ekle). Renkler backend #RRGGBB kuralına uyar.
const SUGGESTED = [
  { name: "Barista", colorCode: "#22C55E" },
  { name: "Kasiyer", colorCode: "#3B82F6" },
  { name: "Komi", colorCode: "#F59E0B" },
];

// Manuel eklenen pozisyonlara döngüsel varsayılan renk ata (kullanıcı sonra değiştirebilir).
const PALETTE = ["#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1"];

type CreatedPosition = { id: string; name: string; colorCode: string };

export default function OnboardingWizard({
  initialBranches,
  initialPositions,
}: {
  initialBranches: BranchDto[];
  initialPositions: PositionDto[];
}) {
  const router = useRouter();

  // Devam (resume): zaten kurulu şube varsa branchId'yi al ve doğrudan Adım 2'den başla.
  const existingBranch = initialBranches[0] ?? null;
  const [branchId, setBranchId] = useState<string | null>(existingBranch?.id ?? null);
  const [branchName, setBranchName] = useState(existingBranch?.name ?? "");
  const [branchAddress, setBranchAddress] = useState(existingBranch?.address ?? "");

  const [positions, setPositions] = useState<CreatedPosition[]>(
    initialPositions.map((p) => ({ id: p.id, name: p.name, colorCode: p.colorCode ?? "#64748B" })),
  );

  const [step, setStep] = useState<1 | 2 | 3>(existingBranch ? 2 : 1);
  const [newPosName, setNewPosName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Aynı ada 2. pozisyon POST'u backend'de unique index'e düşer → UI'da baştan engelle.
  const takenNames = useMemo(
    () => new Set(positions.map((p) => p.name.trim().toLocaleLowerCase("tr"))),
    [positions],
  );
  const isTaken = (name: string) => takenNames.has(name.trim().toLocaleLowerCase("tr"));

  async function submitBranch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!branchName.trim()) {
      setError("Şube adı gerekli.");
      return;
    }
    // Zaten kurulu şube varsa yeniden POST'lamadan Adım 2'ye geç (çift kayıt yok).
    if (branchId) {
      setStep(2);
      return;
    }
    setBusy(true);
    try {
      const { branchId: newId } = await createBranch({
        name: branchName.trim(),
        address: branchAddress.trim() || null,
        latitude: null,
        longitude: null,
      });
      setBranchId(newId);
      setStep(2);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Şube oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function addPosition(name: string, colorCode: string) {
    setError(null);
    const clean = name.trim();
    if (!clean) return;
    if (isTaken(clean)) {
      setError(`"${clean}" zaten ekli.`);
      return;
    }
    setBusy(true);
    try {
      const { positionId } = await createPosition({ name: clean, colorCode, hourlyRate: null });
      setPositions((prev) => [...prev, { id: positionId, name: clean, colorCode }]);
      setNewPosName("");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Pozisyon oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  function finish() {
    // Kök yönlendirme artık şube > 0 gördüğünden dashboard'a düşer; doğrudan oraya gidiyoruz.
    router.replace("/dashboard");
    router.refresh();
  }

  const manualColor = PALETTE[positions.length % PALETTE.length];

  return (
    <main className="flex min-h-screen items-start justify-center bg-gray-50 p-4 sm:items-center">
      <div className="w-full max-w-lg space-y-6 rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Kurulumu tamamla</h1>
          <p className="text-sm text-gray-500">
            İlk şubeni ve pozisyonlarını ekle — sonra panele geç.
          </p>
        </div>

        <StepBar step={step} />

        {error && (
          <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        )}

        {/* ── Adım 1 — Şube ── */}
        {step === 1 && (
          <form onSubmit={submitBranch} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="branchName" className="text-sm font-medium text-gray-700">
                Şube adı
              </label>
              <input
                id="branchName"
                type="text"
                required
                maxLength={150}
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
                placeholder="Merkez Şube"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="branchAddress" className="text-sm font-medium text-gray-700">
                Adres <span className="text-gray-400">(opsiyonel)</span>
              </label>
              <input
                id="branchAddress"
                type="text"
                maxLength={300}
                value={branchAddress ?? ""}
                onChange={(e) => setBranchAddress(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
                placeholder="Bağdat Cad. No:1, İstanbul"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {busy ? "Kaydediliyor…" : "Devam et"}
            </button>
          </form>
        )}

        {/* ── Adım 2 — Pozisyonlar ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Hazır öneriler</p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((s) => {
                  const added = isTaken(s.name);
                  return (
                    <button
                      key={s.name}
                      type="button"
                      disabled={added || busy}
                      onClick={() => addPosition(s.name, s.colorCode)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: s.colorCode }}
                      />
                      {added ? `${s.name} ✓` : `+ ${s.name}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addPosition(newPosName, manualColor);
              }}
              className="space-y-2"
            >
              <label htmlFor="newPos" className="text-sm font-medium text-gray-700">
                Kendi pozisyonun
              </label>
              <div className="flex gap-2">
                <input
                  id="newPos"
                  type="text"
                  maxLength={100}
                  value={newPosName}
                  onChange={(e) => setNewPosName(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-gray-900 placeholder:text-gray-400"
                  placeholder="Örn. Müdür"
                />
                <button
                  type="submit"
                  disabled={busy || !newPosName.trim() || isTaken(newPosName)}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
                >
                  Ekle
                </button>
              </div>
            </form>

            {positions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Eklenenler ({positions.length})
                </p>
                <ul className="space-y-1.5">
                  {positions.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-800"
                    >
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: p.colorCode }}
                      />
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                ← Geri
              </button>
              <button
                type="button"
                disabled={positions.length === 0}
                onClick={() => setStep(3)}
                className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40"
              >
                Devam et
              </button>
            </div>
          </div>
        )}

        {/* ── Adım 3 — Bitir ── */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
              <p className="font-medium text-gray-900">Kurulum özeti</p>
              <p className="mt-1">
                <span className="font-semibold">1</span> şube (
                {branchName || existingBranch?.name}) ve{" "}
                <span className="font-semibold">{positions.length}</span> pozisyon kuruldu.
              </p>
              <p className="mt-1 text-gray-500">{positions.map((p) => p.name).join(", ")}</p>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                ← Geri
              </button>
              <button
                type="button"
                onClick={finish}
                className="rounded-md bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Panele git
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// Adım göstergesi / ilerleme çubuğu (3 adım).
function StepBar({ step }: { step: 1 | 2 | 3 }) {
  const labels = ["Şube", "Pozisyonlar", "Bitir"];
  return (
    <div className="flex items-center gap-2">
      {labels.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                done
                  ? "bg-gray-900 text-white"
                  : active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {done ? "✓" : n}
            </div>
            <span
              className={`text-xs ${active || done ? "text-gray-900" : "text-gray-400"}`}
            >
              {label}
            </span>
            {i < labels.length - 1 && <div className="h-px flex-1 bg-gray-200" />}
          </div>
        );
      })}
    </div>
  );
}
