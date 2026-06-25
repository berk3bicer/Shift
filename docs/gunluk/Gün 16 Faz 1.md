# Shift — Gün 16: Açılış/Kapanış Kontrol Listeleri (Şablon vs Çalıştırma)

> [!info] Bugünün hedefi Spec Modül 2.2 "Açılış / Kapanış Kontrol Listeleri" — özelleştirilebilir dijital checklist, tamamlayan kişi+saat otomatik kaydı, yönetici tamamlanma raporu. Asıl tasarım: **şablon (tanım) vs çalıştırma (doldurulmuş örnek)** ayrımı + start anında **snapshot**. Tekrar eden görev / fotoğraf gibi parçalar gibi, şablon düzenleme ve "vardiya kapatma guard'ı" bilinçli ertelendi.

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 16 %100 tamamlandı — 71/71 test yeşil

---

## 1. Çekirdek Ayrım: Şablon (definition) vs Çalıştırma (instance)

Bir kontrol listesinin iki ayrı yaşamı var ve bunları **iki ayrı varlık (aggregate)** olarak modelledik:

**Tanım katmanı — bir kez kurulur, tekrar kullanılır:**
- `Checklist` (şablon): "Açılış Listesi", tür (Açılış/Kapanış), ad, IsActive. **Tenant seviyesi** — işletme bir kez tanımlar, her şube aynı listeyi çalıştırır.
- `ChecklistItem` (şablon maddesi): "Dolap sıcaklıkları kontrol edildi", sıra. Şablona Cascade.

**Çalıştırma katmanı — her gün/vardiya doldurulur:**
- `ChecklistRun` (doldurulmuş örnek): hangi şube, hangi gün, hangi şablondan. Tamamlanma damgası.
- `ChecklistRunItem` (doldurulmuş madde): metin (**snapshot**), işaretli mi, kim/ne zaman işaretledi.

Bu ayrım her yerde karşına çıkar: form şablonu vs doldurulmuş form, ürün tanımı vs sipariş kalemi, recurring kural vs occurrence. "Bugünün listesi"ni tek seferlik bir kayıt olarak tutsaydık, her gün şablonu elle kopyalardık ve şablonu değiştirmek geçmişi bozardı. Tanımı bir kez, örneği her seferinde.

> [!question] Mülakat Sorusu **"Şablon ile onun doldurulmuş hâlini neden ayrı entity yaparsın?"** Cevap: İki farklı yaşam döngüsü ve değişim hızı vardır. Tanım nadiren değişir, yeniden kullanılır; örnek her olayda bir kez doğar, doldurulur, donar. Tek tabloda birleştirmek ya tanımı çoğaltmaya (her gün kopya) ya da geçmiş örnekleri tanım değişince bozmaya yol açar. Ayırınca: tanımı düzenlersin, geçmiş örnekler kendi anlık kopyalarıyla sağlam kalır.

---

## 2. Snapshot: Start Anında Donan Madde Metni

`ChecklistRunItem.Text`, çalıştırma başlatılırken şablon maddesinden **kopyalanır** — referans değil, kopya. Şablon sonradan "Dolap" → "Buzdolabı" diye düzenlense bile dünkü çalıştırma "Dolap" olarak kalır.

Neden kritik: tamamlanmış bir kontrol listesi bir **kanıt belgesidir** (denetim, HACCP). "O gün tam olarak neyi kontrol ettin?" sorusunun cevabı, bugünün şablonuna değil, o günkü çalıştırmanın donmuş metnine bakılarak verilir. Bu, Gün 11 (saat), Gün 13 (ücret), Gün 14 (prim) snapshot'larının aynı felsefesi: **bir karara/kayda temel olan girdiler, o an dondurulur.**

```
Checklist.Item.Text = "Dolap..."  ──(start: kopyala)──►  Run.Item.Text = "Dolap..." [DONMUŞ]
        │                                                        ▲
        └─ sonra "Buzdolabı" olur ──────(etkilemez)──────────────┘
```

Test 2 bunu çiviliyor: çalıştırma başlatıldıktan sonra şablon maddesi değiştirilir, çalıştırmanın metni eski hâlinde kalır.

> [!question] Mülakat Sorusu **"Bir örnek (instance) tanımına referansla mı bağlanmalı, yoksa tanımı kopyalamalı mı?"** Cevap: Örnek bir kayıt/kanıt ise ve tanım zamanla değişebiliyorsa → kopyala (snapshot). Referans tutarsan, tanım değişince geçmiş örneklerin anlamı geriye dönük kayar. Canlı/güncel olması gereken durumlarda (ör. fiyat her zaman güncel olsun) referans doğru olabilir; ama denetlenebilir geçmiş için snapshot şarttır.

---

