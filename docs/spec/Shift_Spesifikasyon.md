SHIFT · Ürün ve Teknik Spesifikasyon

**SHIFT**

**Kafe ****&**** Restoran Operasyon Yönetim Platformu**

Kapsamlı Ürün ve Teknik Spesifikasyon

Versiyon 2.0  ·  Haziran 2026

Hazırlayan: Berke Biçer

*Bu doküman; 7shifts dünya lideri platformunun derinlemesine incelenmesi,*

*Shift**'**in 11 modüllük kapsamı ve Türkiye pazarına özgü gereksinimlerin*

*birleştirilmesiyle hazırlanmıştır.*

**İçindekiler**

# 0. Yönetici Özeti

**Shift**, Türkiye'deki kafe ve restoranların tüm operasyonel süreçlerini tek bir platformda toplayan bir SaaS (servis olarak yazılım) yönetim sistemidir. Vardiya planlamadan giriş-çıkış takibine, görev yönetiminden stok ve tedariğe, hijyen denetiminden analitiğe kadar bir işletme yöneticisinin günlük ihtiyaç duyduğu araçların tamamını içerir.

Bu doküman üç kaynağın birleşiminden oluşur: (1) dünya çapında 55.000'den fazla restoranın kullandığı **7shifts** platformunun özellik özellik incelenmesi, (2) Shift'in özgün 11 modüllük geniş kapsamı, ve (3) Türkiye pazarına özgü yasal ve operasyonel gereksinimler (İş Kanunu, KVKK, yerel bordro ve POS sistemleri). Amaç; hiçbir kritik özelliğin atlanmadığı, eksiksiz bir referans oluşturmaktır.

**Stratejik konumlandırma: **7shifts vardiya ve ekip iletişiminde mükemmelleşmiş ancak stok, tedarik ve hijyen gibi alanlara hiç girmemiştir. Shift'in farklılaşması tam da burada yatar — Türkiye'de tek başına vardiya + tedarik + stok + hijyen + İK modüllerini barındıran, restoran/kafe sektörüne özel ilk yerli çözüm olmak.

**Önemli ilke: **Bu doküman tüm kapsamı ("ne yapılabilir") tarif eder. Ancak başarının anahtarı genişlik değil derinliktir. 7shifts bu kadar geniş bir üne rağmen çekirdek deneyimi (vardiya + iletişim) kusursuz yaptığı için kazanmıştır. Shift de önce çekirdeği mükemmelleştirmeli, modülleri fazlara yaymalıdır. Faz/MVP işaretleri her modülde belirtilmiştir.

# 1. Ürün Vizyonu ve Konumlandırma

## 1.1 Problem

Türkiye'deki bağımsız kafe ve restoranların operasyonu büyük ölçüde dağınık, dijital olmayan araçlarla yürütülür. Vardiyalar WhatsApp gruplarında veya kağıtta dönüyor; görevler sözlü iletiliyor; mesai elle hesaplanıyor; stok göz kararı takip ediliyor; hijyen kayıtları kağıt formlarda tutuluyor. Mevcut POS/adisyon sistemleri (Restomenum, Menulux, KarekodGarson) yalnızca satış tarafını çözüyor; ekip operasyonu, tedarik, uyum ve analitik tamamen boşta kalıyor.

## 1.2 Çözüm

Shift bu boşluğu doldurur. Bir işletme yöneticisinin ihtiyaç duyduğu her aracı tek çatı altında, mobil öncelikli, Türkiye'nin yasal gereksinimlerine uyumlu ve teknolojiye uzak kullanıcıların bile 10 dakikada kullanmaya başlayabileceği sadelikte sunar.

## 1.3 Temel Değer Önerisi

Aşağıdaki tablo, mevcut yöntemler ile Shift'in yaklaşımını karşılaştırır:

| **Operasyonel Sorun** | **Mevcut Yöntem** | **Shift ile Çözüm** |
| --- | --- | --- |
| Vardiya planı WhatsApp/kağıtta | Excel veya kağıt | Sürükle-bırak dijital çizelge |
| Görev takibi yok | Sözlü iletişim | Kanban tabanlı görev panosu + fotoğraf kanıtı |
| Ek mesai hesabı elle | Hesap makinesi | İş Kanunu'na göre otomatik hesaplama + uyarı |
| Vardiya değişimi karmaşası | WhatsApp'ta yazışma | Vardiya havuzu (takas/devir/kapma) + onay akışı |
| Tedarik WhatsApp'ta | Telefon / mesaj | Dijital sipariş ve onay akışı |
| Hijyen denetimi kağıtta | Form / defter | Dijital checklist + fotoğraf + HACCP kaydı |
| Stok bilgisi yok | Göz kararı | Gerçek zamanlı stok takibi + PAR uyarısı |
| Ekip iletişimi dağınık | WhatsApp grupları | Uygulama içi mesajlaşma + duyuru + bildirim |
| Raporlar yok | Sezgisel kararlar | Analitik dashboard + dışa aktarma |

## 1.4 Hedef Pazar

#### Birincil hedef (başlangıç odağı: KAFE)

- 5–50 personeli olan bağımsız kafeler ve kahve dükkanları

- Brunch mekanları, pastaneler, fast-food işletmeleri

- Küçük zincirler (2–10 şube)

**Not: **Ürün ilk olarak kafe operasyonuna göre kalibre edilecektir (daha sade mutfak, dar menü, sınırlı tedarik kalemleri, basit vardiya yapısı). Restoran genişlemesi sonraki aşamada, gerçek kafe geri bildirimleri alındıktan sonra yapılır.

## 1.5 Rakip Konumlandırma Özeti

| **Özellik** | **Shift** | **7shifts** | **Restomenum** | **KarekodGarson** |
| --- | --- | --- | --- | --- |
| Vardiya Planlama | **Tam** | Tam (restoran odaklı) | Temel | AI önerili |
| Vardiya Havuzu/Takas | **Tam** | Tam | Yok | Yok |
| Görev Yönetimi | **Kanban+foto** | Temel checklist | Yok | Yok |
| Tedarik Yönetimi | **Tam** | Yok | Yok | Yok |
| Stok Takibi | **Tam** | Yok | Uyarı bazlı | Temel |
| Hijyen / HACCP | **Tam** | Yok | Yok | Yok |
| İK / Personel | **Tam** | Temel | Yok | Yok |
| Mobil (PWA→Native) | **Var** | Native iOS+Android | Var | Var |
| İş Kanunu Uyumu | **Tam** | Yok (ABD/Kanada) | Kısmi | Kısmi |
| KVKK Uyumu | **Tam** | Yok (GDPR) | Var | Var |
| Türkçe Destek | **Tam** | Yok | Tam | Tam |

*Yeşil hücreler 7shifts**'**te bulunmayan farklılaştırıcı modülleri, sarı hücreler Türkiye**'**ye özgü kazanan kartları gösterir.*

# 2. 7shifts Derinlemesine Analizi ve Çıkarılan Dersler

7shifts 2014'te Kanada'da kuruldu ve bugün 55.000'den fazla restoran tarafından kullanılıyor. App Store'da 4.8, Google Play'de 4.7 puana sahip. Bu bölüm, onların neyi nasıl yaptığını ve Shift'in bundan ne çıkarması gerektiğini özetler.

## 2.1 7shifts'in Mimari Felsefesi

- **İki yüzeyli yapı** — Yöneticiler için web uygulaması (ağır işler: vardiya kurma, ayarlar, dashboard), personel için mobil uygulama (vardiya görme, giriş-çıkış, talepler). Aynı sistem, iki farklı deneyim.

