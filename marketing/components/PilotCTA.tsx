"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import Photo from "./Photo";

// Kapanış CTA — sayfanın TEK koyu vurgu bandı (spec 12.2: "sıcak pilot", soğuk satış değil).
// Koyu ama SICAK: warm-ink zemin + amber ışıma + gerçek barista fotoğrafı (insan sıcaklığı).
// Backend YOK: sahte endpoint UYDURULMAZ. Form, girilen bilgiyle önceden doldurulmuş bir
// mailto: üretir → kullanıcının e-posta istemcisine gerçekten devreder.
// merhaba@shift.app = PLACEHOLDER iletişim adresi (gerçek domain → gap #P3).
const CONTACT_EMAIL = "merhaba@shift.app";

export default function PilotCTA() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [cafe, setCafe] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function buildMailto() {
    const subject = encodeURIComponent(`Ücretsiz pilot talebi — ${cafe || "Kafe"}`);
    const body = encodeURIComponent(
      `Merhaba,\n\nShift ücretsiz pilotuna katılmak istiyorum.\n\n` +
        `Ad Soyad: ${name}\nİşletme: ${cafe}\nE-posta: ${email}\nTelefon: ${phone || "—"}\n`,
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  }

  return (
    <section id="pilot" className="relative overflow-hidden bg-[var(--color-ink)] py-20 sm:py-28">
      {/* Yumuşak amber ışıma — sıcak derinlik */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 left-1/2 h-96 w-[40rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-signal), transparent 60%)" }}
      />
      <div className="relative mx-auto max-w-4xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--color-ink-line)] bg-[var(--color-ink-soft)] shadow-[var(--shadow-float)]">
          <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
            {/* Sol: fotoğraf + metin overlay */}
            <div className="relative flex min-h-[15rem] flex-col justify-end overflow-hidden p-8 sm:p-10">
              <Photo
                src="https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80&auto=format&fit=crop"
                alt="Bir baristanın filtre kahve demleyişi"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/80 to-[var(--color-ink)]/30" />
              <div className="relative">
                <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-soft)]">
                  Ücretsiz pilot
                </span>
                <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                  Tanıdık kafelerle sıcak başlıyoruz.
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-white/70">
                  İlk kafelerde ücretsiz pilot ve haftalık geri bildirim toplantısı. Kurulum 10 dakika,
                  kredi kartı yok. Ekibini bir haftada dijitale taşı.
                </p>
              </div>
            </div>

            {/* Sağ: form / teşekkürler */}
            <div className="bg-[var(--color-ink-soft)] p-8 sm:p-10">
              {sent ? (
                <div className="flex h-full flex-col justify-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-barista)]/15 text-[var(--color-barista)]">
                    <CheckCircle2 size={24} />
                  </span>
                  <h3 className="font-display mt-4 text-xl font-bold text-white">Neredeyse tamam!</h3>
                  <p className="mt-2 text-sm text-white/60">
                    Son bir adım: aşağıdaki butonla önceden doldurulmuş e-postayı bize gönder. Pilot için
                    1 iş günü içinde dönüş yapıyoruz.
                  </p>
                  <a
                    href={buildMailto()}
                    className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-signal)] px-5 py-3 text-sm font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
                  >
                    <Send size={16} /> E-postayı gönder
                  </a>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-3 text-left text-sm font-medium text-white/50 underline-offset-4 hover:text-white/80 hover:underline"
                  >
                    Bilgileri düzenle
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                  className="space-y-4"
                >
                  <Field id="pilot-name" label="Ad soyad" value={name} onChange={setName} required placeholder="Berke Biçer" />
                  <Field id="pilot-cafe" label="İşletme adı" value={cafe} onChange={setCafe} required placeholder="Berke Kahve" />
                  <Field id="pilot-email" label="E-posta" value={email} onChange={setEmail} required type="email" placeholder="ornek@kafe.com" />
                  <Field id="pilot-phone" label="Telefon (opsiyonel)" value={phone} onChange={setPhone} type="tel" placeholder="05xx xxx xx xx" />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[var(--color-signal)] px-5 py-3 text-sm font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
                  >
                    Ücretsiz pilot iste
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-white/80">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[var(--color-signal)] placeholder:text-white/30"
      />
    </div>
  );
}
