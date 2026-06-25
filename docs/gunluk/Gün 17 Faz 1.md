# Shift — Gün 17: Vardiya Notları (Shift Notes [MVP] — Faz Sınırına Dikkat)

> [!info] Bugünün hedefi Spec Modül 2.3 "Yönetici Günlük Logu"nun **sadece [MVP] kısmı**: vardiyadan vardiyaya basit operasyonel handoff notu (`ShiftNote`). Spec'te bu modülde MVP ve Faz 2 etiketleri KARIŞIK — zengin "Manager Logbook" (kategori, aranabilir arşiv, sahibe özet bildirimi, yapılandırılmış olay kaydı) [Faz 2]. Bilinçli olarak yalnız MVP'yi yaptık, Faz 2 logbook'u erteleme listesine koyduk. Modül 2 (Görev ve Operasyon) böylece MVP tarafında tamamlandı.

**Tarih:** 25 Haziran 2026 **Stack:** .NET 10, EF Core (Code First), PostgreSQL, MediatR (CQRS), xUnit **Durum:** ✅ Gün 17 %100 tamamlandı — 77/77 test yeşil

---

## 1. Faz Disiplini: Aynı Modülde Karışık Etiket

En kritik karar koddan önce: **ne YAPMAYACAĞIZ.** Spec Modül 2.3 tek başlık altında iki ayrı olgunluk seviyesi barındırıyor:

| Parça | Faz | Bugün |
|-------|-----|-------|
| Shift Notes — basit operasyonel handoff notu | **[MVP]** | ✅ yapıldı |
| Manager Logbook — kategori/olay-tipi, aranabilir arşiv, sahibe gün-sonu özet bildirimi, yapılandırılmış olağanüstü olay (kaza/şikayet/sağlık) | **[Faz 2]** | ⏸️ ertelendi |

Spec'in modül başlığı ("Yönetici Günlük Logu") Faz 2'nin zengin halini çağrıştırıyor ama MVP çekirdeği çok daha sade: bir şubenin bir gününe ait, serbest metinli, üst üste birikebilen notlar. Başlığa kapılıp logbook'u yazmak faz kaymasıydı.

> [!important] Modül adı ≠ MVP kapsamı Bir modülün spec başlığı genelde NİHAİ vizyonu anlatır; o modülün MVP'si onun küçük bir alt kümesidir. "Modülü yap" demek "modülün her satırını yap" demek değil. Etiketlere (MVP/Faz 2) bak, başlığa değil. Belirsizse en küçük işe yarar çekirdeği seç.

> [!question] Mülakat Sorusu **"Bir özellik açıklaması hem basit hem gelişmiş gereksinimleri karışık içeriyorsa nasıl bölersin?"** Cevap: Olgunluk/değer eksenine göre ayırırım — "ilk sürümde işe yarayacak en küçük çekirdek" ile "sonra gelecek zenginleştirme"yi etiketlerim ve önce çekirdeği teslim ederim. Tek başlık beni yanıltmaz; gereksinimleri tek tek faza atarım. Erken zenginlik = kapsam şişmesi + geç teslim.

---

## 2. Veri Modeli: `ShiftNote` (branch + tarih feed)

```
ShiftNote : BaseEntity, ITenantEntity
  TenantId, BranchId          → şubeye özel (Branch FK Restrict)
  NoteDate (DateOnly)         → ait olduğu OPERASYONEL gün (yazıldığı an değil)
  Content (string, 2000)      → serbest metin
  CreatedByUserId? (token)    → kim bıraktı (SetNull) ┐ CreatedAt = ne zaman
                                                      ┘ (kim+saat audit)
```

**Tasarım kararları:**
1. **Feed (çok kayıt), tek kayıt değil.** "Vardiyadan vardiyaya" = günde birden çok not; `(branch, date)` unique YOK, append akışı. Sabah ekibi bırakır, akşam ekibi okur + ekler.
2. **Belirli bir Shift kaydına bağlı DEĞİL.** Handoff birimi gün → branch+date yeterli. Tekil vardiya kaydına FK = Faz 2 logbook zenginliği.
3. **`NoteDate` ayrı, `CreatedAt`'ten farklı.** Gece yarısını aşan vardiyada 02:00'de yazılan not önceki operasyonel güne ait olabilir → "ait olduğu gün" ile "yazıldığı an" ayrı alanlar.
4. **`Shift.Notes`'tan farkı (footgun).** Shift entity'sinin `Notes` alanı O vardiya KAYDINA iliştirilmiş tekil not; `ShiftNote` BAĞIMSIZ branch+gün handoff akışı. İsim benziyor, kavram farklı — entity yorumunda açıkça ayrıldı.

> [!question] Mülakat Sorusu **"Bir kaydın 'ait olduğu gün' ile 'oluşturulma anı' ne zaman ayrı alan olmalı?"** Cevap: İkisi sistematik olarak sapabiliyorsa. Gece vardiyası, geriye dönük giriş, farklı saat dilimi gibi durumlarda "olay hangi güne sayılır" ile "kayıt ne zaman yazıldı" farklıdır. CreatedAt audit'tir (değişmez teknik damga); iş gününü ayrı tutmazsan raporlar yanlış güne düşer.

---

## 3. Silme Yetkisi: Rol Application'a Sızmadan (Capability Pattern)

Kural: yönetici (Owner/Manager) HER notu siler; personel YALNIZ kendi notunu. Sorun: rol bilgisi JWT'de, ama iş kuralı handler'da. Rol stringini (`"Owner"`) Application katmanına taşımak katman sınırını bozar.

Çözüm — **capability (yetenek) boolean'ı:** controller JWT rolünden `canDeleteAny = User.IsInRole("Owner") || User.IsInRole("Manager")` türetir ve komuta `bool` olarak geçer. Handler rolü bilmez, sadece yeteneği bilir:

```csharp
if (!request.CanDeleteAny && note.CreatedByUserId != _currentUser.GetUserId())
    throw new InvalidOperationException("Yalnızca kendi notunuzu silebilirsiniz.");
```

Böylece "kim sahip" (token'dan) + "silme yetkisi var mı" (capability) handler'da; "rol nedir" controller'da kalır. Rol→yetenek çevirisi sınırda yapılır.

> [!important] Rol değil, yetenek geçir Handler'a `role == "Manager"` diye string geçmek kırılgan (rol adı değişirse her handler kırılır) ve katman ihlali (Application, kimlik-doğrulama şemasını bilmemeli). Bunun yerine "şunu yapabilir mi?" sorusunu controller cevaplayıp boolean geçer. Authorization politikası uçta, iş kuralı handler'da — ayrık.

> [!question] Mülakat Sorusu **"İş mantığında 'yönetici şunu yapabilir' kuralını nasıl kodlarsın — handler'da rol kontrolü mü?"** Cevap: Handler'a ham rolü taşımam; uçta (controller/policy) rolü bir yeteneğe çeviririm ("canDeleteAny") ve onu geçerim. Handler yeteneğe göre karar verir, kimlik şemasından bağımsız kalır. Rol adları/şema değişse controller'ı güncellerim, iş kuralı sabit kalır.

---

## 4. Append-Log: Düzeltme = Yeni Not

Kapsam Create + List + Delete (Update YOK). Handoff notu bir GEÇMİŞ kaydıdır; yanlış yazılanı düzeltmek için eskiyi değiştirmeyiz, yeni not bırakırız (eski silinebilir ama düzenlenmez). Bu, denetlenebilir bir akışı korur — "not sonradan değiştirildi mi?" sorusu hiç doğmaz. Aynı felsefe Gün 16 checklist çalıştırmasında da vardı: geçmiş donar, düzeltme ileri akar.

---

## 5. Durum (Gün 17 sonu)

**Yeni dosyalar:**
- `Domain/Entities/ShiftNote.cs` — entity (Shift.Notes ayrımı yorumda)
- `Application/Features/ShiftNotes/Create/` — Command+Result, Validator, Handler
- `Application/Features/ShiftNotes/List/` — Query+DTO, Handler (feed, yeni→eski)
- `Application/Features/ShiftNotes/Delete/` — Command (capability), Handler (yetki guard)
- `API/Controllers/ShiftNotesController.cs` — rol→capability çevirisi
- `tests/Shift.Tests/ShiftNoteTests.cs` — 6 test

**Değişen dosyalar:**
- `Application/Common/Interfaces/IShiftDbContext.cs` + `Infrastructure/.../ShiftDbContext.cs` — `ShiftNotes` DbSet + config (Branch Restrict, CreatedByUser SetNull, (BranchId,NoteDate) index, tenant filter)

**Migration:** `AddShiftNotes` (ShiftNotes tablosu). DB'ye uygulandı.

**Test: 77/77 yeşil** (71 + 6 yeni: oluşturma damgası, feed sırası, tarih filtresi, personel kendi/başkası silme, yönetici silme).

---

## 6. Açık Borçlar ve Sırada Ne Var (Gün 18)

> [!warning] Bu modülde [Faz 2]'ye ertelenen (Manager Logbook) **Kategori/olay-tipi** (müşteri şikayeti, ekipman arızası, kaza, sağlık), **aranabilir arşiv** (full-text), **sahibe gün-sonu özet bildirimi**, **yapılandırılmış olağanüstü olay kaydı**. Hepsi Faz 2 — MVP handoff notu bunları içermez.

**Görev/operasyon (Modül 2) açık uçları:**
- Şablon Update/Delete (checklist, Gün 16'dan).
- Vardiya-kapatma guard'ı (checklist tamamlanmadan kapanmasın) — bağlanacak aksiyon yok.
- Tekrarlayan görevler, fotoğraf ekleme (Gün 15'ten).

**Mesai/bordrodan devreden:** Resmi tatil çarpanı + TR tatil takvimi; Excel (.xlsx) export.

**Olası Gün 18 yönleri:** (a) Excel (.xlsx) export — ClosedXML; (b) Tatil takvimi + tatil çarpanı (TR'ye özgü); (c) Yeni MVP modülü (spec'e bak); (d) Modül 2 erteleme uçlarını topla (şablon düzenleme vb.). Karar Berke'de.

---

## 📌 Hızlı Tekrar — Anahtar Kavramlar

- [ ] Modül adı ≠ MVP kapsamı: etikete (MVP/Faz 2) bak, başlığa değil
- [ ] Karışık etiketli modülde sadece [MVP] çekirdeği yap, gerisini ertele listesine yaz
- [ ] ShiftNote = branch+gün handoff FEED'i (çok kayıt), tek kayıt değil
- [ ] NoteDate (ait olduğu gün) ≠ CreatedAt (yazıldığı an) — gece vardiyası ayrımı
- [ ] ShiftNote ≠ Shift.Notes: bağımsız akış vs vardiya kaydına iliştirilmiş alan
- [ ] Silme yetkisi: rol değil capability (bool) geç — rol controller'da, kural handler'da
- [ ] "Kim sahip" token'dan; "yetki var mı" capability'den — ikisi ayrı
- [ ] Append-log: düzeltme = yeni not (geçmiş donar, denetlenebilir)
- [ ] Yeni modül = mevcut CRUD kalıbını taklit (sıfır yeni desen)

#shift #dotnet #backend #faz1 #vardiya-notu #shift-notes #faz-disiplini #capability #ef-core #clean-architecture
