# Shift — Gün 19: Checklist Şablon Update/Delete (Soft-Delete + EF Çocuk-Koleksiyon Replace Tuzağı)

> [!info] Bugünün hedefi Frontend'e geçmeden önceki backend borçlarından biri: kontrol listesi (Gün 16) şablonlarına **Update/Delete** uçları. Mevcut CRUD kalıbı taklit edildi. İki öğretici nokta çıktı: (1) referans edilen kayıtta "silme" = soft-delete; (2) EF Core'da bir çocuk koleksiyonunu (madde listesi) replace ederken navigation fixup çakışması.

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 19 (2. borç) tamamlandı — 85/85 test yeşil

---

## 1. "Silme" = Soft-Delete (Çünkü Geçmiş Buna Bağlı)

`DeleteChecklist` gerçek silme (row delete) DEĞİL, **soft-delete** (`IsActive=false`). Neden: geçmiş çalıştırmalar (`ChecklistRun`) şablona **FK Restrict** ile bağlı. Gerçek silme o çalıştırmaları kıracağı için DB zaten reddederdi. Soft-disable şablonu aktif kullanımdan kaldırır:
- `ListChecklists` default'u `IsActive` süzgeçli → pasif şablon listede görünmez.
- `StartChecklistRun` pasif şablonu reddediyor → yeni çalıştırma başlatılamaz.
- Ama geçmiş çalıştırmaların bağlamı korunur (denetim).

`IsActive` alanı Gün 16'da bu an için açılmıştı — bugün kullanıldı.

> [!important] Referans edilen kayıt "silinmez", emekli edilir Bir kaydı başka kayıtlar (geçmiş, audit, fatura...) referans ediyorsa hard-delete ya FK ile patlar ya geçmişi bozar. Doğru hamle: soft-delete (aktif/pasif bayrağı). Kayıt yaşamaya devam eder, sadece yeni kullanımdan çekilir. "Sil" butonu çoğu üretim sisteminde aslında "pasifleştir"dir.

> [!question] Mülakat Sorusu **"Başka kayıtların referans ettiği bir varlığı silme isteği gelince ne yaparsın?"** Cevap: Hard-delete yerine soft-delete (IsActive/DeletedAt). Referans bütünlüğü korunur, geçmiş kayıtlar anlamlı kalır, "yanlışlıkla sildim" geri alınabilir olur. Gerçek silme yalnız hiç referans edilmeyen, audit değeri olmayan kayıtlar için düşünülür. Finansal/operasyonel geçmişte hard-delete neredeyse hiç yapılmaz.

---

## 2. Çocuk Koleksiyonu Replace: EF Navigation Fixup Tuzağı

`UpdateChecklist` maddelerin TAMAMINI değiştiriyor (replace). İlk denemede klasik yol — şablonu `Include(c => c.Items)` ile çek, `Items.Clear()`, yeni maddeleri ekle — **InMemory'de patladı**:

> *DbUpdateConcurrencyException: Attempted to update or delete an entity that does not exist in the store.*

Sebep: navigation koleksiyonunu (`checklist.Items`) yüklemiş + değiştirmiş olunca EF'in **ilişki fixup**'ı devreye giriyor; eski maddeleri hem silmeye hem FK'lerini güncellemeye çalışıyor, bu da silinmiş bir kaydı "güncelleme" gibi çelişkili bir işleme dönüşüyor (sağlayıcıya göre davranış değişiyor).

**Çözüm:** navigation'a HİÇ dokunma. Maddeleri ayrı sorguyla çek, açıkça `RemoveRange`, yenileri açık FK (`ChecklistId`) ile `Add`:

```csharp
var checklist = await _db.Checklists.FirstOrDefaultAsync(...);  // Items YÜKLENMEZ
var oldItems = await _db.ChecklistItems.Where(i => i.ChecklistId == checklist.Id).ToListAsync(ct);
_db.ChecklistItems.RemoveRange(oldItems);                       // açık sil
for (var i = 0; i < request.Items.Count; i++)
    _db.ChecklistItems.Add(new ChecklistItem { Text = request.Items[i], SortOrder = i, ChecklistId = checklist.Id });
```

