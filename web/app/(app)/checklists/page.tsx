import { getChecklists, getChecklistRuns, getChecklistRun, getBranches } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import ChecklistsBoard from "@/components/checklists/ChecklistsBoard";

export const metadata = {
  title: "Kontrol Listeleri | Shift",
};

export default async function ChecklistsPage() {
  const branches = await getBranches();
  if (branches.length === 0) {
    return <div className="p-4 text-red-500">Önce bir şube eklemelisiniz.</div>;
  }

  const branch = (await selectBranch(branches))!;

  // Bugünün tarihi
  const today = new Date().toISOString().split("T")[0];

  // Liste ucu hafif özet döner (madde yok). Pano maddeleri inline işaretlediği için
  // her özet için tam detayı (madde + kim/ne zaman + foto) çekeriz — bounded N+1
  // (günde birkaç çalıştırma). Availability'deki per-user deseninin aynısı.
  const [checklists, summaries] = await Promise.all([
    getChecklists(),
    getChecklistRuns(branch.id, today),
  ]);

  const initialRuns = await Promise.all(
    summaries.map((s) => getChecklistRun(s.id))
  );

  return (
    <ChecklistsBoard
      checklists={checklists}
      initialRuns={initialRuns}
      branch={branch}
      runDate={today}
    />
  );
}
