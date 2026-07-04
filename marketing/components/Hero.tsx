import { ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { REGISTER_URL } from "@/lib/config";
import ScriptWord from "./ScriptWord";
import ShiftGrid from "./ShiftGrid";
import Photo from "./Photo";

// Hero — Tur 8: premium sıcak editöryel. Sol: büyük başlık + "tek ekranda" EL YAZISI vurgu
// (Caveat) + elde çizilmiş squiggle altçizgi; sağ: kafe fotoğrafı + canlı çizelge kartı +
// küçük el yazısı kenar notu (ok işaretli). Cömert boşluk, organik blob zeminler.
// Giriş animasyonu SAF CSS keyframe (.anim-rise/.anim-float + .scribble-css) — arka plan
// sekmede bile görünür (Gün 34 dersi); framer mount-animate above-fold'da KULLANILMAZ.
export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[var(--color-paper)]">
      {/* Zemin: yumuşak organik ışımalar — amber + şeftali + hafif adaçayı (Tur 8 ara tonu) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[34rem] w-[34rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-15%] top-40 h-[30rem] w-[30rem] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-cream), transparent 60%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-12rem] left-1/3 h-[26rem] w-[26rem] rounded-full opacity-35 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-sage-soft), transparent 60%)" }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-16 px-5 pb-28 pt-32 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-12 lg:pb-36 lg:pt-40">
        {/* Sol: metin */}
        <div>
          <span
            className="anim-rise inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] shadow-sm"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />
            Kafe ve restoranlar için hepsi-bir-arada operasyon platformu
          </span>

          <h1
            className="anim-rise font-display mt-6 text-[2.7rem] font-extrabold leading-[1.06] text-[var(--color-ink)] sm:text-5xl lg:text-[3.8rem]"
            style={{ animationDelay: "120ms" }}
          >
            Kafenin bütün operasyonu <ScriptWord delay="0.7s">tek ekranda</ScriptWord>.
          </h1>

          <p
            className="anim-rise mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]"
            style={{ animationDelay: "200ms" }}
          >
            Vardiya WhatsApp&apos;ta, hijyen kağıtta, mesai hesap makinesinde dönmesin. Planlamadan
            giriş-çıkışa, görevlerden duyurulara — ekibini yönetmek için ihtiyacın olan her şey tek
            platformda. 10 dakikada kur, bugün kullanmaya başla.
          </p>

          <div className="anim-rise mt-9 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "280ms" }}>
            <a
              href={REGISTER_URL}
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-signal)] px-7 py-3.5 text-base font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
            >
              Ücretsiz Başla
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#pilot"
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-7 py-3.5 text-base font-semibold text-[var(--color-ink)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--color-signal)]"
            >
              Ücretsiz pilot iste
            </a>
          </div>

          <div className="anim-rise mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[var(--color-muted)]" style={{ animationDelay: "360ms" }}>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[var(--color-sage)]" /> İş Kanunu &amp; KVKK uyumlu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={16} className="text-[var(--color-signal-deep)]" /> 10 dakikada kurulum
            </span>
          </div>
        </div>

        {/* Sağ: kafe çalışanı fotoğrafı + bindirilmiş canlı çizelge kartı + el yazısı not */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-4">
          <div className="relative pb-16 lg:pb-10">
            {/* El yazısı kenar notu + ok — çizelge kartını işaret eder (insan eli dokunuşu).
                Above-fold: saf CSS çizim, framer değil. */}
            <div
              className="anim-rise absolute -top-9 right-1 z-10 flex items-start gap-1.5 lg:-top-7 lg:right-4"
              style={{ animationDelay: "600ms" }}
            >
              <span className="font-script -rotate-3 text-xl text-[var(--color-terra)] sm:text-2xl">
                haftanın çizelgesi, hazır
              </span>
              <svg
                className="scribble-css mt-4 h-9 w-11 -scale-x-100"
                viewBox="0 0 90 70"
                fill="none"
                aria-hidden="true"
                style={{ animationDelay: "1.1s" } as React.CSSProperties}
              >
                <path d="M8 6C30 10 62 22 72 52M58 44L73 56L79 38" pathLength={1} stroke="var(--color-terra)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Fotoğraf çerçevesi — cömert organik radius */}
            <div className="anim-float overflow-hidden rounded-[2.25rem] border border-[var(--color-line)] bg-[var(--color-cream)] shadow-[var(--shadow-float)]" style={{ animationDelay: "140ms" }}>
              <Photo
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=900&q=80&auto=format&fit=crop"
                alt="Kafede gülümseyerek müşteriye hizmet veren bir çalışan"
                eager
                className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/5]"
              />
            </div>

            {/* Bindirilmiş çizelge kartı — mobilde fotoğrafın altına taşar, lg'de sağa çıkar */}
            <ShiftGrid className="absolute bottom-0 left-1/2 w-[92%] -translate-x-1/2 sm:w-[78%] lg:-left-6 lg:w-[80%] lg:translate-x-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