- **Uygulama parçalama** — 7shifts tek dev uygulama değil; ana app (vardiya+mesajlaşma), 7punches (giriş-çıkış), 7tasks (görev checklist'i) olarak ayrılmış. Hepsi aynı giriş bilgisini paylaşıyor. Shift için ders: modülleri mantıksal olarak ayır ama başta tek uygulamada topla.

- **Davet-zorunlu kayıt** — Personel kendi başına hesap oluşturamaz; mutlaka yöneticiden davet (e-posta/SMS) alması gerekir. Bu, multi-tenant güvenliğin temel taşıdır — rastgele biri bir işletmeye sızamaz.

## 2.2 Çekirdek Özellikler (7shifts'ten birebir alınacaklar)

#### Vardiya Havuzu (Shift Pool) — kritik, Shift roadmap'inde eksikti

7shifts'in en güçlü özelliklerinden biri. Personelin vardiya esnekliğini, yöneticinin kontrolünü kaybetmeden sağlar. Üç işlem:

- **Give a Shift (Vardiya Sun)** — Personel yapamayacağı vardiyayı havuza koyar ("Up for Grabs").

- **Take a Shift (Vardiya Kap)** — Personel açık/sunulmuş bir vardiyayı üstlenir. Sadece kendi atandığı rollerdeki vardiyaları görür.

- **Trade a Shift (Vardiya Takas)** — İki personel doğrudan vardiya değiştirir.

Onay modu işletme tarafından seçilir: **Açık** (personel kendi arasında halleder), **Onay Gerekli** (her takas yöneticiden geçer), **Kapalı** (sadece yönetici manuel yapar). Bu esneklik, Shift'in "her işletme kendi kontrol seviyesini seçer" felsefesine birebir uyar.

#### Availability (Müsaitlik) ile Time Off (İzin) ayrımı — kritik kavramsal netlik

Shift roadmap'inde bu ikisi karışıktı. 7shifts net ayırmış:

- **Availability (Müsaitlik)** — TEKRAR EDEN takvim kısıtları. "Pazartesi ve Salı okul var, çalışamam." Düzenli, haftalık desen. Vardiya planlamasını besler.

- **Time Off (İzin)** — TEK SEFERLİK planlı devamsızlık. "15-20 Temmuz tatildeyim." Belirli tarih aralığı. Onaya tabidir.

*Bu ayrım vardiya planlamasının doğru çalışması için şarttır. Müsaitlik tercihtir; izin onaylanmış bir taahhüttür. Not: 7shifts**'**te onaylı izin bile vardiya atamasını garanti etmez — yönetici gerekirse override edebilir.*

#### Manager Logbook (Yönetici Günlüğü) ve Shift Notes (Vardiya Notları)

- **Manager Logbook** — Her vardiya sonu yöneticinin bıraktığı özet not (müşteri şikayeti, ekipman arızası, günün özeti). Tarihsel olarak saklanır ve aranabilir.

- **Shift Notes** — Bir vardiyadan diğerine bırakılan operasyonel not. Restoran jargonuyla "86 salmon, broken ice machine" — yani "somon bitti, buz makinesi bozuk". Kafe versiyonu: "badem sütü bitti, vitrin buzdolabı arızalı, 14:00 rezervasyon var".

#### Giriş-Çıkış (Time Clock) varyasyonları

- **Mobil giriş-çıkış** — Personel kendi telefonundan, GPS doğrulamasıyla.

- **Kiosk Mode (Kiosk Modu)** — İşletmede paylaşılan bir tablet; merkezi giriş-çıkış istasyonu. Kafede tezgah arkasındaki tablet bu işi görür.

- **GPS + Fotoğraf doğrulama** — Sahte okutmayı ("buddy punching" — başkası adına giriş) önler.

- **Mola takibi** — Yasal mola sürelerinin otomatik takibi ve kaçırılan molalarda uyarı.

- **Fazla mesai uyarısı** — Personel fazla mesai eşiğine yaklaştığında gerçek zamanlı bildirim — maliyet kontrolü için.

## 2.3 7shifts'te Olup Türkiye İçin Uyarlanacaklar

| **7shifts****'****teki Hali** | **Shift****'****teki Türkiye Uyarlaması** |
| --- | --- |
| Fazla mesai: ABD/eyalet kuralları | İş Kanunu: günlük 11s, haftalık 45s limiti; fazla mesai %50 zamlı |
| Bordro: ADP, Gusto, Paychex entegrasyonu | Bordro: Logo, Mikro, Paraşüt entegrasyonu (CSV/JSON export) |
| Bahşiş (tip) yönetimi: kart bahşişi havuzu | Türkiye'de bahşiş kültürü farklı; opsiyonel/sade tutulur |
| GDPR veri uyumu | KVKK veri uyumu; veriler AB/Türkiye'de (Hetzner) |
| İngilizce arayüz | Türkçe arayüz + kafe/restoran jargonu |
| ABD resmi tatilleri | Türkiye resmi tatil takvimi ve tatil çarpanları |
| POS: Toast, Square, Clover | POS: Restomenum, Menulux, Adisyo, KarekodGarson |

## 2.4 7shifts'in Zayıf Noktaları (Shift'in Fırsatları)

- **Modül parçalanmasının dağınıklığı** — Giriş-çıkış (7punches) ve görevler (7tasks) ayrı uygulamalar; kullanıcılar kurulumda ve günlük kullanımda sürtünme yaşıyor. Shift tek uygulamada bütünleşik sunarak avantaj sağlar.

- **Katmanlı fiyatlandırma ve eklenti ücretleri** — Bordro yalnızca üst pakette; birçok özellik plan yükseltmesi gerektiriyor. Küçük işletmeler için pahalı. Shift Türkiye fiyatlarıyla rekabet eder.

- **Operasyon kapsamının darlığı** — 7shifts vardiya ve işgücüne odaklı; stok, tedarik, hijyen YOK. Shift'in 'all-in-one' iddiası burada kazanır.

# 3. Kullanıcı Rolleri ve Yetki Matrisi

Shift'te yetki iki katmanda çalışır ve bu ayrım mimari olarak kritiktir:

- **Rol bazlı yetki (RBAC)** — Kullanıcının kaba erişimini belirler — "bir personel bordro ayarlarına giremez". Endpoint seviyesinde uygulanır.

- **Kaynak bazlı yetki (Resource-based)** — İnce erişimi belirler — "bu yönetici yalnızca KENDİ şubesinin vardiyalarını düzenleyebilir". İşlem anında, kullanıcının kaynakla ilişkisine bakılarak uygulanır.

- **Kapsam (Scope) bazlı izolasyon** — 7shifts modelinden alınma: bir yönetici yalnızca kendi yönettiği şube/departmandaki personelin taleplerini görür. Bu, multi-tenancy ile birlikte çalışır.

## 3.1 Roller

| **Rol** | **Kim?** | **Ne Yapar?** | **Kapsam** |
| --- | --- | --- | --- |
| İşletme Sahibi (Owner) | Tek/çok şube sahibi | Tüm şubeleri görür; performans, maliyet, genel ayarlar; en yüksek yetki | Tüm tenant (tüm şubeler) |
| Yönetici / Müdür (Manager) | Şef, vardiya müdürü | Vardiya planlar, görev atar, izin/talep onaylar, tedarik verir, raporları görür | Atandığı şube(ler) |
| Asistan Yönetici (opsiyonel) | Vardiya sorumlusu | Sınırlı yönetici yetkisi; ayarları görür ama değiştiremez (özelleştirilebilir izin) | Atandığı şube |
| Personel (Staff) | Barista, kasiyer, komi, garson, aşçı | Vardiya görür, görev tamamlar, giriş-çıkış yapar, izin/değişim talebi oluşturur | Kendi verisi + atandığı şube |
| Tedarikçi (Supplier) | Fırın, süt, sebze tedarikçisi | Sipariş alır, fiyat günceller, teslimat durumu girer (sonraki faz: portal) | Yalnızca kendisine gelen siparişler |

**Hiyerarşi inceliği (7shifts****'****ten): **Aynı seviyedeki kullanıcılar birbirinin taleplerini onaylayamaz. Bir yönetici, başka bir yöneticinin izin talebini onaylamaz — yalnızca asistan yönetici ve personelin taleplerini onaylar. İşletme sahibi yöneticilerin taleplerini onaylar.

**Çoklu rol: **Küçük kafelerde bir kişi hem sahip hem yönetici hem barista olabilir. Sistem bir kullanıcının birden fazla rol taşımasına izin vermelidir. Bu, esneklik için zorunludur.

## 3.2 Yetki Matrisi (özet)

✓ tam erişim · ◐ sınırlı/kendi verisi · ✗ erişim yok

| **İşlev** | **Sahip** | **Yönetici** | **Personel** | **Tedarikçi** |
| --- | --- | --- | --- | --- |
| Şube ekleme/yönetme | ✓ | ✗ | ✗ | ✗ |
| Vardiya oluşturma/yayınlama | ✓ | ✓ | ✗ | ✗ |
| Kendi vardiyasını görme | ✓ | ✓ | ✓ | ✗ |
| Vardiya değişim talebi | ✓ | ✓ | ✓ | ✗ |
| İzin/talep onaylama | ✓ | ◐ (şube) | ✗ | ✗ |
| Görev atama | ✓ | ✓ | ✗ | ✗ |
| Görev tamamlama | ✓ | ✓ | ✓ | ✗ |
| Giriş-çıkış yapma | ✓ | ✓ | ✓ | ✗ |
| Mesai/bordro raporu | ✓ | ◐ (şube) | ◐ (kendi) | ✗ |
| Stok/tedarik yönetimi | ✓ | ✓ | ✗ | ✗ |
| Sipariş alma/fiyat girme | ✗ | ✗ | ✗ | ◐ (kendi) |
| Hijyen denetimi | ✓ | ✓ | ◐ (doldurma) | ✗ |
| Personel profili/İK | ✓ | ◐ (şube) | ◐ (kendi) | ✗ |
| Analitik dashboard | ✓ (tüm) | ◐ (şube) | ✗ | ✗ |
| Genel ayarlar/fiyatlandırma | ✓ | ✗ | ✗ | ✗ |

# 4. Tam Özellik Listesi — Modül Modül

Aşağıda 11 modülün her özelliği listelenmiştir. Her özelliğin başındaki etiket geliştirme önceliğini gösterir: **[MVP]** = ilk sürümde (Faz 1), **[Faz 2/3/4]** = sonraki fazlarda, **[TR]** = Türkiye'ye özgü gereksinim. Kafe odaklı başlangıç gereği, MVP özellikleri kafe operasyonuna göre seçilmiştir.

## Modül 1: Vardiya ve Çalışma Planlaması

Ürünün kalbi. 7shifts'in en güçlü olduğu alan; Shift'in de ilk "vay be" dedirtecek modülü. Kafelerde vardiya hâlâ WhatsApp/kağıtta döndüğü için dijital çizelge anında değer yaratır.

### 1.1 Vardiya Oluşturma ve Yönetimi

- **[MVP] **Haftalık sürükle-bırak vardiya takvimi (gün/hafta/ay görünümü)

- **[MVP] **Pozisyon bazlı renk kodlu görünüm: barista / kasiyer / komi (kafe); garson / şef / aşçı (restoran)

- **[MVP] **Şablondan vardiya oluşturma — haftalık rutin şablon kaydetme

- **[MVP] **Kopyala-yapıştır: geçen haftanın programını bu haftaya klonlama

- **[MVP] **Açık vardiya (Open Shift) oluşturma — kimseye atanmamış, havuza açık vardiya

- **[MVP] **Vardiya yayınlama: program yayınlandığında tüm personele otomatik bildirim

- **[Faz 2] **Vardiya hatırlatıcısı: başlamadan 2 saat önce push bildirim

- **[Faz 2] **Sürükle-bırak ile işgücü maliyeti önizleme (saatlik ücret × süre)

### 1.2 Müsaitlik (Availability) Yönetimi — tekrar eden

- **[MVP] **Personel tekrar eden müsaitlik profilini girer ("Pazartesi öğleden sonra çalışamam")

- **[Faz 2] **Geçici müsaitlik: belirli bir hafta için istisna (sınav haftası vb.)

- **[MVP] **Müsaitlik vardiya takvimine otomatik yansır — yönetici çakışmaları görür

- **[MVP] **Yönetici müsaitlik değişikliğini onaylar/reddeder

### 1.3 İzin (Time Off) Yönetimi — tek seferlik

- **[MVP] **Personel uygulama üzerinden izin talebi gönderir (tarih aralığı + gerekçe)

- **[MVP] **Yönetici onay/red akışı ve gerekçe notları

- **[TR] **İzin tipleri: yıllık ücretli izin, ücretsiz izin, hastalık izni, mazeret izni

- **[Faz 3] **Yıllık izin bakiyesi takibi (kalan / kullanılan / planlanan gün)

- **[Faz 3] **Hastalık izni: belge (rapor) yükleme alanı

- **[Faz 2] **İzin takvimi: ekip bazlı görünürlük — aynı gün kaç kişi izinli?

- **[Faz 2] **Onaylı izin vardiya atamasını garanti etmez — yönetici override edebilir (bildirimle)

### 1.4 Vardiya Havuzu (Shift Pool) — 7shifts'ten kritik ekleme

- **[MVP] **Give a Shift (Vardiya Sun): personel yapamayacağı vardiyayı havuza koyar

- **[MVP] **Take a Shift (Vardiya Kap): personel açık/sunulmuş vardiyayı üstlenir

- **[Faz 2] **Trade a Shift (Vardiya Takas): iki personel doğrudan vardiya değiştirir

- **[MVP] **Rol bazlı görünürlük: personel yalnızca kendi rolündeki açık vardiyaları görür

- **[MVP] **Onay modu ayarı: Açık / Onay Gerekli / Kapalı (işletme seçer)

- **[MVP] **Personel açık vardiyaya teklif verince yöneticiye bildirim; yönetici kime atayacağını seçer

- **[Faz 2] **Havuz panosu (yönetici): Bekleyen Talepler / Up for Grabs / Takas Talepleri / Benim Takaslarım

### 1.5 Otomatik Çakışma ve İhlal Uyarıları

- **[MVP] **Aynı personel aynı anda iki vardiyaya atandığında uyarı

- **[TR] **İş Kanunu limiti: günlük 11 saat aşımı uyarısı

- **[TR] **İş Kanunu limiti: haftalık 45 saat aşımı uyarısı

- **[TR] **Dinlenme süresi ihlali: iki vardiya arası minimum süre kontrolü

- **[Faz 2] **Onaylı izinli personel vardiyaya atanmaya çalışıldığında uyarı

## Modül 2: Görev ve Operasyon Yönetimi

TaskFlow projesindeki Kanban deneyiminin doğrudan devamı. 7shifts'in 7tasks uygulamasının bütünleşik hali. Kafelerde "vitrini düzenle", "makineyi temizle" gibi günlük görevlerin dijital takibi.

### 2.1 Kanban Görev Panosu

- **[MVP] **Üç sütun: Yapılacak → Devam Ediyor → Tamamlandı (sürükle-bırak)

- **[MVP] **Görev oluşturma: başlık, açıklama, son tarih, öncelik (düşük/orta/yüksek/acil)

- **[MVP] **Göreve atama: kişiye veya pozisyona ("tüm baristalar")

- **[MVP] **Görev kategorileri: Temizlik / Servis / Mutfak / Tedarik / Teknik / Eğitim (özelleştirilebilir)

- **[MVP] **Fotoğraf ve yorum ekleme: tamamlanan göreve kanıt fotoğrafı

- **[MVP] **Görev tamamlanma bildirimi: atayan yöneticiye anlık bildirim

- **[Faz 2] **Tekrarlayan görevler: günlük/haftalık/aylık otomatik oluşturma

### 2.2 Açılış / Kapanış Kontrol Listeleri (Checklist)

- **[MVP] **Özelleştirilebilir dijital checklist — her işletme kendi listesini oluşturur

- Kafe açılış örneği (hazır şablon): espresso makinesi ısındı mı, süt/badem sütü stoğu, vitrin hazırlığı, kasa açılış, ekipman kontrolü

- Kafe kapanış örneği: kasa sayımı, makine temizliği, vitrin buzdolabı, çöp, kapı/kilit kontrolü

- **[Faz 2] **Zorunlu onay: checklist tamamlanmadan vardiya kapatılamaz

- **[MVP] **Tamamlayan kişi ve saat otomatik kayıt altına alınır

- **[MVP] **Yönetici anında tamamlanma raporu görür

- **[Faz 2] **İşletme tipine göre hazır şablon yükleme (kafe/restoran/pastane)

### 2.3 Yönetici Günlüğü (Logbook) ve Vardiya Notları

- **[MVP] **Vardiya Notları (Shift Notes): bir vardiyadan diğerine operasyonel not ("badem sütü bitti, 14:00 rezervasyon")

- **[Faz 2] **Yönetici Günlüğü: her vardiya sonu özet not (şikayet, arıza, günün özeti)

- **[Faz 2] **Log geçmişi tarihsel saklanır ve aranabilir

- **[Faz 3] **Olağanüstü olay kaydı: kaza, müşteri şikayeti, sağlık sorunu

- **[Faz 3] **İşletme sahibine gün sonu özet bildirimi

## Modül 3: Ek Mesai ve Ücret Takibi

Türkiye İş Kanunu'na göre çalışacak; 7shifts'in ABD modelinden buradan ayrışıyoruz. Giriş-çıkış verisinden otomatik mesai hesabı.

### 3.1 Giriş-Çıkış (Time Clock) ve Zaman Takibi

- **[MVP] **QR kod ile giriş-çıkış: personel telefonunu kameraya tutar

- **[MVP] **PIN kodu ile giriş-çıkış: tablet üzerinden (Kiosk Mode)

- **[MVP] **Kiosk Mode: işletmede paylaşılan tablet, merkezi giriş istasyonu

- **[Faz 2] **GPS konum doğrulama: sahte okutmayı önler (işletme konumuna bağlı geofence)

- **[Faz 2] **Fotoğraf doğrulama (opsiyonel): buddy punching önleme

- **[MVP] **Geç giriş / erken çıkış anında yöneticiye bildirim

- **[MVP] **Dijital puantaj: her personelin giriş-çıkış geçmişi zaman damgalı

- **[Faz 2] **Mola takibi: mola başlat/bitir, süre kaydı

- **[MVP] **Günlük çalışma süresi özeti ve haftalık toplam

### 3.2 Mesai Hesaplama

- **[MVP] **Gerçek çalışma saatlerine göre otomatik mesai hesabı

- **[TR] **Haftalık 45 saat üzeri fazla mesai olarak işaretleme (%50 zamlı)

- **[TR] **Gece vardiyası, hafta sonu ve resmi tatil çarpanı tanımlama (işletme bazlı)

- **[TR] **Türkiye resmi tatil takvimi entegre — tatil günü otomatik tanınır

- **[Faz 3] **Prim kuralı tanımlama: satış hedefi aşılırsa ekstra prim

- **[Faz 2] **Fazla mesai eşiği yaklaşınca yöneticiye uyarı (maliyet kontrolü)

- **[MVP] **Mesai özeti: personel başına aylık mesai raporu

### 3.3 Bordro Desteği

- **[Faz 2] **Aylık çalışma süresi ve mesai özetini Excel olarak dışa aktarma

- **[TR] **Muhasebe yazılımı için CSV/JSON export (Logo, Mikro, Paraşüt)

- **[Faz 3] **Brüt maaş tahmini (tanımlı saat ücretiyle)

- **[Faz 3] **İzin ve devamsızlık kesintisi otomatik hesap

## Modül 4: Stok ve Hammadde Takibi

**7shifts****'****te HİÇ olmayan, Shift****'****i farklılaştıran modül. **Kafe için sade tutulur (kahve çekirdeği, süt çeşitleri, şurup, kek/atıştırmalık). Faz 2'de devreye girer.

### 4.1 Stok Yönetimi

- **[Faz 2] **Ürün kataloğu: hammadde, içecek, sarf malzemesi kategorileri

- **[Faz 2] **Gerçek zamanlı stok seviyeleri

- **[Faz 2] **Minimum stok (PAR) seviyesi tanımlama: altına düşünce otomatik uyarı

- **[Faz 2] **Tüketim takibi: günlük/haftalık kullanım trendleri

- **[Faz 2] **Fire kaydı: bozulan, dökülen, SKT geçen ürün kaydı

- **[Faz 2] **Stok sayımı: manuel sayım girişi ve sistem stoğuyla karşılaştırma

- **[Faz 3] **FIFO (İlk Giren İlk Çıkar) takibi ile SKT yönetimi

### 4.2 Envanter Analizi

- **[Faz 3] **En çok tüketilen malzemeler raporu

- **[Faz 3] **Fire oranı takibi ve maliyet analizi

- **[Faz 3] **Stok değeri: anlık envanter maliyeti hesabı

- **[Faz 4] **Mevsimsel tüketim trendi grafikleri

## Modül 5: Tedarik ve Satın Alma Yönetimi

**7shifts****'****te olmayan ikinci farklılaştırıcı modül. **WhatsApp'ta dönen tedarik akışını tamamen dijitalleştirir. Faz 2.

### 5.1 Tedarikçi Yönetimi

- **[Faz 2] **Tedarikçi rehberi: isim, iletişim, ürün kategorisi, teslimat günleri

- **[Faz 2] **Tedarikçi başına ürün listesi ve anlaşmalı fiyatlar

- **[Faz 2] **Tedarikçiye özel sipariş şablonları (haftalık süt/kahve siparişi)

- **[Faz 3] **Tedarikçi performans puanı: teslimat zamanlaması, kalite

- **[Faz 3] **Çoklu tedarikçi kıyaslaması: aynı ürün için fiyat karşılaştırma

### 5.2 Sipariş Yönetimi

- **[Faz 2] **Dijital sipariş oluşturma: ürün, miktar, teslimat tarihi

- **[Faz 2] **Onay akışı: sipariş oluşturulur → yönetici onaylar → tedarikçiye iletilir

- **[Faz 2] **Sipariş durumu: Taslak / Bekliyor / Onaylandı / Yolda / Teslim Edildi

- **[Faz 2] **Tekrarlayan sipariş şablonu: rutin siparişi tek tıkla

- **[Faz 2] **Sipariş geçmişi ve tedarikçi bazlı arşiv

### 5.3 Teslimat ve Fatura Kaydı

- **[Faz 3] **Teslimat doğrulama: sipariş edilen vs. teslim edilen miktar

- **[Faz 3] **Uyumsuzluk kaydı: eksik/hasarlı teslimat bildirimi

- **[TR] **Fatura fotoğrafı yükleme ve kayıt (e-Fatura/e-Arşiv entegrasyonu)

- **[Faz 3] **Aylık tedarikçi bazlı harcama raporu

- **[Faz 3] **Bütçe tanımlama ve harcama aşım uyarısı

## Modül 6: Hijyen, Güvenlik ve Uyum

**Türkiye****'****de yasal zorunluluk (HACCP), 7shifts****'****te tamamen yok. **Restoranlar için müşteri değeri çok yüksek; kafeler için sadeleştirilmiş hali. Faz 3.

### 6.1 Hijyen Kontrol Listeleri

- **[TR] **Günlük dijital hijyen denetimi (HACCP uyumlu): yüzey, el hijyeni, çöp, dolap sıcaklıkları

- **[TR] **Buzdolabı/derin dondurucu sıcaklık kaydı (günde 2 kez zorunlu)

- **[Faz 3] **Ekipman temizlik kaydı: makine, fırın, blender, vitrin

- **[Faz 3] **Haşere kontrol kaydı: ilaçlama tarihleri ve sonuçları

- **[Faz 3] **Fotoğraflı doğrulama: temizlik sonrası fotoğraf yükleme zorunluluğu

### 6.2 Gıda Güvenliği

- **[Faz 3] **SKT takibi: günlük kontrol ve uyarılar

- **[Faz 3] **Çapraz bulaşma riski kaydı (hammadde / pişmiş ürün ayrımı)

- **[Faz 3] **Allerjen kaydı ve menü bazlı allerjen etiketleme

- **[Faz 4] **Gıda zehirlenmesi olay kaydı ve raporlama

### 6.3 Denetim Hazırlığı

- **[TR] **Belediye/sağlık denetimi için otomatik rapor oluşturma

- **[Faz 3] **Tüm kayıtlar tarihsel saklanır, dışa aktarılabilir

- **[Faz 3] **Personel hijyen eğitim kayıtları ve sertifika yükleme

- **[Faz 4] **Yangın söndürücü, ilk yardım kiti kontrolü ve yenileme hatırlatıcısı

## Modül 7: Personel Yönetimi ve İnsan Kaynakları

Personelin dijital dosyası, işe alım ve eğitim. 7shifts'te temel düzeyde var; Shift daha kapsamlı sunar. Faz 3.

### 7.1 Personel Profili

- **[Faz 3] **Dijital personel dosyası: kişisel bilgiler, pozisyon, başlangıç tarihi, saat ücreti

- **[TR] **Belge saklama: kimlik, ikametgah, sözleşme, sağlık raporu, hijyen belgesi

- **[Faz 3] **Sertifika ve eğitim kayıtları

- **[Faz 3] **Performans notları ve yönetici yorumları

### 7.2 İşe Alım ve Onboarding

- **[MVP] **Yeni personel davet linki: e-posta/SMS ile sisteme katılım daveti (kayıt yalnızca davetle)

- **[Faz 3] **Dijital onboarding checklist: işe başlamadan tamamlanacak adımlar

- **[Faz 3] **SOP (Standart Operasyon Prosedürü) doküman kütüphanesi

- **[Faz 4] **Eğitim modülleri: video/metin içerik, tamamlanma takibi

### 7.3 Performans ve İletişim

- **[Faz 3] **Yöneticiden personele geri bildirim notu

- **[Faz 3] **Aylık performans özeti: devamsızlık, geç giriş, tamamlanan görev sayısı

- **[Faz 4] **Ekip takvimi: doğum günleri, önemli tarihler

## Modül 8: İletişim — Mesajlaşma ve Duyurular

**7shifts****'****in ürün omurgasının ikinci yarısı (vardiyadan sonra). **"WhatsApp gruplarını %50 azalt" iddiası buradan gelir. Kafe ekibinin dağınık WhatsApp trafiğini uygulama içine taşır. Çoğu MVP'de olmalı çünkü vardiyayla birlikte değer yaratır.

### 8.1 Mesajlaşma

- **[Faz 2] **İki yönlü mesajlaşma: yönetici-personel birebir

- **[Faz 2] **Ekip/grup mesajlaşma: tüm şube veya belirli pozisyon

- **[Faz 3] **GIF, fotoğraf, emoji desteği (ekip kültürü için)

### 8.2 Duyurular (Announcements)

- **[MVP] **Tek yönlü duyuru: yöneticiden tüm ekibe veya belirli role

- **[Faz 2] **Okundu bilgisi: kimin duyuruyu okuduğunu görme

- **[Faz 3] **Önemli duyuru: onay gerektiren duyuru ("okudum ve anladım")

## Modül 9: Analitik ve Raporlama

İşletme sahibinin karar almasını sağlayan katman. Çoğunlukla Faz 2-3; veri biriktikçe değer kazanır.

### 9.1 İşgücü Analitiği

- **[Faz 2] **Haftalık/aylık çalışma saatleri trendi

- **[Faz 2] **Pozisyon bazlı işgücü maliyeti analizi

- **[Faz 2] **Devamsızlık oranı ve geç giriş istatistikleri (engagement)

- **[Faz 3] **Fazla mesai trendi ve maliyet uyarısı

- **[Faz 3] **En verimli personel raporu (tamamlanan görev sayısına göre)

### 9.2 Operasyon ve Maliyet Analitiği

- **[Faz 3] **Görev tamamlanma oranları: vardiya/personel bazlı

- **[Faz 3] **Açılış/kapanış checklist tamamlanma yüzdesi

- **[Faz 3] **Hijyen denetim skoru trendi

- **[Faz 3] **Tedarikçi bazlı aylık harcama, en maliyetli hammaddeler, fire maliyeti

- **[Faz 3] **Stok devir hızı, bütçe vs. gerçek harcama

### 9.3 Yönetici Dashboard'u

- **[Faz 2] **Günlük özet kartları: bugün kaç personel çalışıyor, bekleyen görev, stok uyarıları

- **[Faz 3] **Haftalık skor kartı: operasyon skoru (görev + hijyen + devamsızlık)

- **[Faz 3] **Çok şubeli görünüm: şubeler arası karşılaştırma

- **[Faz 2] **Raporları PDF/Excel olarak dışa aktarma

## Modül 10: Çok Şube ve Merkezi Yönetim

**Multi-tenancy mimarisinin doğal uzantısı. **Teknik altyapı en baştan buna hazır olmalı (her veri TenantId + BranchId taşır), ancak kullanıcıya dönük özellikler Faz 3'te açılır.

- **[Faz 3] **Şube ekleme/yönetme: her şubenin ayrı konfigürasyonu

- **[Faz 3] **Merkezi yönetici: tüm şubeleri tek ekrandan görür

- **[MVP] **Şube bazlı izolasyon: personel başka şubenin verisini göremez (mimaride MVP'den itibaren)

- **[Faz 3] **Merkezi menü ve SOP yönetimi: tüm şubelere aynı prosedür yayınlama

- **[Faz 3] **Şubeler arası personel transferi ve geçici görevlendirme

- **[Faz 3] **Konsolide raporlama: tüm şubelerin birleşik özeti

## Modül 11: Entegrasyonlar ve Bağlantılar

Dış sistemlerle köprüler. Çoğu Faz 3-4; ancak mimari açık API ile baştan hazır olmalı.

| **Entegrasyon** | **Amaç** | **Öncelik / Faz** |
| --- | --- | --- |
| POS / Adisyon (Restomenum, Menulux, Adisyo) | Satış verisinden işgücü ve stok optimizasyonu | Yüksek · Faz 3 |
| Muhasebe (Logo, Mikro, Paraşüt) | Bordro ve gider verisi aktarımı | Orta · Faz 4 |
| E-Fatura / E-Arşiv | Tedarikçi faturalarının dijital kaydı | Orta · Faz 4 |
| WhatsApp Business API | Sipariş ve vardiya bildirimlerini WhatsApp'a gönderme | Orta · Faz 4 |
| Google / Apple Takvim | Vardiya programını kişisel takvime aktarma | Düşük · Faz 4 |
| Zapier / Webhook (açık API) | Özel entegrasyonlar için açık REST API | Düşük · Faz 4 |

# 5. Bildirim Sistemi Mimarisi

Bildirim sistemi 7shifts'in görünmez omurgasıdır ve Shift için de merkezi öneme sahiptir. Neredeyse her kullanıcı eylemi bir bildirimi tetikler. Bu bölüm hem kanalları hem de hangi olayın hangi bildirimi tetiklediğini tanımlar.

## 5.1 Bildirim Kanalları

- **Push Bildirimi (önerilen)** — Mobil/PWA üzerinden anlık. Firebase Cloud Messaging (FCM) ile. En hızlı ve ücretsiz kanal.

- **E-posta** — Önemli ve kalıcı bildirimler (davet, haftalık program yayını, onay sonuçları).

- **SMS** — Kritik ve zaman duyarlı bildirimler (vardiya hatırlatıcı, acil değişim). Maliyetli olduğu için seçici kullanılır; Türkiye SMS sağlayıcısı (ör. Netgsm, İletimerkezi) entegrasyonu.

**Kullanıcı tercihi: **Her personel hangi olay için hangi kanaldan bildirim alacağını ayarlayabilir (7shifts modeli). Örn: "vardiya değişikliklerini push + e-posta, hatırlatıcıları sadece push al."

## 5.2 Olay → Bildirim Eşlemesi

| **Tetikleyen Olay** | **Bildirim Alan** | **Önerilen Kanal** | **Faz** |
| --- | --- | --- | --- |
| Yeni personel daveti | Davet edilen kişi | E-posta + SMS | MVP |
| Haftalık program yayınlandı | Tüm personel | Push + E-posta | MVP |
| Vardiya değişikliği yapıldı | Etkilenen personel | Push + SMS | MVP |
| Vardiya başlamadan 2 saat önce | İlgili personel | Push | Faz 2 |
| Açık vardiyaya teklif geldi | Yönetici | Push | MVP |
| Vardiya takas/devir talebi | Yönetici + karşı taraf | Push | MVP |
| İzin talebi oluşturuldu | Yönetici | Push + E-posta | MVP |
| İzin onaylandı/reddedildi | Talep eden personel | Push + E-posta | MVP |
| Görev atandı | Atanan personel | Push | MVP |
| Görev tamamlandı | Atayan yönetici | Push | MVP |
| Geç giriş / erken çıkış | Yönetici | Push | MVP |
| Fazla mesai eşiği yaklaştı | Yönetici | Push | Faz 2 |
| Stok PAR seviyesi altına düştü | Yönetici | Push + E-posta | Faz 2 |
| Yeni duyuru yayınlandı | Hedef kitle | Push | MVP |
| Yeni sipariş / sipariş onayı | Tedarikçi / Yönetici | Push + E-posta | Faz 2 |
| Sıcaklık/hijyen kaydı eksik | Yönetici | Push | Faz 3 |

## 5.3 Teknik Yaklaşım

- **Gerçek zamanlı (in-app)** — SignalR ile — uygulama açıkken anlık güncelleme (yeni mesaj, görev güncellemesi, panodaki değişiklik).

- **Zamanlanmış bildirimler** — Hangfire ile — vardiya hatırlatıcıları, tekrarlayan görev oluşturma, gün sonu özetleri gibi zamana bağlı işler.

- **Anlık push** — FCM ile — uygulama kapalıyken bile telefona düşer.

- **Bildirim merkezi (Inbox)** — Uygulama içinde tüm bildirimlerin biriktiği, okundu/okunmadı takipli liste.

# 6. Veri Modeli (Entity Tasarımı)

Bu, en kritik tasarım kararıdır — sonradan değiştirmesi en pahalı kısımdır. Aşağıdaki entity'ler ve ilişkileri en baştan multi-tenant düşünülerek tasarlanmıştır. **Her işletmeye ait entity bir TenantId taşır; şubeye özel olanlar ayrıca BranchId taşır.**

## 6.1 Çekirdek Entity'ler

| **Entity** | **Açıklama** | **Önemli Alanlar / İlişkiler** |
| --- | --- | --- |
| Tenant (İşletme) | En üst kiracı; bir restoran işletmesi/markası | Id, Ad, Tip (kafe/restoran), AktifModüller, Plan, OluşturmaTarihi |
| Branch (Şube) | Bir Tenant'a ait fiziksel şube | Id, TenantId, Ad, Adres, KonumGPS, ÇalışmaSaatleri |
| User (Kullanıcı) | Sistemdeki herkes (sahip/yönetici/personel/tedarikçi) | Id, TenantId, Ad, Eposta, Telefon, ŞifreHash, Durum |
| UserBranch | Kullanıcı-Şube ataması (çoğa-çok) | UserId, BranchId — bir kullanıcı birden fazla şubede olabilir |
| Role / UserRole | Rol tanımı ve kullanıcı-rol ataması | Sahip / Yönetici / AsistanYönetici / Personel / Tedarikçi (çoklu rol mümkün) |
| Position (Pozisyon) | İş pozisyonu (barista, kasiyer...) | Id, TenantId, Ad, RenkKodu, SaatÜcreti |

## 6.2 Vardiya ve Zaman Entity'leri

| **Entity** | **Açıklama** | **Önemli Alanlar / İlişkiler** |
| --- | --- | --- |
| Shift (Vardiya) | Tek bir vardiya kaydı | Id, TenantId, BranchId, UserId(nullable=açık vardiya), PositionId, Başlangıç, Bitiş, Durum, Notlar |
| ShiftTemplate | Haftalık rutin şablon | Id, TenantId, BranchId, Ad, ŞablonVardiyalar(JSON) |
| Availability (Müsaitlik) | Tekrar eden müsaitlik profili | Id, UserId, HaftaGünü, BaşlangıçSaat, BitişSaat, Tip(müsait/değil) |
| TimeOffRequest (İzin) | Tek seferlik izin talebi | Id, UserId, BaşlangıçTarih, BitişTarih, İzinTipi, Gerekçe, Durum, OnaylayanId |
| ShiftSwap (Takas/Havuz) | Vardiya değişim/devir/kapma kaydı | Id, ShiftId, TalepEdenId, HedefId(nullable), Tip(sun/kap/takas), Durum |
| TimeClock (Puantaj) | Giriş-çıkış kaydı | Id, UserId, BranchId, GirişZamanı, ÇıkışZamanı, Yöntem(QR/PIN), GPS, Doğrulandı |
| OvertimeRecord | Hesaplanmış mesai kaydı | Id, UserId, Dönem, NormalSaat, FazlaMesaiSaat, Çarpan, Tutar |

## 6.3 Operasyon Entity'leri

| **Entity** | **Açıklama** | **Önemli Alanlar / İlişkiler** |
| --- | --- | --- |
| Task (Görev) | Kanban görevi | Id, TenantId, BranchId, Başlık, Açıklama, AtananId/PozisyonId, Durum, Öncelik, SonTarih, Kategori |
| TaskComment | Göreve yorum | Id, TaskId, YazarId, İçerik, FotoğrafUrl, Tarih |
| Checklist | Açılış/kapanış kontrol listesi şablonu | Id, TenantId, BranchId, Ad, Tip(açılış/kapanış), Maddeler |
| ChecklistRun | Doldurulmuş checklist örneği | Id, ChecklistId, ShiftId, TamamlayanId, Tarih, MaddeDurumları, Fotoğraflar |
| ShiftNote / LogEntry | Vardiya notu / yönetici günlüğü | Id, BranchId, YazarId, İçerik, Tip, Tarih |
| Announcement (Duyuru) | Tek yönlü duyuru | Id, TenantId, GönderenId, HedefRol/Şube, İçerik, OkuyanlarListesi |
| Message (Mesaj) | İki yönlü mesaj | Id, GönderenId, AlıcıId/GrupId, İçerik, Tarih, Okundu |
| Notification | Bildirim kaydı | Id, UserId, Tip, İçerik, Kanal, Okundu, Tarih |

## 6.4 Stok, Tedarik, Hijyen Entity'leri (Faz 2-3)

| **Entity** | **Açıklama** | **Önemli Alanlar / İlişkiler** |
| --- | --- | --- |
| Product (Ürün/Hammadde) | Stok kalemi | Id, TenantId, Ad, Kategori, Birim, MevcutMiktar, PARSeviye, BirimMaliyet |
| StockMovement | Stok hareketi (giriş/çıkış/fire) | Id, ProductId, Tip, Miktar, Tarih, Sebep, KullanıcıId |
| Supplier (Tedarikçi) | Tedarikçi kaydı | Id, TenantId, Ad, İletişim, Kategori, TeslimatGünleri, PerformansPuanı |
| PurchaseOrder (Sipariş) | Satın alma siparişi | Id, TenantId, SupplierId, Durum, Kalemler, ToplamTutar, TeslimatTarihi |
| Delivery / Invoice | Teslimat ve fatura kaydı | Id, PurchaseOrderId, TeslimMiktarları, FaturaFotoğraf, Uyumsuzluk |
| HygieneCheck | Hijyen denetim kaydı | Id, BranchId, Tip, Maddeler, Sıcaklıklar, Fotoğraflar, TamamlayanId, Tarih |
| Document | Personel/işletme belgesi | Id, UserId/TenantId, Tip, DosyaUrl, SKT, YüklemeTarihi |

# 7. Multi-Tenancy Mimarisi

Shift'in en kritik mimari kararı. Tüm işletmeler aynı veritabanını ve uygulamayı paylaşır, ancak hiçbiri diğerinin verisini göremez. **Yaklaşım: tek veritabanı + paylaşımlı şema + TenantId kolonu (shared database, shared schema).** Bu, küçük/orta SaaS için maliyet ve sürdürülebilirlik açısından sektör standardıdır.

## 7.1 Neden Bu Yaklaşım?

| **Yaklaşım** | **İzolasyon** | **Karmaşıklık** | **Shift için** |
| --- | --- | --- | --- |
| Database-per-tenant | En güçlü | Çok yüksek (N veritabanı) | Hayır |
| Schema-per-tenant | Güçlü | Yüksek | Hayır |
| Shared DB + TenantId | Yeterli | Düşük | **EVET** |

Kafe/restoran SaaS'ı sağlık sektörü gibi ağır izolasyon gerektirmez. TenantId yaklaşımı yeterli güvenliği en düşük karmaşıklıkla sağlar.

## 7.2 Üç Temel Mekanizma

Multi-tenancy üç parçanın birlikte çalışmasıyla uygulanır:

#### 1) ITenantEntity arayüzü

Tenant'a ait her entity bu arayüzü uygular; böylece filtreleme tek noktadan, tutarlı uygulanır.

public interface ITenantEntity

{

    Guid TenantId { get; set; }

}

#### 2) Global Query Filter (otomatik okuma filtresi)

EF Core 10'un **global query filter** özelliğiyle, her sorguya otomatik olarak "WHERE TenantId = currentTenant" eklenir. Geliştirici her sorguda tenant kontrolü yazmayı unutsa bile veri sızmaz.

// OnModelCreating içinde, ITenantEntity uygulayan tüm entity'ler için:

modelBuilder.Entity<T>().HasQueryFilter(

    e => e.TenantId == _tenantProvider.TenantId);

**EF Core 10 avantajı: **Named query filters özelliği sayesinde aynı entity'ye hem tenant hem soft-delete filtresi ayrı ayrı tanımlanabilir; gerektiğinde biri seçici olarak kapatılabilir (IgnoreQueryFilters). Eski EF'te bu mümkün değildi.

#### 3) SaveChanges Interceptor (otomatik damgalama)

Yeni kayıt eklenirken TenantId otomatik atanır; geliştirici elle set etmeyi unutsa bile veri doğru tenant'a yazılır.

// SaveChanges sırasında eklenen ITenantEntity kayıtlarına:

entry.Entity.TenantId = _tenantProvider.TenantId;

## 7.3 TenantId Nereden Gelir?

TaskFlow'daki IDOR koruması mantığının aynısı: TenantId asla client'tan gelmez. Kullanıcı login olurken üretilen JWT'nin içine bir **tenant claim**'i gömülür. Her istekte bir ITenantProvider servisi bu claim'i okur ve EF Core'a verir. Böylece bir kullanıcı başka tenant'ın verisini isteyemez — token'ı buna izin vermez.

**İki seviyeli kapsam: **TenantId işletme seviyesinde izolasyonu, BranchId şube seviyesinde kapsamı sağlar. Personel kendi şubesini görür; sahip tüm şubeleri görür. Başlangıçta TenantId ile başla, BranchId kapsamını hemen ardından ekle.

# 8. Kimlik Doğrulama ve Yetkilendirme

TaskFlow'daki basit JWT'nin üzerine inşa edilir, iki önemli ekleme ile: **refresh token rotasyonu** ve **davet tabanlı kayıt.**

## 8.1 Token Stratejisi

- **Access Token (JWT)** — Kısa ömürlü (5–15 dakika). İçinde UserId, TenantId, roller claim olarak bulunur. Çalınsa bile zararı sınırlı.

- **Refresh Token** — Uzun ömürlü, veritabanında hash'lenmiş saklanır, döndürülebilir (rotate). Access token süresi dolunca sessizce yenisini alır.

- **Rotasyon** — Her kullanımda yeni refresh token üretilir, eskisi geçersiz kılınır — replay saldırısına karşı koruma.

- **Saklama** — Refresh token mümkünse HttpOnly + Secure cookie'de; localStorage'dan kaçınılır (XSS koruması).

## 8.2 Yetki Katmanları

- **Rol bazlı (RBAC)** — [Authorize(Roles = "Manager")] gibi — kaba erişim. Endpoint seviyesinde.

- **Kaynak bazlı (Resource-based)** — Handler içinde: "bu kullanıcı bu kaynağın sahibi/ilgilisi mi?" — ince erişim. TaskFlow'dan gelen mantık.

- **Kapsam (Scope)** — Multi-tenancy + BranchId: kullanıcı yalnızca yetkili olduğu şube verisini görür.

## 8.3 Davet Tabanlı Kayıt (7shifts modeli)

- Yönetici/sahip yeni personeli e-posta veya telefonla davet eder.

- Sisteme benzersiz davet linki/kodu gönderilir.

- Personel linke tıklar, şifresini belirler, hesabı aktifleşir — doğru TenantId ile.

- Personel kendi başına yeni hesap OLUŞTURAMAZ. Bu, multi-tenant güvenliğin temelidir.

**İstisna: **Yeni bir işletme sahibi ilk kez kaydolduğunda yeni bir Tenant yaratır (sahip akışı). Sonraki tüm kullanıcılar davetle gelir.

# 9. API Sözleşmesi ve Ekip İş Bölümü

Backend (Berke) ve Frontend (ekip arkadaşı) arasındaki buluşma noktası API sözleşmesidir. Sen endpoint'leri tanımlarsın; arkadaşın onları çağırıp ekrana çizer. İkiniz bu sözleşme üzerinden senkron çalışırsınız.

## 9.1 İş Bölümü

| **Backend (Berke)** | **Frontend (Ekip Arkadaşı)** |
| --- | --- |
| .NET 10 Web API — iş mantığı, veri | React (Next.js) — web uygulaması |
| Multi-tenancy, auth, yetki | Vardiya çizelgesi sürükle-bırak UI |
| Vardiya/mesai/stok hesaplama kuralları | Görev panosu, giriş-çıkış ekranı |
| Endpoint'ler + Scalar dokümantasyonu | PWA (telefonda uygulama gibi çalışma) |
| SignalR, Hangfire, FCM, veritabanı | API'ye HttpClient ile bağlanma |

## 9.2 Çalışma Prensipleri

- **API sözleşmesini önden konuşun** — Kod yazmadan önce "vardiya objesi neye benziyor, hangi formatta dönecek" netleştirilir. Yarım saatlik konuşma, haftalarca senkron tutar.

- **Scalar dokümantasyonu ortak dil** — Backend endpoint'i yazınca Scalar otomatik dokümante eder; frontend ona bakıp kendi tarafını yazar.

- **Dikey dilim yaklaşımı** — "Önce tüm backend, sonra tüm frontend" YAPMAYIN. Tek özelliği (örn. login + vardiya listesi) baştan sona birlikte bitirin, sonra sonrakine geçin.

- **Git branch disiplini** — main'e doğrudan yazmayın. Herkes feature branch açar, Pull Request ile birleştirir. Merge conflict'leri önler.

- **Sıralama** — Berke önce temeli kurar (multi-tenancy + auth + ilk endpoint'ler + Scalar). Arkadaşı hazır API sözleşmesiyle sonradan dahil olur.

## 9.3 Platform Stratejisi

- **Web uygulaması** — Ana platform. Tarayıcıdan açılan, yöneticinin iş yaptığı yer. (exe/masaüstü program YOK.)

- **PWA (Progressive Web App)** — Başlangıçta mobil için doğru yol. Web uygulaması telefonda "ana ekrana ekle" ile uygulama gibi çalışır. Tek kod tabanı, store onayı yok.

- **Native mobil uygulama** — Sonraya bırakılır. Gerçek müşteri "illa store'da olsun" deyince eklenir. İki kişilik ekip için başta gereksiz yük.

# 10. Teknik Altyapı

TaskFlow'da kullanılan ve kanıtlanmış stack'in Shift'e uyarlanmış hali. .NET 10 LTS (Kasım 2028'e kadar destekli) temel alınır.

## 10.1 Backend

- **Dil/Framework** — .NET 10, ASP.NET Core Web API

- **Mimari** — Clean Architecture (Domain / Application / Infrastructure / API) — TaskFlow'dan taşınır

- **Pattern** — CQRS + MediatR, Repository Pattern, FluentValidation, AutoMapper

- **Veritabanı** — PostgreSQL (ana), Redis (cache ve oturum)

- **Auth** — JWT + Refresh Token (rotasyonlu), rol + kaynak bazlı yetkilendirme

- **Gerçek zamanlı** — SignalR (anlık bildirim ve görev güncellemeleri)

- **Zamanlanmış işler** — Hangfire (hatırlatıcılar, raporlar, tekrarlayan görevler)

- **Dosya saklama** — AWS S3 veya Cloudflare R2 (belge, fotoğraf)

- **Push bildirim** — Firebase Cloud Messaging (FCM)

- **API dokümantasyonu** — Scalar (TaskFlow'dan; ekip iletişiminin ortak dili)

## 10.2 Frontend

- **Web** — React (Next.js), TypeScript, Tailwind CSS

- **Mobil** — Başta PWA; sonra gerekirse React Native (iOS + Android tek kod tabanı)

## 10.3 Altyapı ve Deployment

- **Container** — Docker + Docker Compose (geliştirme), Kubernetes (prodüksiyon, sonraki aşama)

- **CI/CD** — GitHub Actions

- **Cloud** — Hetzner (Avrupa veri merkezi — KVKK uyumu)

- **Monitoring** — Sentry (hata), Grafana (metrik), Seq (log)

# 11. Geliştirme Yol Haritası

Geliştirme fazlara bölünmüştür; her faz öncekinin üzerine inşa edilir. Faz 1 (MVP) çıkışında kafelere demo gösterilip pilot başlatılabilir.

## 11.1 Faz 0: Temel Altyapı (Berke, yalnız — Hafta 1-3)

Arkadaşı dahil olmadan önce Berke'nin kuracağı zemin. Tek kişilik çalışıldığı için git/koordinasyon derdi olmadan öğrenme fırsatı.

- Solution iskeleti: 4 katman (Domain/Application/Infrastructure/API) + paketler

- Multi-tenancy çekirdeği: ITenantEntity, global query filter, SaveChanges interceptor, ITenantProvider

- Auth: register (sahip akışı) + login + refresh token, JWT'ye TenantId claim'i

- İzolasyon testi: iki tenant, birinin diğerini göremediğini doğrulayan test

- İlk endpoint'ler + Scalar dokümantasyonu (arkadaşı için hazır API sözleşmesi)

## 11.2 Faz 1: MVP — Çekirdek Operasyon (Ay 1-4)

| **Özellik** | **Modül** | **Neden Kritik** |
| --- | --- | --- |
| Vardiya planlama (drag-drop) | M1 | İlk "vay be" — demo'nun kalbi |
| Müsaitlik + İzin yönetimi | M1 | Vardiya planının doğru çalışması için |
| Vardiya havuzu (sun/kap) | M1 | Kafelerde part-time esnekliği |
| Giriş-çıkış (QR + PIN + Kiosk) | M3 | Mesai hesabının temeli |
| Mesai hesaplama (İş Kanunu) | M3 | Türkiye farklılaşması |
| Kanban görev panosu | M2 | TaskFlow deneyiminin devamı |
| Açılış/kapanış checklist | M2 | Operasyon disiplini, kafe şablonu |
| Vardiya notları | M2 | Ekip içi süreklilik |
| Duyuru + temel bildirim | M8/M5 | İletişim omurgası |
| Davet tabanlı kayıt | M7 | Güvenli onboarding |
| Mobil PWA | M10 | Personel deneyimi |

## 11.3 Faz 2: Stok, Tedarik, İletişim (Ay 5-8)

- Stok takibi + PAR seviye uyarısı (kafe için sade)

- Tedarikçi rehberi + dijital sipariş ve onay akışı

- İki yönlü mesajlaşma + okundu bilgisi

- Temel analitik dashboard + dışa aktarma

- GPS/fotoğraf doğrulama, mola takibi, vardiya hatırlatıcıları

## 11.4 Faz 3: Hijyen, İK, Çok Şube, Analitik (Ay 9-14)

- Hijyen checklist + HACCP kayıtları + denetim raporu

- Personel profili + belge saklama + onboarding/SOP

- Çok şube yönetimi (UI katmanı; mimari zaten hazır)

- Gelişmiş analitik: işgücü, operasyon, maliyet

- POS entegrasyonu (Restomenum vb.)

## 11.5 Faz 4: AI ve Gelişmiş Özellikler (Ay 15+)

- Otomatik vardiya önerisi (geçmiş veri + yoğunluk tahmini)

- Stok tüketim tahmini ve otomatik sipariş önerisi

- Muhasebe entegrasyonu (Logo, Mikro), WhatsApp Business API

- Tedarikçi portalı → uzun vadede marketplace vizyonu

# 12. Kritik Başarı Faktörleri

## 12.1 Ürün Prensipleri

- **Derinlik ****>**** Genişlik** — Önce çekirdeği (vardiya + görev + iletişim) kusursuz yap. 11 modülü yarım yapmaktansa 4 modülü mükemmel yap. 7shifts bu yüzden kazandı.

- **Kullanım kolaylığı** — Teknolojiye uzak yöneticiler 10 dakikada kullanmaya başlamalı.

- **Mobil öncelik** — En kritik işlemler telefon ekranında yapılabilmeli.

- **Türkiye****'****ye özgü uyum** — İş Kanunu, HACCP, KVKK, yerel POS/muhasebe — bunlar rakiplerin kopyalayamayacağı kazanan kartlar.

- **Esneklik motoru, makul varsayılanlar** — Her şeyi baştan ayarlanabilir yapma; kafe için çalışan tek senaryoyu bitir, esnekliği gerçek müşteri talebiyle ekle.

- **Offline çalışma** — İnternet kesilse de temel işlemler (giriş-çıkış, görev görme) çalışmalı.

## 12.2 Müşteri Edinimi

- **İçeriden avantaj** — Berke'nin 5 aylık barista deneyimi — açılış/kapanış akışı, vardiya dinamiği, gerçek operasyonel acılar birinci elden biliniyor. Bu, masabaşı tahminin yapamayacağı kalibrasyon sağlar.

- **Sıcak ilk müşteri** — Eski çalışılan kafe/tanıdıklar — soğuk kapı çalmaktan çok daha kolay ilk pilot.

- **Ücretsiz pilot** — İlk 3-5 tanıdık kafede ücretsiz pilot; haftalık geri bildirim toplantısı.

- **Net bitiş çizgisi** — "Bir noktaya getirip kapı çalacağım" hedefi: Faz 1 MVP (vardiya + giriş-çıkış + checklist + görev + duyuru) çalışır olunca demo'ya çık. Bu çizgi belirsizliğe kaçmayı önler.

- **Sosyal kanıt + içerik** — Pilot referansları ile yayılma; "kafe yönetiminde 10 yaygın hata" gibi içeriklerle organik büyüme.

## 12.3 Fiyatlandırma (referans)

| **Plan** | **Aylık (Şube)** | **Kullanıcı** | **Kapsam** |
| --- | --- | --- | --- |
| Başlangıç | 499 TL | 1–10 | Vardiya, Görev, Checklist, Giriş-Çıkış, Duyuru |
| Büyüme | 999 TL | 1–30 | + Stok, Tedarik, Mesai, Mesajlaşma, Raporlar |
| Pro | 1.799 TL | Sınırsız | + Hijyen, İK, Çok Şube, Entegrasyonlar |
| Enterprise | Özel | Sınırsız | + AI, SLA, özel entegrasyon, öncelikli destek |

*Gelir senaryosu: 1.000 müşteri × ortalama 900 TL/ay = aylık yinelenen gelir 900.000 TL.*

**— SHIFT — Restoran ve Kafe Operasyonunu Dijitalleştir —**

Sayfa  /