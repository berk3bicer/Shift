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
    return <span className="text-sm font-medium text-muted">{branches[0]?.name}</span>;
  }

  return (
    <select
      value={currentId}
      onChange={onChange}
      className="rounded-lg border border-line-strong bg-surface px-2 py-2 text-sm font-medium text-ink focus:border-signal focus:outline-none"
      aria-label="Şube seç"
    >
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}
