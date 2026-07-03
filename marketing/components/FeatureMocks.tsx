import { Camera, Check, QrCode, ArrowRight, ShieldCheck, Thermometer, TriangleAlert, User } from "lucide-react";
import type { ReactNode } from "react";

// Zikzak showcase ürün mockup'ları — hero'daki ShiftGrid gibi GERÇEK DOM (stok foto/screenshot
// DEĞİL). Sıcak beyaz kart + pastel roller paleti; UI-mavisi/generic görünüm bilinçli yok.
// Hepsi dekoratif ürün temsili: kök role="img" + aria-label, içerik aria-hidden.

const ROLE_VAR = {
  barista: "var(--color-barista)",
  kasiyer: "var(--color-kasiyer)",
  komi: "var(--color-komi)",
} as const;

function Frame({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-float)] sm:p-5 ${className}`}
    >
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function CardHeader({ title, badge, badgeColor = "var(--color-barista)" }: { title: string; badge: string; badgeColor?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--color-signal)]" />
        <span className="font-display text-sm font-bold text-[var(--color-ink)]">{title}</span>
      </div>
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: `color-mix(in srgb, ${badgeColor} 12%, white)`, color: badgeColor }}
      >
        {badge}
      </span>
    </div>
  );
}

/* ── Görev Panosu: mini Kanban (Yapılacak / Devam / Tamam) — foto-kanıt ikonu dahil ── */
type KanbanCard = { text: string; role: keyof typeof ROLE_VAR; photo?: boolean; done?: boolean };
const KANBAN: { column: string; cards: KanbanCard[] }[] = [
  {
    column: "Yapılacak",
    cards: [
      { text: "Vitrin buzdolabı ısı kontrolü", role: "komi" },
      { text: "86 badem sütü — stok say", role: "barista" },
    ],
  },
  {
    column: "Devam",
    cards: [{ text: "Espresso makinesi backflush", role: "barista", photo: true }],
  },
  {
    column: "Tamam",
    cards: [
      { text: "Açılış checklist'i", role: "kasiyer", done: true },
      { text: "Teras masaları hazır", role: "komi", done: true, photo: true },
    ],
  },
];

export function KanbanMock({ className = "" }: { className?: string }) {
  return (
    <Frame
      label="Görev panosu örneği: açılış görevleri Yapılacak, Devam ve Tamam sütunlarında; bir görevde fotoğraf kanıtı işareti."
      className={className}
    >
      <CardHeader title="Görevler · Açılış" badge="2/5 tamam" />
      <div className="grid grid-cols-3 gap-2">
        {KANBAN.map((col) => (
          <div key={col.column} className="rounded-xl bg-[var(--color-paper)] p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-muted)]">{col.column}</span>
              <span className="rounded-full bg-[var(--color-line)] px-1.5 text-[9px] font-semibold text-[var(--color-muted)]">
                {col.cards.length}
              </span>
            </div>
            <div className="space-y-2">
              {col.cards.map((c) => (
                <div
                  key={c.text}
                  className={`rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-sm ${c.done ? "opacity-75" : ""}`}
                >
                  <p className={`text-[10px] font-semibold leading-snug text-[var(--color-ink)] ${c.done ? "line-through decoration-[var(--color-muted)]/50" : ""}`}>
                    {c.text}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-6 rounded-full" style={{ backgroundColor: `color-mix(in srgb, ${ROLE_VAR[c.role]} 45%, white)` }} />
                    {c.photo && <Camera size={11} className="text-[var(--color-signal-deep)]" />}
                    {c.done && <Check size={11} strokeWidth={3} className="ml-auto text-[var(--color-barista)]" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/* ── Giriş-Çıkış & Mesai: QR/PIN kiosk + haftalık 45s mesai özeti ── */
const TIMESHEET = [
  { name: "Ayşe", role: "barista" as const, hours: 42, warn: true },
  { name: "Can", role: "kasiyer" as const, hours: 36 },
  { name: "Elif", role: "komi" as const, hours: 28 },
];

export function TimeclockMock({ className = "" }: { className?: string }) {
  return (
    <Frame
      label="Giriş-çıkış ve mesai örneği: QR/PIN kiosk ekranı ile haftalık mesai özeti; bir çalışan 45 saat limitine yaklaştığı için uyarı almış."
      className={className}
    >
      <div className="grid grid-cols-[auto_1fr] gap-3 sm:gap-4">
        {/* Kiosk paneli */}
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl bg-[var(--color-ink)] px-4 py-5">
          <QrCode size={44} className="text-[var(--color-signal-soft)]" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold text-white/90">QR okut ya da PIN gir</span>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 3 ? "bg-[var(--color-signal)]" : "bg-white/25"}`} />
            ))}
          </div>
          <span className="mt-1 rounded-full bg-[var(--color-barista)]/25 px-2 py-0.5 text-[9px] font-bold text-[#86efac]">
            Giriş · 08:02
          </span>
        </div>

        {/* Haftalık mesai özeti */}
        <div>
          <CardHeader title="Bu Hafta · Mesai" badge="Bordroya hazır" />
          <div className="space-y-2.5">
            {TIMESHEET.map((p) => (
              <div key={p.name}>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 font-semibold text-[var(--color-ink)]">
                    <User size={11} style={{ color: ROLE_VAR[p.role] }} />
                    {p.name}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-muted)]">
                    {p.hours}s / 45s
                    {p.warn && (
                      <TriangleAlert size={11} className="ml-1 inline text-[var(--color-signal-deep)]" />
                    )}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-paper-deep)]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(p.hours / 45) * 100}%`,
                      backgroundColor: p.warn ? "var(--color-signal)" : `color-mix(in srgb, ${ROLE_VAR[p.role]} 55%, white)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-line)] pt-2.5 text-[10px] font-medium text-[var(--color-muted)]">
            <TriangleAlert size={11} className="shrink-0 text-[var(--color-signal-deep)]" />
            Ayşe haftalık 45s limitine 3s kala — fazla mesai %50 zamlı hesaplanır.
          </p>
        </div>
      </div>
    </Frame>
  );
}

