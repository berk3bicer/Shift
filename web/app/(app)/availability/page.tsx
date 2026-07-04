import { getAvailabilities, getStaff } from "@/lib/api-server";
import AvailabilityBoard from "@/components/availability/AvailabilityBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müsaitlik Yönetimi | Shift",
};

// Müsaitlik listesi backend'de PER-USER (userId zorunlu) — "tüm ekip" ucu yok.
// Yönetici görünümü için her personelin müsaitliğini çekip birleştiriyoruz.
export default async function AvailabilityPage() {
  const staff = await getStaff();
  const lists = await Promise.all(staff.map((s) => getAvailabilities(s.id)));
  const availabilities = lists.flat();

  return (
    <AvailabilityBoard
      initialAvailabilities={availabilities}
      staff={staff}
    />
  );
}
