import { getAnnouncements, getBranches, getMe } from "@/lib/api-server";
import { selectBranch } from "@/lib/branch";
import AnnouncementsBoard from "@/components/announcements/AnnouncementsBoard";

export const metadata = {
  title: "Duyurular | Shift",
};

export default async function AnnouncementsPage() {
  const branches = await getBranches();
  if (branches.length === 0) {
    return <div className="p-4 text-rose-500">Önce bir şube eklemelisiniz.</div>;
  }
  
  const branch = (await selectBranch(branches))!;
  const me = await getMe();

  const initialAnnouncements = await getAnnouncements(branch.id);
  
  // Sadece Owner ve Manager duyuru yapabilir
  const canAnnounce = me.roles.includes("Owner") || me.roles.includes("Manager");

  return (
    <AnnouncementsBoard 
      initialAnnouncements={initialAnnouncements} 
      branch={branch}
      currentUserId={me.userId}
      canAnnounce={canAnnounce}
    />
  );
}
