# Gün 48 — KVKK Aydınlatma Metni + Açık Rıza Kutusu (Deploy'un Yasal Önkoşulu)

**Kapsam:** Canlıya geçişin yasal önkoşulu (#P2) iki parçayla kapandı: (1) marketing sitesinde
yayınlanmış KVKK aydınlatma metni sayfası (`/kvkk`), (2) panelde register + davet-kabul
ekranlarında rıza kutusu — işaretlenmeden submit backend'e gitmez. Saf FE turu: backend'e sıfır
dokunuş, migration yok, test yok. Branch: `feat/kvkk-aydinlatma-riza`.

> **⚠️ HUKUKİ ŞART — bu turun en önemli çıktısı kod değil, bu cümle:** Üretilen KVKK metni
> **taslak şablondur, hukuki tavsiye değildir.** Placeholder'lar (`[VERİ SORUMLUSU UNVANI]`,
> `[ADRES]`, `[İLETİŞİM E-POSTA]`, `[VERBİS NO]`) Berke tarafından doldurulacak; **gerçek ödeyen
> müşteriden önce bir avukat/KVKK danışmanı metni onaylamalı.** Sayfanın üstündeki görünür
> "Bu metin taslaktır" notu ancak avukat onayından sonra kaldırılır.

---

## 1. Karar — rıza kutusu neden YALNIZ register ve davet-kabul ekranlarında?

KVKK'da aydınlatma ve rıza, kişisel verinin **toplandığı anda** gerekir. Uygulamada veri iki
kapıdan girer:

- **Register:** işletme sahibi ilk kez ad-soyad + e-posta verir → yeni veri toplama anı.
- **Davet kabulü:** personelin hesabı ilk kez aktifleşir, şifresini belirler → personelin
  platformla ilk hukuki teması.

Login, şifremi-unuttum ve şifre-sıfırla ekranlarına kutu **bilinçli olarak eklenmedi**: bunlar
zaten toplanmış veriyle yapılan tekrar eden işlemlerdir, yeni veri toplamazlar. Her ekrana kutu
koymak hem hukuken gereksiz hem UX açısından "rıza yorgunluğu" yaratır — kullanıcı okumadan
işaretlemeye alışır, asıl gereken yerde rızanın değeri düşer.

> [!question] Mülakat Sorusu 1 — **"KVKK rıza kutusunu hangi ekranlara koyarsın, neden?"**
> Cevap: Kişisel verinin İLK toplandığı yerlere — kayıt ve davet kabulü. Login/şifre-sıfırlama
> yeni veri toplamaz; oralara kutu koymak hukuki gereklilik değil, rıza yorgunluğu üretir.
> Ek nokta: rıza her zaman tek hukuki dayanak da değildir — vardiya/mesai kayıtları çoğunlukla
> "sözleşmenin ifası" ve "hukuki yükümlülük" (İş Kanunu) dayanağıyla işlenir; açık rıza
> "gereken yerlerde" devreye girer (KVKK m.5).

## 2. Kavram — client-side gate ≠ kalıcı rıza kanıtı (#kvkk-kalici-riza-kaniti)

Bu turda yapılan şey bir **client-side gate**: `consent` state'i işaretlenmeden `onSubmit`
validasyonu hata döndürür, `fetch` hiç çalışmaz. Canlı doğrulamada ağ sekmesi bunu kanıtladı —
kutu işaretsizken `/api/auth/register`'a istek YOK.

Ama bu, KVKK'nın **ispat yükünü** karşılamaz. "Kullanıcı rıza verdi" iddiasını ileride
kanıtlamak için onayın kendisinin — tarih + metin versiyonu + (tercihen) IP ile — sunucuda
kalıcı kaydı gerekir (`User.ConsentedAt` veya ayrı `ConsentLog` tablosu). Şu an backend'e
`consent` alanı gönderilmiyor bile; kutu yalnız istemciyi durduruyor.

**Neden yine de bu sırayla?** Pilot için "metin yayınlanmış + kutu zorunlu" yeterli savunma;
kalıcı kanıt bir backend turu (kolon + migration + DTO değişikliği) ve deploy-blocker değil.
Borç açıkça notlandı: **#kvkk-kalici-riza-kaniti** — gerçek ödeyen müşteriden önce kapanmalı.

