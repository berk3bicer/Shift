import { getOvertimeSettings } from "@/lib/api-server";
import OvertimeSettingsForm from "@/components/settings/OvertimeSettingsForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ayarlar | Shiftle",
};

export default async function SettingsPage() {
  const settings = await getOvertimeSettings();

  return (
    <div className="space-y-6">
      <OvertimeSettingsForm initialSettings={settings} />
    </div>
  );
}
