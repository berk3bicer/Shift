import type { ShiftDto } from "@/lib/types";
import { ShiftStatus } from "@/lib/types";
import { formatTime } from "@/lib/date";

// Tek vardiya kartı: kişi (başlık) + saat aralığı + pozisyon.
// SADELEŞTİRME: kalın gölge + hover-yükselme kaldırıldı (kartlar "yüzmesin", sakin
// dursun); pozisyon rengi yalnız SOL ŞERİT'te (alt satırdaki tekrar renk noktası
// kaldırıldı — çift kodlama gürültüsü). Taslak durumu da tek kanaldan kodlanır:
// bg-cream/50 (metin rozeti kaldırıldı — rozet shrink-0'dı ve ismi sistematik
// kesiyordu, ayrıca arka planla çift kodlamaydı). Saat kendi satırında, pozisyon
// kendi satırında → dar sütunda kesişmezler. font-mono kaldırıldı (slashed zero
// istenmiyordu); tabular-nums kaldı → saatler hâlâ alt alta hizalı. Sol şerit tek
// kimlik kanalı, isim başlık → net hiyerarşi.
export default function ShiftCard({ shift }: { shift: ShiftDto }) {
  const color = shift.positionColor ?? "#7e7365"; // pozisyon rengi yoksa nötr sıcak gri
  const isDraft = shift.status === ShiftStatus.Draft;
  const isUnassigned = !shift.userId;

  return (
    <div
      className={`relative rounded-lg border border-l-[3px] px-2.5 py-2 text-sm transition-colors hover:bg-paper ${
        isDraft ? "border-line bg-cream/50" : "border-line bg-surface"
      }`}
      style={{ borderLeftColor: color }}
    >
      <span className={`block truncate font-medium leading-tight ${isUnassigned ? "italic text-faint" : "text-ink"}`}>
        {shift.userFullName ?? "Açık vardiya"}
      </span>

      <div className="mt-0.5 text-xs text-muted">
        <span className="tabular-nums tracking-tight">
          {formatTime(shift.startTime)}–{formatTime(shift.endTime)}
        </span>
      </div>
      <div className="truncate text-xs text-muted">{shift.positionName}</div>
    </div>
  );
}
