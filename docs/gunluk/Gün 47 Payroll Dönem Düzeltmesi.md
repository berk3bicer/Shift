# Gün 47 — Payroll Dönem Düzeltmesi (hardcoded `2026-06` → içinde bulunulan ay)

**Kapsam:** Bordro/rapor ekranlarındaki sabit `"2026-06"` dönemini "içinde bulunulan ay"a
çevirmek. Canlıda pilot kafe Temmuz'da açılıp Haziran verisi görürse yanlış mesai/bordro
sunulur — deploy öncesi kapatılması gereken bir demo kalıntısıydı. SAF frontend turu
(`web/`), backend'e sıfır dokunuş — backend dönemi zaten query/body'den (`from`/`to`) alıyor,
hardcode hiç backend'de değildi. Branch: `feat/payroll-donem-duzeltme` (main `b0c8bce` üzerine).
3 dosya, `npm run build` temiz, canlı doğrulama PASS.

> **Danışman notu:** Bu turun dersi kodun kendisi değil, *aynı görünen üç yerin üç farklı
> çözüm istemesi*. "Sabit tarihi dinamik yap" tek cümle; ama biri client state başlangıcı,
> biri server component'te hesap, biri prop'tan türetilen başlık. Nerede olduğun, ne
> yazacağını belirler.

---

## 1. Üç yer, üç farklı çözüm — neden?

| Yer | Dosya | Ne idi | Ne oldu |
|---|---|---|---|
| 1 | `web/components/payroll/PayrollBoard.tsx` (client) | `useState("2026-06")` | Lazy initializer ile bu ay |
| 2 | `web/app/(app)/reports/page.tsx` (server) | `from="2026-06-01"`, `to="2026-06-30"` | Render anında bu ayın ilk/son günü |
| 3 | `web/components/reports/OvertimeSummaryBoard.tsx` (başlık) | Sabit "Haziran 2026" metni | `periodStart` prop'undan türetilen `periodTitle` |

### Yer 1 — client component: sorun sadece BAŞLANGIÇ değeriydi

PayrollBoard'da ay seçici (`<input type="month">`) **zaten vardı** — kullanıcı ayı
değiştirebiliyordu. Tek kusur `useState`'in sabit `"2026-06"` ile başlaması: kafe Temmuz'da
paneli açınca ekran Haziran'da açılıyordu. Düzeltme başlangıç değerini dinamikleştirmek:

```tsx
const [selectedMonth, setSelectedMonth] = useState<string>(() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
});
```

**Kavram — lazy useState initializer:** `useState(hesap())` yazarsan `hesap()` **her
render'da** çalışır (React sonucu ilk render dışında çöpe atar ama hesap yine de yapılır).
`useState(() => hesap())` yazarsan fonksiyon yalnız **ilk mount'ta** çağrılır. Burada maliyet
ufak (bir `Date` + string) — yani kazanç kozmetik — ama desen doğru refleks: initializer'ın
pahalı olduğu gün (JSON parse, localStorage okuma) bu fark gerçek performans sorunu olur.

