"use client";

import { useState } from "react";
import { ApiClientError } from "./api-client";

// Toast/banner geri-bildirimi. success yalnız manuel set edilir (ör. yayınla); mutate
// sadece warning (200) ve error (rollback) üretir.
export type Feedback = { type: "error" | "warning" | "success"; text: string } | null;

// Optimistic update + rollback ÇEKİRDEĞİ — paylaşılan (çizelge + Kanban + sonrası).
// İki yerde KOPYA tutmamak için tek kaynak: burada bug avlarsan her yerde düzelir.
//
// Sözleşme: doğrudan-manipülasyon aksiyonu (sürükle/taşı) için:
//   snapshot al → optimistic uygula → API çağır →
//     • başarı + warnings[] (engellemeyen kural) → tut + uyarı göster
//     • hata (çakışma 4xx / ağ) → ESKİ state'e GERİ AL + neden göster
// Pessimistic aksiyonlar (oluştur/sil) setItems/setFeedback ile doğrudan yönetilir.
export function useOptimisticList<T extends { id: string }>(initial: T[]) {
  const [items, setItems] = useState<T[]>(initial);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function mutate(opts: {
    id: string; // hangi öğe değişiyor (pulse/disabled için)
    optimistic: (items: T[]) => T[]; // anlık dönüşüm
    run: () => Promise<{ warnings?: string[] } | void>; // API çağrısı
  }) {
    const prev = items; // rollback snapshot'ı
    setItems(opts.optimistic(prev));
    setFeedback(null);
    setPendingId(opts.id);
    try {
      const res = await opts.run();
      const warnings = res && "warnings" in res ? res.warnings : undefined;
      if (warnings && warnings.length > 0) {
        setFeedback({ type: "warning", text: warnings.join("  •  ") });
      }
    } catch (e) {
      setItems(prev); // GERİ AL
      setFeedback({
        type: "error",
        text: e instanceof ApiClientError ? e.message : "İşlem başarısız.",
      });
    } finally {
      setPendingId(null);
    }
  }

  return { items, setItems, feedback, setFeedback, pendingId, mutate };
}
