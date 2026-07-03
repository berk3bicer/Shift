// TÜM ürün/fiyat iddiaları docs/spec/Shift_Spesifikasyon.md'den birebir alınmıştır.
// Her bloğun üstünde kaynak bölüm işaretlidir. Pazarlama abartısı YOK — spec ne diyorsa o.

// Spec 1.3 — Temel Değer Önerisi tablosu (çekirdek satırlar; landing'de sadeleştirildi).
export const PROBLEM_SOLUTION = [
  { problem: "Vardiya planı dağınık", current: "Excel / kağıt vardiya", shift: "Sürükle-bırak çizelge" },
  { problem: "Görev takibi yok", current: "Sözlü görev dağıtımı", shift: "Kanban görev + foto kanıt" },
  { problem: "Ek mesai hesabı elle", current: "Hesap makinesiyle mesai", shift: "İş Kanunu'na göre otomatik mesai" },
  { problem: "Vardiya değişimi karmaşası", current: "WhatsApp'ta takas kaosu", shift: "Havuzla vardiya değişimi" },
  { problem: "Hijyen denetimi kağıtta", current: "Deftere hijyen kaydı", shift: "Dijital checklist + HACCP" },
  { problem: "Ekip iletişimi dağınık", current: "WhatsApp grupları", shift: "Uygulama içi duyuru" },
];

// Spec Bölüm 4 — çekirdek MVP modülleri (Faz 1). Spec 12.1 "derinlik > genişlik" gereği
// landing 11 modülü dökmez; çekirdek 5'i öne çıkarır, gerisi "ve dahası" ile özetlenir.
export const CORE_MODULES = [
  {
    key: "vardiya",
    title: "Vardiya Çizelgesi",
    icon: "CalendarDays",
    benefit: "Haftalık programı dakikalar içinde kur — yayınlayınca ekip anında haberdar olur.",
    points: ["Sürükle-bırak takvim, renk kodlu pozisyonlar", "Geçen haftayı ya da şablonu tek tuşla klonla", "Açık vardiya havuzuyla boşlukları doldur"],
    accent: "barista",
  },
  {
    key: "gorev",
    title: "Görev Panosu",
    icon: "KanbanSquare",
    benefit: "Hiçbir iş unutulmasın — sözlü iş emri yerine kanban, kim ne yaptı ne zaman hepsi kayıtlı.",
    points: ["Fotoğraf kanıtıyla görev tamamlama", "Kişiye ya da pozisyona ata (\"tüm baristalar\")", "Açılış / kapanış checklist'leri"],
    accent: "kasiyer",
  },
  {
    key: "puantaj",
    title: "Giriş-Çıkış & Mesai",
    icon: "Clock",
    benefit: "Mesai hesabı elle bitsin — QR/PIN giriş-çıkış, İş Kanunu'na göre otomatik fazla mesai.",
    points: ["Kiosk modu: tezgahtaki paylaşılan tablet", "Haftalık 45s limitinde otomatik uyarı", "Bordroya hazır aylık özet"],
    accent: "komi",
  },
  {
    key: "havuz",
    title: "Vardiya Havuzu",
    icon: "ArrowRightLeft",
    benefit: "\"Bugün gelemiyorum\" krize dönüşmesin — personel vardiyasını havuza sunar, başkası kapar.",
    points: ["Sun / kap akışı, WhatsApp takasına son", "Onay modunu sen seçersin", "İş Kanunu limitleri otomatik korunur"],
    accent: "barista",
  },
  {
    key: "duyuru",
    title: "Duyuru & Bildirim",
    icon: "Megaphone",
    benefit: "Herkes aynı bilgiyle çalışsın — önemli haber WhatsApp trafiğinde kaybolmasın.",
    points: ["Tüm ekibe ya da tek role duyuru", "Anlık push bildirim", "Okundu takibi"],
    accent: "kasiyer",
  },
] as const;