## 3. Otomatik Tamamlanma + Reopen Simetrisi (Kanban'la Aynı Mantık)

`CheckChecklistItem` çekirdek aksiyon. İki seviyeli yan etki:

**Madde seviyesi:** işaretlenince `CheckedByUserId`(token) + `CheckedAt` damgalanır (spec: "Tamamlayan kişi ve saat otomatik"). İşaret kaldırılınca ikisi de temizlenir.

**Çalıştırma seviyesi (türetilmiş):** her işaretlemeden sonra "tüm maddeler işaretli mi?" hesaplanır:
- Hepsi işaretli + henüz tamamlanmamış → `CompletedAt` + `CompletedByUserId` otomatik damgalanır.
- Hepsi işaretli değil + tamamlanmış → tamamlanma **geri alınır** (bir madde sökülmüş).

Bu, Gün 15 Kanban'daki "Done'a giriş/çıkış simetrisi"nin aynısı: bir duruma girerken set ettiğin alanı, o durumdan çıkarken geri al. Tamamlanma, maddelerden **türetilen** bir durumdur — bağımsız set edilmez, her zaman maddelerin gerçeğinden hesaplanır. Böylece "tamamlandı ama bir madde boş" tutarsızlığı imkânsız.

> [!important] Türetilmiş durumu elle set etme, hesapla `CompletedAt`'i ayrı bir "tamamla" butonuyla elle set etseydik, maddelerle senkronu kopabilirdi. Bunun yerine her madde değişiminde maddelerin toplamından türetiyoruz. Türetilmiş durum tek bir gerçek kaynağından (maddeler) akar → çelişki olamaz.

> [!question] Mülakat Sorusu **"'Tümü tamamlandı' gibi bir bayrağı nasıl tutarsın — ayrı alan mı, türetme mi?"** Cevap: Mümkünse alt-öğelerden türetirim ve her değişimde yeniden hesaplarım; bağımsız bir bayrak alt-öğelerle senkronizasyon riski taşır (biri güncellenir, bayrak unutulur). Performans için snapshot/cache gerekiyorsa bile, kaynağı alt-öğeler olur ve giriş kadar çıkışı da (geri alma) ele alınır.

---

## 4. Tenant Seviyesi Şablon, Şube Seviyesi Çalıştırma

Şablon `TenantId` taşır (BranchId yok) — "her işletme kendi listesini oluşturur" (spec). Çalıştırma `BranchId` taşır — açılış bir şubede yapılır. Böylece tek bir "Açılış Listesi" tanımı, üç şubenin üçünde de her sabah ayrı bir çalıştırma üretir. Çok-şubeli farklılaşma (şubeye özel liste) gerçek ihtiyaç doğunca eklenir — şimdilik YAGNI.

Tekillik: `(BranchId, ChecklistId, RunDate)` unique index — "bir günde iki açılış" engellenir, hem DB'de hem handler'da erken hata.

---

## 5. Aggregate-Child'da Tenant İzolasyonu (EF Tuzağı)

`ChecklistItem` ve `ChecklistRunItem` child entity'ler. İlk tasarımda TenantId taşımıyorlardı (izolasyon sahibi üzerinden). Ama EF uyarı verdi:

> *'ChecklistRun' has a global query filter and is the required end of a relationship with 'ChecklistRunItem'. This may lead to unexpected results...*

Sebep: parent'ın query filter'ı var, child'ın yok; EF zorunlu ilişkide filtrelenmiş parent ile filtresiz child arasında tutarsızlık riski görüyor. Çözüm: **child'lara da TenantId + eşleşen query filter** ekledik (ITenantEntity). SaveChanges interceptor zaten tüm `ITenantEntity`'leri damgaladığı için (parent eklenince child'lar da Added → otomatik damga), ekstra kod gerekmedi. Yan fayda: her tablo tenant damgası taşır (defense-in-depth izolasyon).

> [!tip] "Her tabloya TenantId" tartışması Bazı tasarımlar child'a TenantId koymaz (sadece root taşır). EF global query filter + zorunlu ilişki bu uyarıyı doğurunca en temiz çözüm child'a da filter — o da TenantId gerektirir. Multi-tenant'ta "her tabloya tenant" yaygın ve savunulabilir bir kalıp.

> [!question] Mülakat Sorusu **"Global query filter'lı bir parent'ın child'ı da filter taşımalı mı?"** Cevap: Zorunlu ilişkide evet — yoksa EF parent'ı filtreleyip child'ı bağlamada tutarsızlık uyarısı verir ve gerçekten beklenmedik sonuç çıkabilir. Child'a eşleşen filtre (genelde aynı TenantId koşulu) eklemek hem uyarıyı kapatır hem izolasyonu sağlamlaştırır. Alternatif ilişkiyi optional yapmaktır ama bu çoğu zaman semantik olarak yanlış.

