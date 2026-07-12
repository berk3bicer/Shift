// Modül detay sayfalarının içeriği — TAMAMI docs/spec/Shift_Spesifikasyon.md'den (Bölüm 4,
// Modül 1/1.4/2/3/4+5/6). Uydurma özellik YOK; her özellik spec'teki MVP/Faz/TR etiketiyle
// birlikte taşınır. DÜRÜSTLÜK: henüz inşa edilmemiş modüller (stok-tedarik Faz 2, hijyen Faz 3)
// `phase` alanı taşır ve sayfada "Yakında" rozetiyle sunulur — "var" gibi anlatılmaz.

export type ModuleFeature = { title: string; desc: string; tag: "MVP" | "Faz 2" | "Faz 3" | "TR" };
export type ModuleStep = { title: string; desc: string };

export type ModulePage = {
  slug: string;
  name: string;
  /** Mega-menü + grid için tek satır açıklama */
  short: string;
  icon: string; // lucide ikon adı
  accent: "barista" | "kasiyer" | "komi";
  /** Hero fayda başlığı */
  headline: string;
  sub: string;
  /** Dolu = henüz inşa edilmedi → "Yakında" rozeti */
  phase?: "Faz 2 — Yakında" | "Faz 3 — Yakında";
  features: ModuleFeature[];
  how: ModuleStep[];
  /** Türkiye'ye özgü fark (varsa) */
  tr?: { title: string; body: string };
  /** FeatureMocks / ShiftGrid görsel anahtarı */
  visual: "shiftgrid" | "kanban" | "timeclock" | "pool" | "stock" | "hygiene";
};

