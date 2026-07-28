"use client";

import { useRouter } from "next/navigation";
import type { BranchDto } from "@/lib/types";
import { BRANCH_COOKIE } from "@/lib/branchCookie";

// Şube seçici dropdown. Seçimi cookie'ye yazar (1 yıl) + sayfayı yeniler → tüm server
// component'ler yeni şubeyle yeniden render olur. branches[0] sabitinin yerini alır.
//
// tone: bu bileşen İKİ zeminde render ediliyor — yönetici üst barı (ESPRESSO,
// tone="dark") ve mobil hamburger panelinin açık yüzeyi. Tek sınıf seti ikisini birden
// karşılayamaz (latte/roast beyaz panelde okunmaz), o yüzden zemin dışarıdan söylenir.
// Varsayılan "light" — koyu zemin istisna, çağıran açıkça söyler.
export default function BranchSwitcher({
  branches,
  currentId,
  tone = "light",
}: {
  branches: BranchDto[];
  currentId: string;
  tone?: "dark" | "light";
}) {
  const dark = tone === "dark";
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    document.cookie = `${BRANCH_COOKIE}=${e.target.value}; path=/; max-age=31536000`;
    router.refresh();
  }

  if (branches.length <= 1) {
    return (
      <span className={`text-sm font-medium ${dark ? "text-latte" : "text-muted"}`}>
        {branches[0]?.name}
      </span>
    );
  }

  return (
    <select
      value={currentId}
      onChange={onChange}
      className={`rounded-lg border px-2 py-2 text-sm font-medium focus:border-signal focus:outline-none ${
        dark ? "border-espresso-line bg-roast text-foam" : "border-line-strong bg-surface text-ink"
      }`}
      aria-label="Şube seç"
    >
      {branches.map((b) => (
        <option key={b.id} value={b.id}>{b.name}</option>
      ))}
    </select>
  );
}
