/** 列表頁共用：從網址參數讀出關鍵字（`q`）與頁碼（`page`，不合法就是第 1 頁） */
export function readListQuery(searchParams: Record<string, string | string[] | undefined>): { query: string; page: number } {
  const rawQuery = searchParams.q;
  const rawPage = searchParams.page;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const requested = typeof rawPage === "string" ? Number(rawPage) : 1;
  const page = Number.isFinite(requested) && requested >= 1 ? Math.floor(requested) : 1;
  return { query, page };
}

/** 組列表頁的網址（略過空值與第 1 頁） */
export function buildListHref(basePath: string, params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || (key === "page" && Number(value) <= 1)) continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