/* ── Vardiya Havuzu: sun → kap akışı + onay durumu ── */
export function PoolMock({ className = "" }: { className?: string }) {
  return (
    <Frame
      label="Vardiya havuzu örneği: Ayşe cumartesi vardiyasını havuza sunmuş, Mehmet kapmış ve yönetici onaylamış; ikinci bir vardiya onay bekliyor."
      className={className}
    >
      <CardHeader title="Vardiya Havuzu" badge="2 açık vardiya" badgeColor="var(--color-signal-deep)" />

      <div className="space-y-3">
        {/* Tamamlanan takas: sun → kap */}
        <div className="rounded-xl bg-[var(--color-paper)] p-3">
          <div className="flex items-center gap-2">
            <div
              className="flex-1 rounded-lg bg-[var(--color-surface)] p-2 shadow-sm"
              style={{ borderLeft: `3px solid ${ROLE_VAR.barista}` }}
            >
              <p className="text-[10px] font-bold text-[var(--color-ink)]">Cmt · 09–15 · Barista</p>
              <p className="text-[9px] text-[var(--color-muted)]">Ayşe havuza sundu</p>
            </div>
            <ArrowRight size={16} className="shrink-0 text-[var(--color-signal-deep)]" />
            <div
              className="flex-1 rounded-lg bg-[var(--color-surface)] p-2 shadow-sm"
              style={{ borderLeft: `3px solid ${ROLE_VAR.barista}` }}
            >
              <p className="text-[10px] font-bold text-[var(--color-ink)]">Mehmet kaptı</p>
              <p className="text-[9px] font-semibold text-[var(--color-barista)]">✓ Onaylandı</p>
            </div>
          </div>
        </div>

        {/* Bekleyen sunum */}
        <div className="flex items-center justify-between rounded-xl bg-[var(--color-paper)] p-3">
          <div
            className="rounded-lg bg-[var(--color-surface)] p-2 shadow-sm"
            style={{ borderLeft: `3px solid ${ROLE_VAR.kasiyer}` }}
          >
            <p className="text-[10px] font-bold text-[var(--color-ink)]">Paz · 12–19 · Kasiyer</p>
            <p className="text-[9px] text-[var(--color-muted)]">Zeynep havuza sundu</p>
          </div>
          <span className="rounded-full bg-[var(--color-signal)]/15 px-2 py-1 text-[9px] font-bold text-[var(--color-signal-deep)]">
            Onay bekliyor
          </span>
        </div>
      </div>

      <p className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-line)] pt-2.5 text-[10px] font-medium text-[var(--color-muted)]">
        <ShieldCheck size={11} className="shrink-0 text-[var(--color-barista)]" />
        İş Kanunu limitleri her takasta otomatik kontrol edilir.
      </p>
    </Frame>
  );
}

