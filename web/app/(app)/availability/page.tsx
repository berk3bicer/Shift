import { getAvailabilities, getStaff } from "@/lib/api-server";
import AvailabilityBoard from "@/components/availability/AvailabilityBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Müsaitlik Yönetimi | Shift",
};

// Sunucu tarafında personelleri ve müsaitliklerini çeker
export default async function AvailabilityPage() {
  const [availabilities, staff] = await Promise.all([
    getAvailabilities(),
    getStaff(),
  ]);

  return (
    <AvailabilityBoard
      initialAvailabilities={availabilities}
      staff={staff}
    />
  );
}