> [!question] Mülakat Sorusu 2 — **"Checkbox'ı zorunlu yaptın; rıza ispatı için yeterli mi?"**
> Cevap: Hayır. Client-side gate yalnız akışı durdurur; DOM'dan/DevTools'tan aşılabilir ve
> geriye iz bırakmaz. İspat için sunucu tarafında zaman damgalı, metin-versiyonlu rıza kaydı
> gerekir. Doğru mimari iki katman: UX katmanı (kutu, gate) + kanıt katmanı (ConsentLog).
> Bugün ilki var, ikincisi bilinçli borç.

## 3. Kavram — cross-origin link: MARKETING_URL neden env'den geliyor?

Panel (`web/`, deploy'da `app.`) ile marketing sitesi (`marketing/`, deploy'da `www.`) **ayrı
origin'ler**. KVKK metni halka açık sitede yayınlanır (footer'dan erişilir, login gerektirmez);
paneldeki rıza kutusu oraya link verir. `<a href="/kvkk">` yazılsaydı link panelin kendi
origin'inde çözülür ve 404 olurdu; `http://localhost:3001` hardcode edilseydi prod'da kırılırdı.

Çözüm marketing tarafındaki mevcut desenin aynası: marketing → panel linkleri nasıl tek
`APP_URL` sabitinden türüyorsa (`marketing/lib/config.ts`), panel → marketing linki de yeni
`web/lib/config.ts` içindeki `MARKETING_URL`'den türer:
`process.env.NEXT_PUBLIC_MARKETING_URL ?? "http://localhost:3001"`. Deploy turunda (#P3) yalnız
env değeri değişir, bileşenlere dokunulmaz. `NEXT_PUBLIC_` öneki şart — değer tarayıcıya
gidiyor (checkbox client component'te render ediliyor).

> [!question] Mülakat Sorusu 3 — **"İki ayrı Next.js uygulaması birbirine nasıl link verir?"**
> Cevap: Relative path aynı origin'de çözülür, cross-origin'de kırılır. Karşı uygulamanın kök
> URL'i env-driven tek sabitten türetilir (12-factor config); dev fallback localhost portu,
> prod'da gerçek domain. Tarayıcıda kullanılacaksa Next'te `NEXT_PUBLIC_` öneki gerekir —
> önek build sırasında değeri bundle'a gömer.

## 4. İçerik kararları — iki-marka kuralı ve taslak notu

- Metinde **hiçbir üçüncü firma adı yok** — barındırma bile "Avrupa Birliği sınırları içindeki
  veri merkezleri" diye anlatıldı. Tedarikçi adı vermek hem pazarlama dilini bozar hem tedarikçi
  değişiminde metni bayatlatır.
- "Gizlilik" footer linki ayrı sayfa açmak yerine `/kvkk`'e bağlandı — pilot için tek yasal
  metin yönetmek yeterli; ayrı gizlilik politikası **#gizlilik-ayri-sayfa** (Faz 2).
- Sayfa mevcut marketing desenine oturdu (`/fiyatlar` kapsayıcı/tipografisi): eyebrow + display
  başlık + `max-w-3xl` içerik; taslak uyarısı krem kutuda, görünür.

## 5. Doğrulama (canlı, iki uygulama birden)

- `/kvkk` render ✓ — 7 başlık, placeholder'lar olduğu gibi, görünür taslak notu.
- Footer "KVKK Aydınlatma" + "Gizlilik" → `/kvkk` ✓ (artık `#` değil).
- Register: kutu işaretsiz + form dolu → kırmızı uyarı, ağda `/api/auth/register` isteği YOK ✓;
  kutu işaretli → kayıt geçti, `/onboarding`'e yönlendi ✓.
- Davet: işaretsiz → aynı uyarı ✓; işaretli → istek backend'e ulaştı (sahte token backend'in
  kendi hatasıyla döndü — gate'in açıldığının kanıtı, veri değişmedi) ✓.
- `npm run build` → `web/` + `marketing/` ikisi de temiz ✓.

## Açık borçlar
- **#kvkk-kalici-riza-kaniti** — rıza kaydı DB'de tutulmuyor (tarih+versiyon+IP); backend turu,
  gerçek müşteriden önce şart.
- **#kvkk-hukuki-onay** — metin taslak; avukat/KVKK danışmanı onayı gerçek müşteriden önce şart.
- **#gizlilik-ayri-sayfa** — ayrı gizlilik politikası Faz 2; şimdilik `/kvkk`'e yönleniyor.