/* ── Stok & Tedarik (Faz 2 sayfası için): PAR uyarılı stok seviyeleri + sipariş çipi ── */
const STOCK = [
  { name: "Kahve çekirdeği", level: 68, unit: "12 kg" },
  { name: "Badem sütü", level: 18, unit: "3 L", low: true },
  { name: "Vanilya şurubu", level: 45, unit: "4 şişe" },
];

export function StockMock({ className = "" }: { className?: string }) {
  return (
    <Frame
      label="Stok takibi örneği: kahve çekirdeği ve şurup yeterli seviyede, badem sütü PAR seviyesinin altına düştüğü için sipariş uyarısı görünüyor."
      className={className}
    >
      <CardHeader title="Stok · Kritik Seviyeler" badge="1 PAR uyarısı" badgeColor="var(--color-signal-deep)" />
      <div className="space-y-2.5">
        {STOCK.map((s) => (
          <div key={s.name}>
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-[var(--color-ink)]">{s.name}</span>
              <span className="font-mono text-[10px] text-[var(--color-muted)]">
                {s.unit}
                {s.low && <TriangleAlert size={11} className="ml-1 inline text-[var(--color-signal-deep)]" />}
              </span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[var(--color-paper-deep)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${s.level}%`,
                  backgroundColor: s.low ? "var(--color-signal)" : "color-mix(in srgb, var(--color-barista) 55%, white)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-[var(--color-paper)] p-2.5">
        <div>
          <p className="text-[10px] font-bold text-[var(--color-ink)]">Badem sütü · PAR altında</p>
          <p className="text-[9px] text-[var(--color-muted)]">Süt Dünyası · Salı teslimat</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-[var(--color-signal)]/15 px-2 py-1 text-[9px] font-bold text-[var(--color-signal-deep)]">
          Sipariş oluştur <ArrowRight size={10} />
        </span>
      </div>
    </Frame>
  );
}

/* ── Hijyen & HACCP (Faz 3 sayfası için): günlük denetim checklist'i + sıcaklık kayıtları ── */
const HYGIENE = [
  { text: "Yüzey ve tezgah dezenfeksiyonu", done: true },
  { text: "El hijyeni istasyonu dolu", done: true },
  { text: "Çöp alanı kontrolü", done: false },
];

export function HygieneMock({ className = "" }: { className?: string }) {
  return (
    <Frame
      label="Hijyen denetimi örneği: günlük HACCP checklist'inde iki madde tamamlanmış, vitrin ve derin dondurucu sıcaklıkları normal aralıkta kaydedilmiş."
      className={className}
    >
      <CardHeader title="Hijyen · Günlük Denetim" badge="2/3 tamam" badgeColor="var(--color-kasiyer)" />
      <div className="space-y-2">
        {HYGIENE.map((h) => (
          <div
            key={h.text}
            className={`flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-2 shadow-sm ${h.done ? "opacity-75" : ""}`}
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                h.done ? "bg-[var(--color-barista)]/20 text-[var(--color-barista)]" : "border border-[var(--color-line-strong)]"
              }`}
            >
              {h.done && <Check size={10} strokeWidth={3} />}
            </span>
            <span className={`text-[10px] font-semibold text-[var(--color-ink)] ${h.done ? "line-through decoration-[var(--color-muted)]/50" : ""}`}>
              {h.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[
          { name: "Vitrin buzdolabı", temp: "+3,2°C" },
          { name: "Derin dondurucu", temp: "−18,5°C" },
        ].map((t) => (
          <div key={t.name} className="rounded-xl bg-[var(--color-paper)] p-2.5">
            <p className="flex items-center gap-1 text-[9px] font-semibold text-[var(--color-muted)]">
              <Thermometer size={10} className="text-[var(--color-kasiyer)]" /> {t.name}
            </p>
            <p className="mt-0.5 font-mono text-xs font-bold text-[var(--color-ink)]">
              {t.temp} <Check size={11} strokeWidth={3} className="inline text-[var(--color-barista)]" />
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 border-t border-[var(--color-line)] pt-2.5 text-[10px] font-medium text-[var(--color-muted)]">
        <ShieldCheck size={11} className="shrink-0 text-[var(--color-barista)]" />
        Denetim günü tüm kayıtlardan tek tıkla HACCP raporu.
      </p>
    </Frame>
  );
}
