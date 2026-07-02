"use client";

import { useState } from "react";

// Kapanış CTA — spec 12.2: "sıcak pilot" (soğuk satış değil). İlk 3-5 tanıdık kafede
// ücretsiz pilot + haftalık geri bildirim.
//
// Backend YOK (bu tur kapsamı): gerçek lead-capture ucu ayrı tur → gap. Sahte endpoint
// UYDURULMAZ. Bunun yerine form, girilen bilgiyle önceden doldurulmuş bir mailto: üretir —
// gerçekten kullanıcının e-posta istemcisine devreder, uydurma bir POST'a değil.
// merhaba@shift.app = PLACEHOLDER iletişim adresi (gerçek adres/domain Tur 3 → gap).
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

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true); // teşekkürler state; iletim mailto ile (aşağıdaki buton) yapılır
  }

  return (
    <section id="pilot" className="bg-[var(--color-paper)] py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-5 sm:px-8">
        <div className="overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)]">
          <div className="grid gap-0 md:grid-cols-[1fr_1.1fr]">
            {/* Sol: metin */}
            <div className="flex flex-col justify-center bg-[var(--color-ink)] p-8 sm:p-10">
              <span className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-signal)]">
                Ücretsiz pilot
              </span>
              <h2 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:text-3xl">
                Tanıdık kafelerle sıcak başlıyoruz.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-white/60">
                İlk kafelerde ücretsiz pilot ve haftalık geri bildirim toplantısı. Kurulum 10 dakika,
                kredi kartı yok. Ekibini bir haftada dijitale taşı.
              </p>
            </div>

            {/* Sağ: form / teşekkürler */}
            <div className="p-8 sm:p-10">
              {sent ? (
                <div className="flex h-full flex-col justify-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-barista)]/15 text-[var(--color-barista)]">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.3 3.3 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold">Neredeyse tamam!</h3>
                  <p className="mt-2 text-sm text-[var(--color-muted)]">
                    Son bir adım: aşağıdaki butonla önceden doldurulmuş e-postayı bize gönder.
                    Pilot için 1 iş günü içinde dönüş yapıyoruz.
                  </p>
                  <a
                    href={buildMailto()}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-[var(--color-signal)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-signal-deep)]"
                  >
                    E-postayı gönder
                  </a>
                  <button
                    type="button"
                    onClick={() => setSent(false)}
                    className="mt-3 text-left text-sm font-medium text-[var(--color-muted)] underline-offset-4 hover:underline"
                  >
                    Bilgileri düzenle
                  </button>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <Field id="pilot-name" label="Ad soyad" value={name} onChange={setName} required placeholder="Berke Biçer" />
                  <Field id="pilot-cafe" label="İşletme adı" value={cafe} onChange={setCafe} required placeholder="Berke Kahve" />
                  <Field id="pilot-email" label="E-posta" value={email} onChange={setEmail} required type="email" placeholder="ornek@kafe.com" />
                  <Field id="pilot-phone" label="Telefon (opsiyonel)" value={phone} onChange={setPhone} type="tel" placeholder="05xx xxx xx xx" />
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[var(--color-ink)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-ink-soft)]"
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
      <label htmlFor={id} className="text-sm font-medium text-[var(--color-ink)]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-signal)] placeholder:text-[var(--color-muted)]/60"
      />
    </div>
  );
}
