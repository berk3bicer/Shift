// Seçili şube cookie adı — hem server (branch.ts) hem client (BranchSwitcher) kullanır.
// next/headers'a bağımlı OLMAYAN nötr modül (client bundle'a sızmasın).
export const BRANCH_COOKIE = "selectedBranchId";
