import { getTimeClocks } from "@/lib/api-server";
import TimeClockBoard from "@/components/timeclock/TimeClockBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Puantaj Yönetimi | Shift",
};

export default async function TimeClockPage() {
  const branchId = "b1"; // Sabit mock branch
  // Demo için "s1" ID'li personeli giriş yapmış sayalım, veya s2
  // Butonları test edebilmek için currentUserId olarak "s2" (Ayşe Demir, açık kaydı var) 
  // ya da "s1" kullanabiliriz. "s2" açık kayda sahip olduğu için önce Çıkış yapabilecektir.
  const currentUserId = "s2"; 

  const clocks = await getTimeClocks(branchId, false);

  return (
    <TimeClockBoard
      initialClocks={clocks}
      branchId={branchId}
      currentUserId={currentUserId}
    />
  );
}
