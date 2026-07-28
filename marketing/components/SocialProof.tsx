import { Scale, ShieldCheck, MessagesSquare, Clock } from "lucide-react";
import { STATS } from "@/lib/content";
import Reveal, { RevealStagger, RevealItem, CountUp } from "./Reveal";

// Sosyal kanıt şeridi — hero'nun HEMEN altında, GÖRÜNÜR. Metin tabanlı (SAHTE logo YOK).
// Üstte uyum rozetleri (İş Kanunu · KVKK · Türkçe · 10 dk), altında spec istatistikleri.
// Tur "Sıcak Kahve": şerit ESPRESSO'ya çevrildi — sayfanın ilk koyu yüzeyi artık hero'nun
// hemen altında (ritim kırıcı; eskiden ilk koyu bölge sayfanın en dibindeydi).
// İkon renkleri koyu zemine göre YENİDEN seçildi: eski açık-zemin tonları (terra 3.03,
// sage-deep 2.29) espresso üstünde AA'yı geçmiyordu.
const TRUST_CHIPS = [
  { icon: Scale, label: "İş Kanunu uyumlu", color: "var(--color-signal-soft)" },
  { icon: ShieldCheck, label: "KVKK uyumlu", color: "var(--color-crema)" },
  { icon: MessagesSquare, label: "Türkçe destek", color: "var(--color-latte)" },
  { icon: Clock, label: "10 dakikada kurulum", color: "var(--color-komi)" },
];

export default function SocialProof() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--color-espresso-line)] bg-[var(--color-espresso)] py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-signal) 0%, var(--color-coffee) 45%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-center justify-center gap-x-3 gap-y-3 sm:gap-x-4">
          {TRUST_CHIPS.map(({ icon: Icon, label, color }) => (
            <span
              key={label}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-espresso-line)] bg-[var(--color-roast)] px-4 py-2 text-sm font-semibold text-[var(--color-foam)]"
            >
              <Icon size={16} style={{ color }} />
              {label}
            </span>
          ))}
        </Reveal>

        <RevealStagger className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <RevealItem key={s.label} className="text-center">
              <div className="font-display text-4xl font-extrabold text-[var(--color-signal)] sm:text-[2.75rem]">
                {s.to != null ? (
                  <CountUp to={s.to} prefix={s.prefix} suffix={s.suffix} />
                ) : (
                  s.text
                )}
              </div>
              <div className="mt-1.5 text-sm font-medium text-[var(--color-latte)]">{s.label}</div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