Navigation koleksiyonu yüklenmediği için fixup tetiklenmez; silme ve ekleme ayrık, niyet net. Bunun için `ChecklistItems` DbSet'i interface'e açıldı (şablon düzenleme meşru bir aggregate-içi işlem).

> [!important] "İlişki kur" ile "veriyi değiştir" karışınca EF kafa karıştırır Çocuk koleksiyonunu navigation üzerinden değiştirmek (Clear/Add) EF'e iki sinyal gönderir: "bu ilişki koptu" + "bu kayıt silinmeli". Provider bunları farklı sırayla işleyince çelişki çıkabilir. Açık `RemoveRange` + `Add` (FK elle) niyeti tek anlama indirger: sil + ekle. Belirsizlik yok.

> [!question] Mülakat Sorusu **"EF Core'da bir entity'nin çocuk koleksiyonunu tamamen değiştirmenin güvenli yolu nedir?"** Cevap: Navigation fixup'a güvenmek yerine değişimi açık yapmak: eski çocukları çekip `RemoveRange`, yenileri açık FK ile `Add`. Orphan-delete davranışı ilişki konfigürasyonuna ve sağlayıcıya göre değişir; `Include`+`Clear` özellikle test (InMemory) ile prod (Postgres) arasında farklı davranabilir. Açık silme+ekleme deterministiktir.

---

## 3. Snapshot Sayesinde Madde Id Değişimi Güvenli

Update maddeleri silip yeniden yarattığı için madde **Id'leri değişir**. Bu neden sorun değil: geçmiş çalıştırmalar (`ChecklistRunItem`) madde **metnini snapshot'ladı**, madde Id'sine FK ile bağlı DEĞİL (Gün 16 kararı). Yani şablonu istediğin gibi düzenle — donmuş çalıştırmalar etkilenmez. Snapshot tasarımının düzenlemeyi serbestleştiren yan faydası.

---

## 4. Durum (Gün 19 — 2. borç)

**Yeni dosyalar:**
- `Application/Features/Checklists/Update/` — Command, Validator, Handler (madde replace)
- `Application/Features/Checklists/Delete/` — Command, Handler (soft-disable)
- `tests/Shift.Tests/ChecklistTemplateTests.cs` — 3 test

**Değişen dosyalar:**
- `API/Controllers/ChecklistsController.cs` — PUT/DELETE uçları
- `Application/Common/Interfaces/IShiftDbContext.cs` + `Infrastructure/.../ShiftDbContext.cs` — `ChecklistItems` DbSet (replace için)

**Migration YOK** — şema değişmedi (mevcut tablolar; sadece davranış).

**Test: 85/85 yeşil** (82 + 3 yeni: madde replace, soft-disable, pasif şablon listede gizli).

---

## 5. Sırada: Fotoğraf Ekleme (1. borç — altyapı kararı bekliyor)

> [!warning] DUR noktası Frontend öncesi diğer backend borcu **fotoğraf ekleme** (görev + checklist kanıt fotoğrafı, ikisi de MVP). Bu **blob storage** gerektiriyor (spec: AWS S3 / Cloudflare R2). Altyapı kararı (depolama sağlayıcı, credential durumu, presigned URL vs direct upload) Berke'nin onayını bekliyor — onaylanmadan kod yazılmayacak. Bu bitince frontend planına geçilecek.

**Demo sonrasına bırakılanlar (değişmedi):** Excel export, tatil takvimi+çarpan, tekrarlayan görev, vardiya-kapatma guard'ı.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Referans edilen kayıt silinmez, soft-delete edilir (IsActive) — geçmiş korunur
- [ ] "Sil" butonu üretimde çoğu zaman "pasifleştir"dir
- [ ] EF çocuk-koleksiyon replace: navigation Clear/Add fixup çakışması yaratabilir
- [ ] Güvenli replace: ayrı sorgu + RemoveRange + açık FK ile Add (nav'a dokunma)
- [ ] Orphan-delete davranışı provider'a göre değişir (InMemory ≠ Postgres) → açık ol
- [ ] Snapshot (metin kopyası) sayesinde şablon madde Id'leri serbestçe değişebilir

#shift #dotnet #backend #faz1 #checklist #soft-delete #ef-core #navigation-fixup #clean-architecture
