import { ArrowRight, ShieldCheck, Clock } from "lucide-react";
import { REGISTER_URL } from "@/lib/config";
import ShiftGrid from "./ShiftGrid";
import Photo from "./Photo";

// Hero — AYDINLIK/SICAK, havadar SPLIT (7shifts hissi). Sol: başlık + açıklama + 2 CTA + güven.
// Sağ: gerçek kafe çalışanı fotoğrafı (sıcaklık kaynağı) + üstüne bindirilmiş CANLI vardiya kartı.
// Zemin beyaz/krem, koyu DEĞİL.
// Giriş animasyonu SAF CSS keyframe (.anim-rise/.anim-float) — arka plan sekmede bile görünür.
export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-[var(--color-paper)]">
      {/* Zemin: yumuşak sıcak ışımalar (amber + şeftali) — aydınlık derinlik, kapkara değil */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 right-[-10%] h-[32rem] w-[32rem] rounded-full opacity-60 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-warm-soft), transparent 65%)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-15%] top-40 h-[28rem] w-[28rem] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-cream), transparent 60%)" }}
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-24 pt-28 sm:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-10 lg:pb-32 lg:pt-36">
        {/* Sol: metin */}
        <div>
          <span
            className="anim-rise inline-flex items-center gap-2 rounded-full border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] shadow-sm"
            style={{ animationDelay: "40ms" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-barista)]" />
            Kafe ve restoranlar için hepsi-bir-arada operasyon platformu
          </span>

          <h1
            className="anim-rise font-display mt-5 text-[2.6rem] font-extrabold leading-[1.05] text-[var(--color-ink)] sm:text-5xl lg:text-[3.6rem]"
            style={{ animationDelay: "120ms" }}
          >
            Kafenin bütün operasyonu{" "}
            <span className="relative whitespace-nowrap text-[var(--color-signal-deep)]">
              tek ekranda
              <svg
                className="absolute -bottom-1.5 left-0 w-full"
                viewBox="0 0 200 8"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M1 5.5C50 2 150 2 199 5.5" stroke="var(--color-signal)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </span>
            .
          </h1>

          <p
            className="anim-rise mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-muted)]"
            style={{ animationDelay: "200ms" }}
          >
            Vardiya WhatsApp&apos;ta, hijyen kağıtta, mesai hesap makinesinde dönmesin. Planlamadan
            giriş-çıkışa, görevlerden duyurulara — ekibini yönetmek için ihtiyacın olan her şey tek
            platformda. 10 dakikada kur, bugün kullanmaya başla.
          </p>

          <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "280ms" }}>
            <a
              href={REGISTER_URL}
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-signal)] px-6 py-3.5 text-base font-bold text-[var(--color-ink)] shadow-[var(--shadow-cta)] transition-all hover:-translate-y-0.5 hover:bg-[var(--color-signal-deep)] hover:text-white"
            >
              Ücretsiz Başla
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#pilot"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-6 py-3.5 text-base font-semibold text-[var(--color-ink)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--color-signal)]"
            >
              Ücretsiz pilot iste
            </a>
          </div>

          <div className="anim-rise mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-[var(--color-muted)]" style={{ animationDelay: "360ms" }}>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-[var(--color-barista)]" /> İş Kanunu &amp; KVKK uyumlu
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={16} className="text-[var(--color-signal-deep)]" /> 10 dakikada kurulum
            </span>
          </div>
        </div>

        {/* Sağ: kafe çalışanı fotoğrafı + bindirilmiş canlı çizelge kartı */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none lg:pl-4">
          <div className="relative pb-16 lg:pb-10">
            {/* Fotoğraf çerçevesi */}
            <div className="anim-float overflow-hidden rounded-[1.75rem] border border-[var(--color-line)] bg-[var(--color-cream)] shadow-[var(--shadow-float)]" style={{ animationDelay: "140ms" }}>
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
