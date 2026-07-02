import { LOGIN_URL, REGISTER_URL } from "@/lib/config";

// Footer — koyu ink. KVKK/gizlilik linkleri PLACEHOLDER (gerçek metin ayrı tur → gap).
export default function Footer() {
  return (
    <footer className="bg-[var(--color-ink)] pb-10 pt-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 border-b border-white/10 pb-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xs">
            <span className="font-display text-xl font-bold text-white">Shift</span>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Kafe ve restoran operasyonunu tek platformda dijitalleştir. Türkçe, İş Kanunu ve KVKK uyumlu.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm sm:grid-cols-3">
            <FooterCol title="Ürün" links={[["Modüller", "#moduller"], ["Neden Shift", "#neden"], ["Fiyatlar", "#fiyat"]]} />
            <FooterCol title="Başla" links={[["Ücretsiz başla", REGISTER_URL], ["Giriş Yap", LOGIN_URL], ["Pilot iste", "#pilot"]]} />
            <FooterCol title="Yasal" links={[["KVKK Aydınlatma", "#"], ["Gizlilik", "#"], ["İletişim", "mailto:merhaba@shift.app"]]} />
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-white/40">© {new Date().getFullYear()} Shift · Restoran ve kafe operasyonu</p>
          <p className="font-mono text-xs text-white/30">Verileriniz Avrupa / Türkiye veri merkezinde</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h3 className="font-mono text-xs uppercase tracking-wider text-white/40">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <a href={href} className="text-white/60 transition-colors hover:text-white">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
