import Link from "next/link";
import { LOGIN_URL, REGISTER_URL } from "@/lib/config";
import ShiftleMark from "@/components/ShiftleMark";
import Wordmark from "@/components/Wordmark";

// Footer — sayfanın kapanış koyu bölgesi (CTA ile birlikte alttaki tek koyu bant). Çok kolonlu
// (Ürün / Başla / Yasal). KVKK/Gizlilik → /kvkk (Tur 16, gap #P2 kapandı). Mono KALDIRILDI.
export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[var(--color-ink)] pb-10 pt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-10 border-b border-white/10 pb-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <ShiftleMark className="h-8 w-8" variant="onDark" />
              <Wordmark className="text-xl text-white" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Kafe ve restoran operasyonunu tek platformda dijitalleştir. Türkçe, İş Kanunu ve KVKK uyumlu.
            </p>
          </div>

          <FooterCol title="Ürün" links={[["Tüm modüller", "/moduller"], ["Vardiya & Planlama", "/moduller/vardiya"], ["Giriş-Çıkış & Mesai", "/moduller/giris-cikis"], ["Fiyatlar", "/fiyatlar"], ["Neden Shiftle", "/neden-shift"]]} />
          <FooterCol title="Kaynaklar" links={[["Kafe Operasyon Rehberi", "/kaynaklar/kafe-rehberi"], ["Ücretsiz başla", REGISTER_URL]]} />
          {/* "Gizlilik" şimdilik /kvkk'e gider — ayrı gizlilik politikası Faz 2 (gap #gizlilik-ayri-sayfa). */}
          <FooterCol title="Yasal" links={[["KVKK Aydınlatma", "/kvkk"], ["Gizlilik", "/kvkk"], ["Giriş Yap", LOGIN_URL]]} />
        </div>

        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            Shiftle — Kafe ve restoran operasyonunu dijitalleştir. © {new Date().getFullYear()}
          </p>
          <p className="text-xs text-white/30">Verileriniz Avrupa / Türkiye veri merkezinde</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            {href.startsWith("/") ? (
              <Link href={href} className="text-sm text-white/60 transition-colors hover:text-white">
                {label}
              </Link>
            ) : (
              <a href={href} className="text-sm text-white/60 transition-colors hover:text-white">
                {label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
