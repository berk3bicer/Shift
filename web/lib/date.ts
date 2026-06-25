// Tarih yardımcıları. Backend saatleri "duvar saati" gibi saklıyor (UTC bileşeni =
// gösterilecek saat). TZ yorumundan kaçınmak için saat/tarih kısımlarını ISO string'den
// DOĞRUDAN okuyoruz — yerel saat dilimi grid'i kaydırmasın.

const DAY_NAMES_TR = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

// yyyy-mm-dd (UTC tabanlı).
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Verilen tarihin içinde bulunduğu haftanın PAZARTESİ'si (yyyy-mm-dd). Backend de
// haftayı Pazartesi'den başlatıyor (GetWeekStart).
export function mondayOf(d: Date): string {
  const day = d.getUTCDay(); // 0=Paz..6=Cmt
  const sinceMonday = (day + 6) % 7;
  const monday = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - sinceMonday),
  );
  return isoDate(monday);
}

export function addDaysIso(dateIso: string, n: number): string {
  const [y, m, d] = dateIso.split("-").map(Number);
  return isoDate(new Date(Date.UTC(y, m - 1, d + n)));
}

// Haftalık çekim aralığı: [Pazartesi 00:00, ertesi Pazartesi 00:00). Backend bu pencereyle
// kesişen vardiyaları döndürür.
export function rangeForWeek(weekStartIso: string) {
  return {
    startIso: `${weekStartIso}T00:00:00.000Z`,
    endIso: `${addDaysIso(weekStartIso, 7)}T00:00:00.000Z`,
  };
}

// Haftanın 7 günü (Pzt..Paz) için { iso, label } üretir.
export function weekDays(weekStartIso: string) {
  return Array.from({ length: 7 }, (_, i) => {
    const iso = addDaysIso(weekStartIso, i);
    const dayNum = iso.slice(8, 10);
    const monthNum = iso.slice(5, 7);
    return { iso, name: DAY_NAMES_TR[i], label: `${dayNum}.${monthNum}` };
  });
}

// ISO'dan duvar-saati HH:mm (TZ yorumsuz, string'den).
export function formatTime(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : iso;
}

// Vardiyanın düştüğü gün (yyyy-mm-dd) — startTime'ın tarih kısmı.
export function shiftDay(iso: string): string {
  return iso.slice(0, 10);
}
