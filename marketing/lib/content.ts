// TÜM ürün/fiyat iddiaları docs/spec/Shift_Spesifikasyon.md'den birebir alınmıştır.
// Her bloğun üstünde kaynak bölüm işaretlidir. Pazarlama abartısı YOK — spec ne diyorsa o.

// Spec 1.3 — Temel Değer Önerisi tablosu (çekirdek satırlar; landing'de sadeleştirildi).
export const PROBLEM_SOLUTION = [
  { problem: "Vardiya planı WhatsApp/kağıtta", current: "Excel veya kağıt", shift: "Sürükle-bırak dijital çizelge" },
  { problem: "Görev takibi yok", current: "Sözlü iletişim", shift: "Kanban görev panosu + fotoğraf kanıtı" },
  { problem: "Ek mesai hesabı elle", current: "Hesap makinesi", shift: "İş Kanunu'na göre otomatik hesaplama + uyarı" },
  { problem: "Vardiya değişimi karmaşası", current: "WhatsApp'ta yazışma", shift: "Vardiya havuzu (sun/kap) + onay akışı" },
  { problem: "Hijyen denetimi kağıtta", current: "Form / defter", shift: "Dijital checklist + fotoğraf kaydı" },
  { problem: "Ekip iletişimi dağınık", current: "WhatsApp grupları", shift: "Uygulama içi duyuru + bildirim" },
];

// Spec Bölüm 4 — çekirdek MVP modülleri (Faz 1). Spec 12.1 "derinlik > genişlik" gereği
// landing 11 modülü dökmez; çekirdek 5'i öne çıkarır, gerisi "ve dahası" ile özetlenir.
export const CORE_MODULES = [
  {
    key: "vardiya",
    title: "Vardiya Çizelgesi",
    benefit: "Haftalık programı sürükle-bırakla kur, tek tuşla yayınla — ekip anında bildirim alır.",
    points: ["Pozisyon renk kodu: barista / kasiyer / komi", "Açık vardiya + vardiya havuzu (sun / kap)", "Geçen haftayı kopyala-yapıştır"],
    accent: "barista",
  },
  {
    key: "gorev",
    title: "Görev Panosu",
    benefit: "\"Vitrini düzenle, makineyi temizle\" — sözlü iş emri yerine kanban, fotoğraf kanıtıyla.",
    points: ["Yapılacak → Devam Ediyor → Tamamlandı", "Kişiye ya da pozisyona ata (\"tüm baristalar\")", "Tamamlanınca yöneticiye anlık bildirim"],
    accent: "kasiyer",
  },
  {
    key: "puantaj",
    title: "Giriş-Çıkış & Mesai",
    benefit: "QR ya da tablet PIN ile giriş-çıkış; mesai İş Kanunu'na göre otomatik hesaplanır.",
    points: ["Kiosk modu: tezgah arkasındaki paylaşılan tablet", "Geç giriş / erken çıkışta anlık uyarı", "Günlük 11s / haftalık 45s limit uyarısı"],
    accent: "komi",
  },
  {
    key: "checklist",
    title: "Açılış / Kapanış Listeleri",
    benefit: "Espresso makinesi ısındı mı, kasa sayıldı mı — dijital checklist, tamamlayan ve saat kayıtlı.",
    points: ["Her işletme kendi listesini kurar", "Tamamlayan kişi + saat otomatik damga", "Yönetici anında tamamlanma raporu görür"],
    accent: "barista",
  },
  {
    key: "duyuru",
    title: "Duyuru & Bildirim",
    benefit: "Dağınık WhatsApp trafiğini uygulamaya taşı — yöneticiden tüm ekibe ya da tek role.",
    points: ["Tek yönlü duyuru: tüm ekip veya belirli rol", "Vardiya notu: \"badem sütü bitti, 14:00 rezervasyon\"", "Anlık push bildirim"],
    accent: "kasiyer",
  },
];

// "ve dahası" — spec'te var, landing'de başlık düzeyinde özetlenen modüller (11'e boğmadan).
export const MORE_MODULES = [
  "Vardiya Havuzu",
  "Müsaitlik & İzin",
  "Vardiya Notları",
  "Bordro Desteği (Logo / Mikro / Paraşüt)",
  "Raporlar & Dışa Aktarma",
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