export const MODULE_PAGES: ModulePage[] = [
  {
    slug: "vardiya",
    name: "Vardiya & Planlama",
    short: "Sürükle-bırak çizelge, şablon, yayınla + bildirim",
    icon: "CalendarDays",
    accent: "barista",
    headline: "Haftalık programı dakikalar içinde kur.",
    sub: "Vardiya WhatsApp gruplarında ve kağıtta dönmesin. Sürükle-bırak takvimle programı kur, tek tuşla yayınla — ekip anında haberdar olur.",
    features: [
      { title: "Sürükle-bırak haftalık takvim", desc: "Gün, hafta ve ay görünümüyle vardiyaları takvim üzerinde sürükleyerek planla.", tag: "MVP" },
      { title: "Pozisyon bazlı renk kodu", desc: "Barista, kasiyer, komi — her pozisyon kendi renginde; kim nerede tek bakışta.", tag: "MVP" },
      { title: "Şablondan kur, geçen haftayı klonla", desc: "Haftalık rutinini şablon olarak kaydet; geçen haftanın programını tek tuşla bu haftaya kopyala.", tag: "MVP" },
      { title: "Açık vardiya", desc: "Kimseye atanmamış vardiyayı havuza aç — uygun roldeki personel teklif verir, sen seçersin.", tag: "MVP" },
      { title: "Yayınla + otomatik bildirim", desc: "Program yayınlandığında tüm personele anında bildirim gider; \"görmedim\" bahanesi biter.", tag: "MVP" },
      { title: "Müsaitlik / izin ayrımı", desc: "Tekrar eden müsaitlik (\"pazartesi okul var\") ile tek seferlik izin (\"15–20 Temmuz tatil\") ayrı yönetilir, takvime otomatik yansır.", tag: "MVP" },
      { title: "Çakışma ve İş Kanunu uyarıları", desc: "Çift atama, günlük 11 saat ve haftalık 45 saat aşımı, dinlenme süresi ihlali — planlarken otomatik uyarı.", tag: "TR" },
    ],
    how: [
      { title: "Şablonu seç ya da boş haftayla başla", desc: "Haftalık rutinin varsa tek tuşla yükle; yoksa boş takvimde başla." },
      { title: "Sürükle, bırak, uyarıları gör", desc: "Personeli vardiyalara sürükle; çakışma ve limit uyarıları anında görünür." },
      { title: "Yayınla — ekip haberdar", desc: "Tek tuşla yayınla; tüm ekip bildirimle programını görür." },
    ],
    tr: {
      title: "İş Kanunu'na göre planlama",
      body: "Shiftle, 4857 sayılı İş Kanunu limitlerini planlama anında denetler: günlük 11 saat, haftalık 45 saat ve iki vardiya arası dinlenme süresi. ABD kurallarına göre yazılmış araçlarda bu kontroller yoktur — burada planın daha yayınlanmadan uyumlu olur.",
    },
    visual: "shiftgrid",
  },
  {
    slug: "gorev",
    name: "Görev & Checklist",
    short: "Kanban pano, foto kanıt, açılış/kapanış listeleri",
    icon: "KanbanSquare",
    accent: "kasiyer",
    headline: "Hiçbir iş unutulmasın.",
    sub: "Sözlü iş emri unutulur; kanban kartı unutulmaz. Kim ne yaptı, ne zaman yaptı, fotoğrafı nerede — hepsi kayıtlı.",
    features: [
      { title: "Kanban görev panosu", desc: "Yapılacak → Devam Ediyor → Tamamlandı. Görevler sürükle-bırak ilerler; öncelik ve son tarih üzerinde.", tag: "MVP" },
      { title: "Fotoğraf kanıtı", desc: "Tamamlanan göreve kanıt fotoğrafı eklenir — \"temizledim\" demek yetmez, görürsün.", tag: "MVP" },
      { title: "Kişiye ya da pozisyona atama", desc: "Tek kişiye ya da \"tüm baristalar\" gibi pozisyona ata; vardiyadaki herkes görevini bilir.", tag: "MVP" },
      { title: "Açılış / kapanış checklist'leri", desc: "Espresso makinesi ısındı mı, kasa sayıldı mı, vitrin hazır mı — kafeye özel hazır şablonlarla dijital kontrol listesi.", tag: "MVP" },
      { title: "Vardiya notları", desc: "\"Badem sütü bitti, 14:00 rezervasyon var\" — bir vardiyadan diğerine operasyonel not bırak.", tag: "MVP" },
      { title: "Tekrarlayan görevler", desc: "Günlük, haftalık, aylık görevler otomatik oluşur — her sabah elle girmezsin.", tag: "Faz 2" },
    ],
    how: [
      { title: "Görevi oluştur ve ata", desc: "Başlık, kategori, son tarih; kişiye ya da pozisyona ata." },
      { title: "Personel tamamlar, foto ekler", desc: "Görev panoda ilerler; tamamlanınca kanıt fotoğrafı eklenir." },
      { title: "Sen anında görürsün", desc: "Tamamlanma bildirimi atayan yöneticiye düşer; tamamlayan kişi ve saat otomatik kayıtlı." },
    ],
    tr: {
      title: "Kafe diliyle hazır şablonlar",
      body: "Açılış ve kapanış checklist şablonları Türkçe ve kafe operasyonuna göre hazır gelir: vitrin hazırlığı, süt stoğu, kasa açılışı, makine temizliği. Sıfırdan liste yazmakla uğraşmazsın.",
    },
    visual: "kanban",
  },
  {
    slug: "giris-cikis",
    name: "Giriş-Çıkış & Mesai",
    short: "QR/PIN kiosk, İş Kanunu mesaisi, bordro export",
    icon: "Clock",
    accent: "komi",
    headline: "Mesai hesabı elle bitsin.",
    sub: "Giriş-çıkış QR ya da PIN'le saniyeler içinde; puantaj zaman damgalı, mesai İş Kanunu'na göre otomatik. Ay sonunda hesap makinesi yok.",
    features: [
      { title: "QR kod ile giriş-çıkış", desc: "Personel telefonunu kameraya tutar — giriş saniyeler içinde, zaman damgalı.", tag: "MVP" },
      { title: "PIN + Kiosk modu", desc: "Tezgah arkasındaki paylaşılan tablet merkezi giriş istasyonu olur; herkes PIN'iyle giriş-çıkış yapar.", tag: "MVP" },
      { title: "Geç giriş / erken çıkış bildirimi", desc: "Planlanan vardiyadan sapma olduğunda yöneticiye anında bildirim.", tag: "MVP" },
      { title: "Haftalık 45 saat üzeri %50 zamlı", desc: "Fazla mesai İş Kanunu'na göre otomatik işaretlenir ve %50 zamlı hesaplanır.", tag: "TR" },
      { title: "Gece, hafta sonu ve resmi tatil çarpanı", desc: "Türkiye resmi tatil takvimi entegre; tatil günü otomatik tanınır, çarpan işletme bazlı tanımlanır.", tag: "TR" },
      { title: "Bordroya hazır dışa aktarma", desc: "Aylık çalışma ve mesai özeti Excel/CSV olarak dışa aktarılır — yaygın muhasebe yazılımlarıyla uyumlu format.", tag: "Faz 2" },
    ],
    how: [
      { title: "QR okut ya da PIN gir", desc: "Vardiyaya gelen personel tabletten ya da telefonundan giriş yapar." },
      { title: "Puantaj kendiliğinden oluşur", desc: "Her giriş-çıkış zaman damgalı kaydedilir; günlük ve haftalık toplamlar otomatik." },
      { title: "Ay sonu bordroya hazır", desc: "Normal saat, fazla mesai, çarpanlar — hesaplanmış özet tek tıkla dışa aktarılır." },
    ],
    tr: {
      title: "4857 sayılı İş Kanunu'na göre hesap",
      body: "Shiftle'nin mesai motoru Türkiye mevzuatına göre çalışır: haftalık 45 saati aşan çalışma %50 zamlı fazla mesaidir, günlük çalışma 11 saati aşamaz. Sonradan çevrilmiş bir hesap değil — motor baştan 4857'ye göre kurgulandı ve hesabı otomatik yapar.",
    },
    visual: "timeclock",
  },
  {
    slug: "vardiya-havuzu",
    name: "Vardiya Havuzu",
    short: "Sun / kap / takas — WhatsApp karmaşası bitmeden onaylı",
    icon: "ArrowRightLeft",
    accent: "barista",
    headline: "“Bugün gelemiyorum” krize dönüşmesin.",
    sub: "Personel gelemeyeceği vardiyayı havuza sunar, uygun roldeki arkadaşı kapar, sen kontrolü kaybetmeden onaylarsın. WhatsApp'ta “kim benim yerime bakar?” mesajları biter.",
    features: [
      { title: "Vardiya Sun (Give)", desc: "Personel yapamayacağı vardiyayı tek dokunuşla havuza koyar — \"kapılmaya açık\".", tag: "MVP" },
      { title: "Vardiya Kap (Take)", desc: "Açık ya da sunulmuş vardiyayı uygun roldeki personel üstlenir.", tag: "MVP" },
      { title: "Rol bazlı görünürlük", desc: "Barista yalnızca barista vardiyalarını görür — yanlış role vardiya kapılamaz.", tag: "MVP" },
      { title: "Onay modu sen seçersin", desc: "Açık (ekip kendi arasında halleder), Onay Gerekli (her devir senden geçer) ya da Kapalı — kontrol seviyesi işletmenin kararı.", tag: "MVP" },
      { title: "Teklife bildirim + seçim", desc: "Açık vardiyaya teklif gelince yöneticiye bildirim düşer; kime atanacağını sen seçersin.", tag: "MVP" },
      { title: "Vardiya Takası (Trade)", desc: "İki personel doğrudan vardiya değiştirir — onay akışı aynı şekilde işler.", tag: "Faz 2" },
    ],
    how: [
      { title: "Personel vardiyasını sunar", desc: "\"Cumartesi gelemiyorum\" — vardiya havuza düşer, uygun roldekiler görür." },
      { title: "Arkadaşı kapar", desc: "Aynı roldeki müsait personel vardiyayı üstlenmek için tek dokunuş yapar." },
      { title: "Onay moduna göre kesinleşir", desc: "Açık modda anında; Onay Gerekli modda senin onayınla. Her adım kayıtlı." },
    ],
    tr: {
      title: "Her devirde limit yeniden kontrol",
      body: "Vardiyayı kapan kişinin haftalık toplamı İş Kanunu limitlerini aşacaksa Shiftle devri onaylamadan önce uyarır. Takas serbestliği, yasal uyumdan taviz vermez.",
    },
    visual: "pool",
  },
  {
    slug: "stok-tedarik",
    name: "Stok & Tedarik",
    short: "PAR uyarısı, dijital sipariş, tedarikçi rehberi",
    icon: "Package",
    accent: "komi",
    headline: "Göz kararı biter.",
    sub: "Kahve çekirdeği, süt, şurup — stok göz kararı değil gerçek zamanlı takip edilir; kritik seviyede uyarı gelir, sipariş WhatsApp'ta değil onay akışında döner.",
    phase: "Faz 2 — Yakında",
    features: [
      { title: "Ürün kataloğu + gerçek zamanlı stok", desc: "Hammadde, içecek ve sarf malzemesi kategorileriyle anlık stok seviyeleri.", tag: "Faz 2" },
      { title: "PAR seviyesi uyarısı", desc: "Minimum stok seviyesini tanımla; altına düşünce otomatik uyarı gelir — \"süt bitmiş\" sabah sürprizi olmaz.", tag: "Faz 2" },
      { title: "Fire kaydı ve stok sayımı", desc: "Bozulan, dökülen, SKT'si geçen ürün kaydı; manuel sayım sistem stoğuyla karşılaştırılır.", tag: "Faz 2" },
      { title: "Tedarikçi rehberi", desc: "Fırın, süt, sebze tedarikçilerin; iletişim, teslimat günleri ve anlaşmalı fiyatlar tek yerde.", tag: "Faz 2" },
      { title: "Dijital sipariş + onay akışı", desc: "Sipariş oluştur → yönetici onaylar → tedarikçiye iletilir. Durum takibi: Taslak / Bekliyor / Onaylandı / Yolda / Teslim.", tag: "Faz 2" },
      { title: "Tekrarlayan sipariş şablonu", desc: "Haftalık süt ve kahve siparişini şablona kaydet, tek tıkla yinele.", tag: "Faz 2" },
    ],
    how: [
      { title: "PAR uyarısı gelir", desc: "Badem sütü kritik seviyenin altına düştü — bildirim sende." },
      { title: "Tek tıkla sipariş", desc: "Tedarikçi şablonundan siparişi oluştur, onaya gönder." },
      { title: "Teslimatı kaydet", desc: "Gelen miktarı doğrula; stok otomatik güncellenir." },
    ],
    tr: {
      title: "Ekip + tedarik aynı çatıda",
      body: "Vardiya araçları stok ve tedariğe hiç girmez; satış sistemleri ise kasada kalır. Shiftle, ekip operasyonuyla tedariği aynı çatıda birleştirmeyi hedefliyor. Bu modül Faz 2'de geliyor — bugün satın alma kararını çekirdek modüller üzerinden verebilirsin.",
    },
    visual: "stock",
  },
  {
    slug: "hijyen",
    name: "Hijyen & HACCP",
    short: "HACCP checklist, sıcaklık kaydı, denetim raporu",
    icon: "SprayCan",
    accent: "kasiyer",
    headline: "Denetime her an hazır.",
    sub: "Hijyen kaydı deftere değil dijitale: HACCP uyumlu günlük checklist, zorunlu sıcaklık kayıtları ve denetim günü tek tıkla rapor.",
    phase: "Faz 3 — Yakında",
    features: [
      { title: "HACCP uyumlu günlük denetim", desc: "Yüzey, el hijyeni, çöp, dolap sıcaklıkları — günlük dijital hijyen checklist'i.", tag: "TR" },
      { title: "Sıcaklık kaydı", desc: "Buzdolabı ve derin dondurucu sıcaklıkları günde iki kez kaydedilir; eksik kayıtta yöneticiye uyarı.", tag: "TR" },
      { title: "Fotoğraflı doğrulama", desc: "Temizlik sonrası fotoğraf yükleme zorunluluğu — kayıt sözde değil kanıtlı.", tag: "Faz 3" },
      { title: "Ekipman ve haşere kontrol kaydı", desc: "Makine, fırın, vitrin temizliği; ilaçlama tarihleri ve sonuçları tarihsel kayıtta.", tag: "Faz 3" },
      { title: "Denetim raporu tek tıkla", desc: "Belediye/sağlık denetimi için tüm kayıtlardan otomatik rapor oluşturulur.", tag: "TR" },
      { title: "Tarihsel arşiv + dışa aktarma", desc: "Tüm kayıtlar saklanır, aranır ve dışa aktarılır — \"geçen ayın kaydı nerede?\" sorusu biter.", tag: "Faz 3" },
    ],
    how: [
      { title: "Günlük checklist doldurulur", desc: "Açılışta hijyen maddeleri işaretlenir, sıcaklıklar girilir." },
      { title: "Eksik varsa uyarı", desc: "Kayıt atlanırsa yöneticiye bildirim — denetim günü sürpriz yok." },
      { title: "Denetimde tek tık rapor", desc: "Tüm tarihsel kayıt HACCP formatında rapora dönüşür." },
    ],
    tr: {
      title: "Türkiye'de yasal zorunluluk",
      body: "HACCP kayıtları gıda işletmeleri için yasal gerekliliktir ve bugün çoğu kafede kağıt formlarda tutulur. Shiftle'nin hijyen modülü Faz 3'te geliyor — kağıt dosyayı rafa kaldırmak için.",
    },
    visual: "hygiene",
  },
];

export function getModule(slug: string) {
  return MODULE_PAGES.find((m) => m.slug === slug);
}

// /moduller genel bakış sayfasındaki "yol haritası" şeridi — detay sayfası OLMAYAN modüller
// (spec Modül 7–11 + Mesajlaşma). Dürüstlük: faz etiketiyle, link YOK.
export const ROADMAP_MODULES = [
  { name: "Duyuru & Bildirim", desc: "Tek yönlü duyuru + anlık bildirim — çekirdekte bugün var.", tag: "Çekirdekte" },
  { name: "Mesajlaşma", desc: "Yönetici-personel birebir ve grup mesajlaşması.", tag: "Faz 2" },
  { name: "Analitik & Raporlama", desc: "İşgücü maliyeti, devamsızlık, operasyon skoru.", tag: "Faz 2–3" },
  { name: "İK & Personel Dosyası", desc: "Dijital özlük, belge saklama, onboarding.", tag: "Faz 3" },
  { name: "Çok Şube", desc: "Merkezi yönetim, konsolide rapor, şubeler arası transfer.", tag: "Faz 3" },
  { name: "Entegrasyonlar", desc: "POS/adisyon, muhasebe ve e-Fatura entegrasyonları.", tag: "Faz 3–4" },
];
