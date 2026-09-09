/**
 * 各種「列表型」內容（公告、產業案例…）共用的小工具，抽出來是因為
 * `/news`（`lib/news-data.ts`）先做了一次日期格式化／點閱率排序，
 * `/promotion` 對接真後端時發現要做一模一樣的事——與其在
 * `promotion-data.ts` 再抄一份幾乎相同的邏輯，不如抽成共用函式，
 * 兩邊都改用同一份實作（`news-data.ts` 的 `formatNewsDate`／
 * `sortNewsByViewCount` 保留原本的名字，內部改成呼叫這裡，呼叫端
 * 完全不用改）。
 */

/**
 * 真後端的日期欄位（`startDate`／`publishedDate`／`createdTime`…）
 * 回傳完整 ISO 時間戳記（例如 `"2026-05-12T00:00:00Z"`），但設計稿
 * 只要顯示日期（`"2026-05-12"`）。直接取字串前 10 碼，不透過
 * `Date`／`toLocaleDateString()` 轉換，是為了不要因為瀏覽器時區換算
 * 把日期往前/後跳一天（這種「日期」欄位在後端存的時間一律是當天
 * UTC 午夜，用本地時區轉換反而會出錯）。
 *
 * 這些日期欄位大多是可為 `null` 的（後端對應的 C# 型別是
 * `DateTime?`）——實測過 `News.StartDate`（98 筆真資料裡有 2 筆是
 * null）不是理論上的邊界情況，`fallback` 沒指定時預設顯示「日期
 * 未定」，不能假設一定有值。
 */
export function formatIsoDate(dateString: string | null | undefined, fallback = "日期未定"): string {
  return dateString ? dateString.slice(0, 10) : fallback;
}

/**
 * 「熱門文章／熱門產業案例」側欄要照真的點閱率排序，不是隨便拿清單
 * 前幾筆。回傳一份新陣列（`slice()` 先複製一份），不直接對呼叫端
 * 傳進來的陣列做 `sort()`，避免意外改到呼叫端還要用的原始順序
 * （例如列表頁本身是照日期排序顯示，跟熱門排行的點閱率排序是兩回
 * 事，不能共用同一份排序結果）。
 */
export function sortByViewCount<T extends { viewCount: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => b.viewCount - a.viewCount);
}

/**
 * 真後端有些圖片欄位（`News.ImageUrl`、`SuccessCase.CoverImageUrl`）
 * 回傳的是**相對於後端 API 本身**的路徑（例如
 * `"/api/FileManagement/{guid}/download"`），不是相對於這個 Next.js
 * 網站——瀏覽器端 `<img>` 標籤如果直接拿這種相對路徑當 `src`，會拿去
 * 跟目前網站的 origin 兜（變成向 Next.js 自己要一張圖，當然 404）。
 * 這是實測 `/promotion` 接上真資料才踩到的：26 筆真資料全部都有設
 * `coverImageUrl`，26 張圖全部 404；`/news` 之前沒踩到單純是因為
 * 目前 98 筆真資料剛好沒有任何一筆設定 `imageUrl`（都退回佔位圖），
 * 同一個問題其實兩邊都有，只是 News 那邊還沒有真的圖片資料曝光出來。
 *
 * 要在資料離開 `api.server.ts`（伺服器端）時就轉成完整網址，用
 * `NEXT_PUBLIC_API_BASE`，不是 `API_URL`——`API_URL`（server-only）在
 * production 可能是瀏覽器連不到的內部位址（例如 Docker 內部
 * hostname，給 Next.js 伺服器自己打後端用），`NEXT_PUBLIC_API_BASE`
 * 才保證是瀏覽器打得到的公開位址（`<img>` 是瀏覽器發的請求）。
 */
export function resolveBackendAssetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path; // 已經是完整網址，不用處理

  const base = process.env.NEXT_PUBLIC_API_BASE?.trim().replace(/\/+$/, "");
  if (!base) return path; // 沒設定 base 的話至少退回原始相對路徑，不要整個丟掉

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
