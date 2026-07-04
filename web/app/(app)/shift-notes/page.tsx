import { getShiftNotes, getBranches, getMe } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import ShiftNotesBoard from "@/components/shiftnotes/ShiftNotesBoard";

export const metadata = {
  title: "Vardiya Defteri | Shift",
};

export default async function ShiftNotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const branches = await getBranches();
  if (branches.length === 0) {
    return <div className="p-4 text-red-500">Önce bir şube eklemelisiniz.</div>;
  }
  
  const branch = (await selectBranch(branches))!;
  const me = await getMe();

  const sp = await searchParams;
  
  // Varsayılan olarak bugünü al, query parametresi varsa onu kullan
  const today = new Date().toISOString().split("T")[0];
  const noteDate = (sp.date as string) || today;

  const initialNotes = await getShiftNotes(branch.id, noteDate);

  return (
    <ShiftNotesBoard 
      initialNotes={initialNotes} 
      branch={branch}
      noteDate={noteDate}
      currentUserId={me.userId}
      currentUserRoles={me.roles}
    />
  );
}
