import { getStaff, getBranches, getPositions } from "@/lib/api-server";
import TeamBoard from "@/components/team/TeamBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ekip | Shiftle",
};

// Ekip yönetimi — personel listesi + davet + yeniden-davet + pasifleştir.
// Guard (app)/layout.tsx'te: Staff bu route grubuna giremez → ek kontrol gerekmez.
export default async function TeamPage() {
  const [staff, branches, positions] = await Promise.all([
    getStaff(),
    getBranches(),
    getPositions(),
  ]);

  return <TeamBoard staff={staff} branches={branches} positions={positions} />;
}