---

## 6. Mimari Kalıba Sadakat

Yeni modül, sıfır yeni desen: Shift/Task CRUD kalıbı. Feature-based klasör (`Features/Checklists/`, `Features/ChecklistRuns/`), aggregate root'lar interface+concrete DbSet, FK güvenliği (`AnyAsync`), interceptor damgası, DTO projection, "kim?" token'dan. İki controller: şablon (`ChecklistsController`) ve çalıştırma (`ChecklistRunsController`) — niyet ayrımı.

Yetki: şablon oluşturma yönetici; çalıştırma başlat/işaretle personele açık (açılışı yapan kişi); çalıştırma listesi (rapor) yönetici.

---

## 7. Durum (Gün 16 sonu)

**Yeni dosyalar:**
- `Domain/Entities/Checklist.cs` — `Checklist` + `ChecklistItem` + `ChecklistType`
- `Domain/Entities/ChecklistRun.cs` — `ChecklistRun` + `ChecklistRunItem`
- `Application/Features/Checklists/{Create,List}/` — şablon Create (madde snapshot kaynağı), List
- `Application/Features/ChecklistRuns/{Start,Check,Get,List}/` — Start (snapshot), Check (otomatik tamamlanma), Get (rapor), List (takip)
- `API/Controllers/ChecklistsController.cs` + `ChecklistRunsController.cs`
- `tests/Shift.Tests/ChecklistRunTests.cs` — 6 test

**Değişen dosyalar:**
- `Application/Common/Interfaces/IShiftDbContext.cs` + `Infrastructure/.../ShiftDbContext.cs` — `Checklists` + `ChecklistRuns` DbSet + config (FK Cascade/Restrict/SetNull, child tenant filtreleri, unique index, maxlength)

**Migration:** `AddChecklists` (4 tablo: Checklists, ChecklistItem, ChecklistRuns, ChecklistRunItem). DB'ye uygulandı.

**Test: 71/71 yeşil** (65 + 6 yeni: snapshot, snapshot bağımsızlığı, işaretleme kim+saat, otomatik tamamlanma, uncheck reopen, duplicate guard).

---

## 8. Açık Borçlar ve Sırada Ne Var (Gün 17)

> [!warning] Bu dilimde bilinçli ertelenenler **Şablon düzenleme/silme** (madde ekle/çıkar/sırala — IsActive ile soft-disable hazır ama update ucu yok) ve **"checklist tamamlanmadan vardiya kapatılamaz" guard'ı**. İkincisi cross-module: ortada bir "vardiya kapatma" aksiyonu henüz yok (en yakın şey mesai dönem kapanışı). O aksiyon doğunca run.CompletedAt guard'ı oraya bağlanır.

**Görev/checklist modülü açık uçları:**
- Şablon Update/Delete yok.
- Vardiya-kapatma guard'ı yok (bağlanacak aksiyon yok).
- Spec 2.3 (Yönetici günlük logu) — Modül 2'nin son ayağı.
- Tekrarlayan görevler (Gün 15'ten), fotoğraf ekleme.

**Mesai/bordrodan devreden:** Resmi tatil çarpanı + TR tatil takvimi; Excel (.xlsx) export.

**Olası Gün 17 yönleri:** (a) Yönetici günlük logu (spec 2.3) — Modül 2'yi bitir; (b) Excel export; (c) Tatil takvimi + çarpan; (d) şablon düzenleme uçları. Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Şablon (tanım) vs Çalıştırma (örnek): ayrı entity, ayrı yaşam döngüsü
- [ ] Start anında snapshot: run maddesi şablon metnini kopyalar (referans değil)
- [ ] Snapshot = kanıt: şablon değişse geçmiş çalıştırma donmuş kalır (denetim/HACCP)
- [ ] Tamamlanma türetilir, set edilmez: tüm maddelerden hesapla → tutarsızlık imkânsız
- [ ] Giriş/çıkış simetrisi: işaretle→damga, kaldır→temizle; tamamla→damga, sökül→geri al
- [ ] "Kim+saat" token'dan otomatik (CheckedBy/CompletedBy) — client'tan değil
- [ ] Tenant şablon, şube çalıştırma; (Branch,Checklist,RunDate) unique
- [ ] Aggregate-child'a da TenantId+filter (EF "filtreli parent zorunlu ilişki" uyarısı)
- [ ] Şablon yönetici; çalıştırma başlat/işaretle personele açık; rapor yönetici
- [ ] Yeni modül = mevcut CRUD kalıbını taklit (sıfır yeni desen)

#shift #dotnet #backend #faz1 #checklist #kontrol-listesi #snapshot #template-instance #ef-core #clean-architecture
