import type { ShiftDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { formatTime } from "@/lib/date";

// Tek vardiya kartı: kişi (başlık) + saat aralığı + pozisyon.
// SADELEŞTİRME: kalın gölge + hover-yükselme kaldırıldı (kartlar "yüzmesin", sakin
// dursun); saat TEK SATIR ve daha küçük; pozisyon rengi yalnız SOL ŞERİT'te (alt
// satırdaki tekrar renk noktası kaldırıldı — çift kodlama gürültüsü). Sol şerit tek
// kimlik kanalı, isim başlık, saat+pozisyon ikincil satır → net hiyerarşi.
export default function ShiftCard({ shift }: { shift: ShiftDto }) {
  const color = shift.positionColor ?? "#a39889"; // pozisyon rengi yoksa nötr sıcak gri
  const isDraft = shift.status === ShiftStatus.Draft;
  const isUnassigned = !shift.userId;

  return (
    <div
      className={`relative rounded-lg border border-l-[3px] px-2.5 py-2 text-sm transition-colors hover:bg-paper ${
        isDraft ? "border-line bg-cream/50" : "border-line bg-surface"
      }`}
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`truncate font-medium leading-tight ${isUnassigned ? "italic text-faint" : "text-ink"}`}>
          {shift.userFullName ?? "Açık vardiya"}
        </span>
        {isDraft && (
          <span className="shrink-0 rounded-full bg-signal/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-signal-deep">
            Taslak
          </span>
        )}
      </div>

      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
        <span className="font-mono tabular-nums tracking-tight">
          {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
        </span>
        <span aria-hidden="true" className="text-line-strong">·</span>
        <span className="truncate">{shift.positionName}</span>
      </div>
    </div>
  );
}
