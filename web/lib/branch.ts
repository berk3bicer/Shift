import "server-only";
import { cookies } from "next/headers";
import type { BranchDto } from "./types";
import { BRANCH_COOKIE } from "./branchCookie";

// Seçili şube — cookie'de tutulur (server component'ler de okuyabilsin diye; React
// context client-only olurdu). Dropdown cookie'yi set edip router.refresh() yapar.

// Cookie'deki şubeyi döndürür; yoksa/geçersizse ilk şube. branches boşsa null.
export async function selectBranch(branches: BranchDto[]): Promise<BranchDto | null> {
  if (branches.length === 0) return null;
  const store = await cookies();
  const id = store.get(BRANCH_COOKIE)?.value;
  return branches.find((b) => b.id === id) ?? branches[0];
}
