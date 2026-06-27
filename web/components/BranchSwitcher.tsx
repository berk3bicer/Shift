"use client";

import { useRouter } from "next/navigation";
import type { BranchDto } from "@/lib/types";
import { BRANCH_COOKIE } from "@/lib/branchCookie";

// Şube seçici dropdown. Seçimi cookie'ye yazar (1 yıl) + sayfayı yeniler → tüm server
// component'ler yeni şubeyle yeniden render olur. branches[0] sabitinin yerini alır.
export default function BranchSwitcher({
  branches,
  currentId,
}: {
  branches: BranchDto[];
  currentId: string;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    document.cookie = `${BRANCH_COOKIE}=${e.target.value}; path=/; max-age=31536000`;
    router.refresh();
  }

  if (branches.length <= 1) {
    return <span className="text-sm font-medium text-gray-700">{branches[0]?.name}</span>;
  }

  return (
    <select
      value={currentId}
      onChange={onChange}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-700 focus:border-gray-900 focus:outline-none"
      aria-label="Şube seç"
    >
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}
