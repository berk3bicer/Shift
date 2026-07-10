import type { Metadata } from "next";

// /kvkk — KVKK m.10 aydınlatma metni (Tur 16, gap #P2 kapanışı).
//
// ⚠️ HUKUKİ SINIR: Bu metin TASLAK ŞABLONDUR, hukuki tavsiye DEĞİLDİR. Gerçek ödeyen
// müşteriden önce bir avukat/KVKK danışmanı ONAYLAMALIDIR. Köşeli parantezli
// placeholder'ları ([VERİ SORUMLUSU UNVANI] vb.) Berke doldurur — uydurma değer yazılmaz.
// Avukat onayından sonra aşağıdaki görünür "taslak" notu kaldırılır.
//
// İki-marka kuralı: metinde hiçbir üçüncü firma adı geçmez (barındırma dahil —
// "Avrupa Birliği sınırları içindeki veri merkezleri" denir, firma adı verilmez).

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Shift",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında aydınlatma metni: işlenen veriler, işleme amaçları, hukuki sebepler ve ilgili kişi hakları.",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "1. Veri Sorumlusu",
    body: (
      <>
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca kişisel
          verileriniz, veri sorumlusu sıfatıyla <strong>[VERİ SORUMLUSU UNVANI]</strong> tarafından
          aşağıda açıklanan kapsamda işlenmektedir.
        </p>
        <ul>
          <li>
            <strong>Adres:</strong> [ADRES]
          </li>
          <li>
            <strong>İletişim:</strong> [İLETİŞİM E-POSTA]
          </li>
          <li>
            <strong>VERBİS Kayıt No:</strong> [VERBİS NO — varsa]
          </li>
        </ul>
      </>
    ),
  },
  {
    title: "2. İşlenen Kişisel Veriler",
    body: (
      <ul>
        <li>
          <strong>Kimlik verileri:</strong> ad, soyad
        </li>
        <li>
          <strong>İletişim verileri:</strong> e-posta adresi, telefon numarası
        </li>
        <li>
          <strong>Çalışma verileri:</strong> vardiya planları, giriş-çıkış saatleri, mesai
          kayıtları, görev ve izin kayıtları
        </li>
        <li>
          <strong>İşlem güvenliği verileri:</strong> IP adresi, oturum kayıtları, sistem giriş
          kayıtları
        </li>
      </ul>
    ),
  },
  {
    title: "3. İşleme Amaçları",
    body: (
      <ul>
        <li>Hizmetin sunulması: vardiya, mesai, görev ve izin yönetimi süreçlerinin yürütülmesi</li>
        <li>Hesap ve işlem güvenliğinin sağlanması</li>
        <li>
          Yasal yükümlülüklerin yerine getirilmesi (İş Kanunu kapsamındaki çalışma süresi kayıtları
          dahil)
        </li>
        <li>Sizinle iletişim kurulması (hesap davetleri, bildirimler, destek)</li>
      </ul>
    ),
  },
  {
    title: "4. Hukuki Sebepler (KVKK m.5)",
    body: (
      <ul>
        <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması</li>
        <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi</li>
        <li>
          İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru
          menfaati
        </li>
        <li>Gereken hallerde açık rıza</li>
      </ul>
    ),
  },
  {
    title: "5. Saklama Süresi",
    body: (
      <p>
        Kişisel verileriniz, ilgili mevzuatta öngörülen süreler boyunca; mevzuatta süre
        öngörülmeyen hallerde hesabınız aktif olduğu sürece ve hesabın kapatılmasını takiben yasal
        zamanaşımı süreleri boyunca saklanır, sürenin sonunda silinir, yok edilir veya anonim hale
        getirilir.
      </p>
    ),
  },
  {
    title: "6. Veri Aktarımı",
    body: (
      <p>
        Hizmet altyapımız Avrupa Birliği sınırları içindeki veri merkezlerinde barındırılmaktadır.
        Kişisel verilerin yurt dışına aktarılmasının söz konusu olduğu hallerde aktarım, KVKK m.9
        çerçevesinde ve Kanun&rsquo;un öngördüğü güvencelere uygun olarak gerçekleştirilir.
        Verileriniz üçüncü kişilere satılmaz veya pazarlama amacıyla paylaşılmaz.
      </p>
    ),
  },
  {
    title: "7. İlgili Kişi Hakları (KVKK m.11)",
    body: (
      <>
        <p>KVKK m.11 uyarınca herkes, veri sorumlusuna başvurarak kendisiyle ilgili;</p>
        <ul>
          <li>Kişisel verilerinin işlenip işlenmediğini öğrenme ve buna ilişkin bilgi talep etme</li>
          <li>İşleme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
          <li>Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme</li>
          <li>Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
          <li>İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhine
            bir sonucun ortaya çıkmasına itiraz etme</li>
          <li>Kanuna aykırı işleme sebebiyle zarara uğraması hâlinde zararın giderilmesini talep
            etme</li>
        </ul>
        <p>
          haklarına sahiptir. Başvurularınızı <strong>[İLETİŞİM E-POSTA]</strong> adresine
          iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz olarak sonuçlandırılır.
        </p>
      </>
    ),
  },
];

export default function KvkkPage() {
  return (
    <main>
      <section className="bg-[var(--color-paper)] pb-10 pt-28 lg:pt-36">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          <span className="text-sm font-bold uppercase tracking-wider text-[var(--color-signal-deep)]">
            Yasal
          </span>
          <h1 className="font-display mt-3 text-3xl font-extrabold leading-[1.1] text-[var(--color-ink)] sm:text-4xl">
            KVKK Aydınlatma Metni
          </h1>
          <p className="mt-4 text-base leading-relaxed text-[var(--color-muted)]">
            6698 sayılı Kişisel Verilerin Korunması Kanunu m.10 kapsamında, Shift platformunu
            kullanan işletme sahipleri ve çalışanlarına yönelik aydınlatma metnidir.
          </p>

          {/* Avukat onayı sonrası Berke tarafından kaldırılacak görünür taslak notu. */}
          <div className="mt-6 rounded-2xl border border-[var(--color-signal)]/40 bg-[var(--color-cream)] px-5 py-4 text-sm leading-relaxed text-[var(--color-ink)]">
            <strong>Not:</strong> Bu metin taslaktır; nihai yayın öncesi hukuki inceleme gerekir.
          </div>
        </div>
      </section>

      <section className="bg-[var(--color-paper)] pb-24">
        <div className="mx-auto max-w-3xl space-y-10 px-5 sm:px-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-xl font-bold text-[var(--color-ink)]">{s.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-[var(--color-muted)] [&_li]:mt-1.5 [&_strong]:text-[var(--color-ink)] [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}
