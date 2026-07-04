import { getTimeOffRequests, getMe } from "@/lib/api-server";
import TimeOffBoard from "@/components/timeoff/TimeOffBoard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "İzin Yönetimi | Shift",
};

// Sunucu tarafında izin taleplerini + oturum sahibini çeker.
// Not: Talep oluşturma backend'de HER ZAMAN login olan kullanıcı adına kaydedilir
// (token'dan; gövdedeki userId yok sayılır). Bu yüzden personel seçici yok — kim
// giriş yaptıysa talep onun adına düşer (gerçeğe uygun optimistic görünüm için ad).
export default async function TimeOffPage() {
  const [requests, me] = await Promise.all([
    getTimeOffRequests(),
    getMe(),
  ]);

  return (
    <TimeOffBoard
      initialRequests={requests}
      currentUserId={me.userId}
      currentUserName={me.name}
    />
  );
}
