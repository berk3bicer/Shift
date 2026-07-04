import { redirect } from "next/navigation";
import { getMe, getBranches, getPositions, ApiError } from "@/lib/api-server";
import { isManager } from "@/lib/roles";
import OnboardingWizard from "@/components/OnboardingWizard";
import type { BranchDto, PositionDto } from "@/lib/types";

// Kurulum sihirbazı — (app) DIŞINDA bilerek: (app) layout şube-seçici/guard'ı çalıştırır,
// oysa yeni sahip henüz şubesiz (getBranches boş → seçici patlar). Onboarding kendi
// sade kabuğunda durur. Sunucuda mevcut şube/pozisyonları çekip client'a verir →
// yarıda bırakılan kurulum kaldığı yerden devam eder (idempotent his; çift kayıt yok).
export default async function OnboardingPage() {
  let branches: BranchDto[] = [];
  let positions: PositionDto[] = [];
  try {
    const me = await getMe();
    // Staff buraya düşmez (davetle gelir, şubesi vardır) → kendi ana ekranına yolla.
    if (!isManager(me.roles)) redirect("/today");
    branches = await getBranches();
    positions = await getPositions();
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) redirect("/login");
    throw e;
  }

  return <OnboardingWizard initialBranches={branches} initialPositions={positions} />;
}