// Sosyal kanıt şeridi — metin tabanlı güven istatistikleri (SAHTE müşteri logosu YOK).
// DÜRÜSTLÜK: müşteri verimiz henüz yok → "%X tasarruf" gibi ÖLÇÜLMEMİŞ net iddia KULLANMA
// (Tur 5 kararı; eski "%50 daha az WhatsApp" söküldü). Sadece doğrulanabilir çerçeve rakamları:
// 10 dk kurulum (spec 1.2/12.1), 5–50 personel hedef (spec 1.4), 11 modül (spec 0), tek platform.
// `to` alanı olanlar count-up animasyonu yapar; `text` olan (Tek çatı) niteliksel — sayı değil.
export const STATS: {
  to?: number;
  prefix?: string;
  suffix?: string;
  text?: string;
  label: string;
}[] = [
  { text: "Tek çatı", label: "WhatsApp, Excel ve kağıt yerine tek platform" },
  { to: 10, suffix: " dk", label: "kurulum — teknik bilgi gerekmez" },
  { prefix: "5–", to: 50, label: "personelli kafeler için ölçeklenir" },
  { to: 11, label: "modül, vardiyadan hijyene tek çatı" },
];

// Neden Shift — farklılaştırıcı kartlar (spec 1.5 / 2.3 / 2.4). "7shifts'te yok" vurgusu
// ile Türkiye kazanan kartları. İkon adları lucide-react'ten.
export const WHY_CARDS = [
  {
    icon: "Scale",
    title: "İş Kanunu'na göre mesai",
    detail: "Fazla mesai, gece/tatil çarpanı, günlük 11s / haftalık 45s limiti otomatik. ABD kurallarına göre değil, buraya göre.",
    badge: "7shifts'te yok",
  },
  {
    icon: "ShieldCheck",
    title: "KVKK, tedarik, hijyen",
    detail: "Verilerin Avrupa / Türkiye'de. Stok, tedarik ve HACCP denetimi 7shifts'te yok — Shift'te var.",
    badge: "7shifts'te yok",
  },
  {
    icon: "MessagesSquare",
    title: "Türkçe, kafe diliyle",
    detail: "\"86 badem sütü\", \"vitrin buzdolabı\", \"açılış checklist'i\" — ekibinin konuştuğu dille. Türkçe destek, çeviri değil.",
    badge: "Yerel kazanç",
  },
  {
    icon: "Zap",
    title: "10 dakikada kurulum",
    detail: "Teknik bilgi gerektirmez: şubeni aç, pozisyonları seç, ekibini davet et. İlk vardiya programını aynı gün yayınla.",
    badge: "Kolay başlangıç",
  },
];

// "ve dahası" — spec'te var, landing'de başlık düzeyinde özetlenen modüller (11'e boğmadan).
export const MORE_MODULES = [
  "Stok",
  "Tedarik",
  "Hijyen / HACCP",
  "İK",
  "Analitik",
  "Çok Şube",
];

// Spec 1.5 — Rakip Konumlandırma Özeti (sadeleştirilmiş; farklılaştırıcı satırlar öne).
// value: "full" | "partial" | "none" | metin. Shift sütunu vurgulanır.
export const COMPARISON = {
  competitors: ["Shift", "7shifts", "Yerli POS*"],
  rows: [
    { feature: "Vardiya & Havuz", values: ["full", "full", "none"] },
    { feature: "Görev (Kanban + foto)", values: ["full", "partial", "none"] },
    { feature: "Stok & Tedarik", values: ["full", "none", "none"] },
    { feature: "Hijyen / HACCP", values: ["full", "none", "none"] },
    { feature: "İş Kanunu Uyumu", values: ["full", "none", "partial"] },
    { feature: "KVKK Uyumu", values: ["full", "none", "full"] },
    { feature: "Türkçe Destek", values: ["full", "none", "full"] },
  ],
  footnote: "* Restomenum, Menulux, KarekodGarson gibi POS/adisyon sistemleri yalnız satış tarafını çözer. Kaynak: Ürün Spesifikasyonu 1.5.",
};

