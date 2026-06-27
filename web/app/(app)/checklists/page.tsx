import { getChecklists, getChecklistRuns, getBranches } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import ChecklistsBoard from "@/components/checklists/ChecklistsBoard";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Kontrol Listeleri | Shift",
};

export default async function ChecklistsPage() {
  const branches = await getBranches();
  if (branches.length === 0) {
    return <div className="p-4 text-rose-500">Önce bir şube eklemelisiniz.</div>;
  }
  
  const branch = (await selectBranch(branches))!;

  // Bugünün tarihi
  const today = new Date().toISOString().split("T")[0];

  const [checklists, initialRuns] = await Promise.all([
    getChecklists(),
    getChecklistRuns(branch.id, today)
  ]);

  return (
    <ChecklistsBoard 
      checklists={checklists} 
      initialRuns={initialRuns} 
      branch={branch}
      runDate={today}
    />
  );
}
