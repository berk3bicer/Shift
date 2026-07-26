// Shiftle wordmark — Switzer-Extrabold "Shiftle" OUTLINE path'e donduruldu (fonta bağımsız).
//
// Neden: (a) her cihazda birebir aynı görünür (Switzer FOUT/eksikliği etkilemez),
// (b) link önizleme görseli (OG, gen-icons.mjs) aynı path'ten beslenir → site ve paylaşım
// kartı tutarlı, (c) `web/` de outline'a geçince Switzer tümden silinebilir (ayrı tur).
//
// Path'ler Switzer-Extrabold.woff2'den fonttools ile çıkarıldı: "Shiftle" tek kesintisiz
// akış (advance toplamı 3062em, kerning fontun kendi metriğinde pişmiş — elle <span>'a bölünmedi,
// o "Sh|ftle" boşluğu açardı). i-noktası (tittle) ayrı kontur olarak izole edilip amber boyandı.
//
// viewBox yüksekliği tam 1em (1000 upm) → `height:1em` cap-height'ı 0.694em render eder,
// yani eski `text-xl` span'iyle birebir aynı boyut. Gövde `currentColor` (className'deki
// text-ink / text-white'ı miras alır — Nav açık zemin, Footer koyu bant); nokta sabit amber.
//
// Kaynak/yeniden üretim: marketing/scripts/extract-wordmark not — path'ler statiktir, Switzer
// değişmedikçe yeniden çıkarmaya gerek yok.
const BODY_D =
  "M219 -503C219 -536 250 -557 296 -557C355 -557 389 -528 400 -468H595C575 -629 448 -698 304 -698C130 -698 32 -604 32 -484C32 -218 427 -321 427 -186C427 -147 395 -123 333 -123C269 -123 225 -157 215 -219H23C45 -59 166 18 331 18C494 18 614 -66 614 -209C614 -486 219 -372 219 -503Z M684 0H857V-308C857 -375 892 -419 945 -419C993 -419 1018 -390 1018 -325V0H1192V-360C1192 -497 1112 -559 1011 -559C946 -559 892 -530 857 -468V-720H684Z M1283 0H1456V-541H1283Z M1507 -409H1570V0H1743V-409H1833V-541H1743C1743 -586 1757 -614 1821 -614H1833V-721C1817 -729 1785 -738 1740 -738C1634 -738 1571 -670 1570 -541H1507Z M1905 -182C1905 -53 1964 18 2084 18C2130 18 2167 10 2186 1V-130H2154C2091 -130 2079 -158 2079 -207V-409H2187V-541H2079V-666H1905V-541H1843V-409H1905Z M2252 0H2425V-720H2252Z M3040 -178H2858C2843 -137 2816 -119 2772 -119C2716 -119 2682 -159 2674 -234H3036V-272C3036 -450 2932 -559 2766 -559C2603 -559 2495 -454 2495 -270C2495 -92 2602 18 2772 18C2909 18 3012 -54 3040 -178Z M2766 -422C2814 -422 2845 -390 2856 -329H2677C2688 -390 2718 -422 2766 -422Z";
const DOT_D = "M1283 -588H1456V-720H1283Z";

export default function Wordmark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 -860 3062 1000"
      role="img"
      aria-label="Shiftle"
      fill="currentColor"
      className={className}
      style={{ height: "1em", width: "auto", display: "inline-block" }}
    >
      <path d={BODY_D} />
      <path d={DOT_D} fill="#f59e0b" />
    </svg>
  );
}