**İnce nokta — yerel saat bilinçli tercih:** `getFullYear()/getMonth()` kullanıcının yerel
saatiyle çalışır. "İçinde bulunulan ay" kullanıcının takvimindeki aydır; UTC kullansaydık ay
sınırında (31 Tem 23:30'da UTC 1 Ağu olabilir) kullanıcıya "yanlış" ay açılırdı.

### Yer 2 — server component: state YOK, seçici EKLENEMEZ

`reports/page.tsx` bir **server component**: `async function`, `useState`/`onChange` yok,
HTML sunucuda üretilir. Buraya `<input type="month">` koymak mümkün değil — interaktivite
client component ister. İki seçenek vardı (aşağıda §2); karar gereği seçici eklemeden dönemi
render anında hesapladık:

```tsx
const now = new Date();
const y = now.getFullYear();
const m = now.getMonth(); // 0-indexed
const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const from = `${y}-${pad(m + 1)}-01`;
const to = `${y}-${pad(m + 1)}-${pad(lastDay)}`;
```

**Kavram — ayın son günü hilesi:** `new Date(Date.UTC(y, m + 1, 0))` "bir sonraki ayın
0'ıncı günü" = bu ayın son günü. Şubat/artık yıl dahil tüm ayları doğru verir; elle 28/30/31
tablosu tutmaktan iyidir. PayrollBoard içindeki mevcut hesapla (satır ~33) bilerek AYNI desen
kullanıldı — iki yerde iki farklı "son gün" algoritması bakım tuzağıdır.

**İnce nokta — burada `Date.UTC` neden sorun değil:** yıl+ay zaten yerel saatten alındı;
`Date.UTC(y, m+1, 0)` yalnız "o ayın kaç çektiğini" soruyor — gün sayısı saat diliminden
bağımsız. Yani sınır hesabı UTC ile, "hangi ay" kararı yerel ile: ikisi karışmıyor.

> [!question] Mülakat Sorusu 1 — **"Client ve server component'te 'bugünün tarihi' almak
> neden farklı davranır?"**
> Cevap: Client component'te `new Date()` kullanıcının tarayıcısında, onun saat diliminde
> çalışır. Server component'te sunucunun saatinde ve *istek anında* çalışır — kullanıcı
> Sydney'deyken sunucu Frankfurt'taysa "bugün" farklı olabilir. Ayrıca statik prerender
> edilen bir sayfada `new Date()` *build anına* donar. Bizim reports sayfası dinamik
> (ƒ, auth cookie okuyor) olduğu için her istekte yeniden hesaplanıyor; saat dilimi farkı
> da ay ortasında önemsiz, yalnız ay sınırındaki birkaç saatte görülebilir — pilot için
> kabul edilmiş bir yuvarlama.

### Yer 3 — başlık: yeni kaynak DEĞİL, mevcut prop'tan türet

`OvertimeSummaryBoard` başlığında sabit "Haziran 2026" yazıyordu. Bileşen zaten
`periodStart`/`periodEnd` prop'larını alıyor ve tablo hücrelerinde kullanıyordu; başlık bu
kaynaktan kopmuştu. Düzeltme yeni prop ya da yeni `Date` hesabı değil, mevcut prop'tan türetme:

```tsx
const periodTitle = new Date(periodStart).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
// → "Temmuz 2026"
```

**Kavram — tek kaynak (single source of truth):** dönem bilgisi sayfadan prop olarak
geliyorsa başlık da oradan okumalı. Yer 2 yarın hangi ayı gönderirse başlık otomatik onu
gösterir; iki ayrı "bu hangi ay" hesabı birbirinden kopamaz.

## 2. Karar — Seçenek A: reports'a seçici EKLEMEDİK

- **Seçenek A (seçilen):** reports içinde bulunulan aya sabit; seçici yok. Server component
  korunur, dokunuş minimal, "yanlış ay gösterme" problemi çözülür.
- **Seçenek B (reddedilen):** reports'a da ay seçici. Server component'i client wrapper'a
  çevirmek + summary çağrılarını client'a taşımak gerekir (şu an server'da `Promise.all`
  ile N+1). Mimari değişiklik — scope şişer, deploy gecikir.

Gerekçe: asıl **işlemsel** ekran PayrollBoard (dönem KAPATMA orada) ve orada seçici zaten
var — geçmiş aya oradan gidilebiliyor. Reports salt-okunur özet; bugünün ayını doğru
göstermesi deploy için kâfi. Geçmiş-ay rapor seçicisi Faz 2 analitik turuna yazıldı.

> [!question] Mülakat Sorusu 2 — **"Server component'e interaktif filtre eklemen gerekse
> nasıl yapardın?"**
> Cevap: İki yol. (1) *URL-state:* seçiciyi küçük bir client component yap, seçim
> `router.push("?month=2026-06")` ile searchParams'a yazsın; server component `searchParams`
> prop'undan okuyup veriyi sunucuda çekmeye devam etsin — server'ın veri çekme avantajı
> korunur, state URL'de olduğu için paylaşılabilir/yenilenebilir. (2) *Client'a indirme:*
> tüm sayfayı client yapıp veriyi `useEffect`/SWR ile çek — daha kolay ama N+1 çağrı
> tarayıcıya taşınır, ilk boya yavaşlar. Doğrusu genelde (1); biz bu turda ikisini de
> yapmadık çünkü scope kararı (Seçenek A) filtreyi Faz 2'ye itti.

## 3. Canlı doğrulama (panel + gerçek backend)

- `npm run build` (web/) temiz — TypeScript hatası yok.
- **Bordro** (`/payroll`): ekran **Temmuz 2026** ile açılıyor (`input value="2026-07"`);
  Temmuz'da kayıt yok → tüm satırlar "Hesaplanmadı" (doğru — kafe yeni ayda). Seçici
  Haziran'a çevrilince Haziran'ın kilitli kayıtları geliyor (Burak Çelik 45s+7s ₺7.215,
  "Kilitli") → **seçici çalışıyor, veri döneme göre değişiyor**.
- **Raporlar** (`/reports`): başlık "Personel Mesai Raporu (**Temmuz 2026**)", satır
  dönemleri "1 Tem – 31 Tem". Konsolda hata yok.
- `git diff` yalnız `web/` altında — backend'e dokunulmadı.

## 4. Açık borç

- **#reports-ay-secici:** reports ekranı geçmiş ay seçemiyor (Seçenek A gereği bu aya
  sabit). Faz 2 analitik turunda ay seçici + server/client mimari kararı (URL-state
  önerisi yukarıda) ile ele alınacak.
