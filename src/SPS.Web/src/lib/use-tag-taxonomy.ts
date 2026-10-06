"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { buildTaxonomy, type TagRecord, type TagTaxonomy } from "@/lib/company-tags";

/**
 * 瀏覽器端載入企業標籤的分類結構（註冊／升級表單的標籤勾選用）。
 * 伺服器端頁面用 `api.server.ts` 的 `fetchTagTaxonomy`；這支給 client component 用，邏輯相同。
 * 載入前或失敗時是空的結構（標籤區塊沒有選項）。
 */
export function useTagTaxonomy(): { taxonomy: TagTaxonomy; loading: boolean } {
  const [taxonomy, setTaxonomy] = useState<TagTaxonomy>(() => buildTaxonomy([]));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .get<{ items: (TagRecord & { published: boolean })[] }>("/api/Category", { params: { type: 6, page: 1, pageSize: 500 } })
      .then((response) => {
        if (!cancelled) setTaxonomy(buildTaxonomy((response.data.items ?? []).filter((c) => c.published)));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { taxonomy, loading };
}
