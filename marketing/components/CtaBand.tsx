import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { REGISTER_URL } from "@/lib/config";
import Reveal from "./Reveal";

// Derin sayfa kapanış CTA bandı (Tur 7) — her modül/tema sayfasının altında tekrarlanır
// (dönüşüm). PilotCTA'nın form'lu büyük hali ANA SAYFADA kalır; bu kompakt bant "Ücretsiz
// Başla" (app register) + "Pilot iste" (ana sayfadaki forma) yönlendirir. Koyu-sıcak bant,
// sayfa başına tek koyu bölge ilkesi footer'la birleşerek korunur.
export default function CtaBand({
  title = "Kafeni Shift'le tanıştır.",
  sub = "10 dakikada kur, ilk vardiya programını bugün yayınla. Ücretsiz, taahhütsüz.",
}: {
  title?: string;
  sub?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[var(--color-ink)] py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-signal), transparent 60%)" }}
      />
      <Reveal className="relative mx-auto flex max-w-4xl flex-col items-center px-5 text-center sm:px-8">
        <span className="font-script -rotate-1 text-2xl text-[var(--color-signal-soft)]">hadi, birlikte kuralım</span>
        <h2 className="font-display mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">{title}</h2>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/65">{sub}</p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href={REGISTER_URL}
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-signal)] px-6 py-3 text-base font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
          >
            Ücretsiz Başla
            <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </a>
          <Link
            href="/#pilot"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-[var(--color-signal)]"
          >
            Ücretsiz pilot iste
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