// Spec 1.5 — TAM rakip matrisi (/neden-shift sayfası, Tur 7). Landing'deki sade COMPARISON'ın
// genişletilmişi: 4 sütun + 11 satır, spec tablosuyla birebir. DÜRÜSTLÜK: spec Shift vizyonunu
// "Tam" yazar ama stok/tedarik/hijyen/İK henüz İNŞA EDİLMEDİ → Shift hücresinde faz etiketi
// gösterilir ("var" gibi sunulmaz).
export const COMPARISON_FULL = {
  competitors: ["Shift", "7shifts", "Restomenum", "KarekodGarson"],
  rows: [
    { feature: "Vardiya Planlama", values: ["full", "full", "temel", "AI önerili"] },
    { feature: "Vardiya Havuzu / Takas", values: ["full", "full", "none", "none"] },
    { feature: "Görev (Kanban + foto)", values: ["full", "temel", "none", "none"] },
    { feature: "Giriş-Çıkış & Mesai", values: ["full", "full", "kısmi", "kısmi"] },
    { feature: "Stok Takibi", values: ["Faz 2", "none", "uyarı bazlı", "temel"] },
    { feature: "Tedarik Yönetimi", values: ["Faz 2", "none", "none", "none"] },
    { feature: "Hijyen / HACCP", values: ["Faz 3", "none", "none", "none"] },
    { feature: "İK / Personel", values: ["Faz 3", "temel", "none", "none"] },
    { feature: "İş Kanunu Uyumu", values: ["full", "none", "kısmi", "kısmi"] },
    { feature: "KVKK Uyumu", values: ["full", "none", "full", "full"] },
    { feature: "Türkçe Destek", values: ["full", "none", "full", "full"] },
  ],
  footnote:
    "Kaynak: Ürün Spesifikasyonu 1.5. \"Faz 2/3\" = Shift yol haritasında, henüz yayında değil — dürüst etiket. Restomenum ve KarekodGarson POS/adisyon odaklıdır; ekip operasyonu tarafı sınırlıdır.",
};

// Spec 12.3 — Fiyatlandırma (referans). Kapsamlar tabloyla birebir.
export const PRICING = [
  {
    name: "Başlangıç",
    price: "499",
    users: "1–10 kullanıcı",
    scope: ["Vardiya", "Görev", "Checklist", "Giriş-Çıkış", "Duyuru"],
    highlighted: false,
  },
  {
    name: "Büyüme",
    price: "999",
    users: "1–30 kullanıcı",
    scope: ["+ Stok", "+ Tedarik", "+ Mesai", "+ Mesajlaşma", "+ Raporlar"],
    highlighted: true,
  },
  {
    name: "Pro",
    price: "1.799",
    users: "Sınırsız kullanıcı",
    scope: ["+ Hijyen", "+ İK", "+ Çok Şube", "+ Entegrasyonlar"],
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "Özel",
    users: "Sınırsız kullanıcı",
    scope: ["+ AI", "+ SLA", "+ Özel entegrasyon", "+ Öncelikli destek"],
    highlighted: false,
  },
];

// Spec 2.3 / 10.3 / 12.1 — güven unsurları.
export const TRUST = [
  { title: "İş Kanunu uyumlu", detail: "Günlük 11s, haftalık 45s limiti; fazla mesai %50 zamlı — otomatik hesap ve uyarı." },
  { title: "KVKK uyumlu", detail: "Verileriniz Avrupa / Türkiye veri merkezinde (Hetzner) tutulur." },
  { title: "Türkçe, kafe diliyle", detail: "Arayüz ve jargon kafe operasyonuna göre kalibre — 10 dakikada başlayın." },
];
