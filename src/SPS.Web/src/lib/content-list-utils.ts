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

/**
 * 從 YouTube 網址（`youtu.be/{id}`、`youtube.com/watch?v={id}`、
 * `youtube.com/embed/{id}`、`youtube.com/shorts/{id}`，前面可能還有
 * `www.`／`m.` 子網域，`watch` 網址可能還帶 `?si=...`／`&t=...` 這類
 * 追蹤參數）解析出影片 id——`getYouTubeThumbnail`／`getYouTubeEmbedUrl`
 * 共用同一套解析邏輯，不要各寫一份。
 */
function parseYouTubeId(url?: string | null): string | undefined {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^(www|m)\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || undefined;
    }
    if (host === "youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") ?? undefined;
      }
      if (parsed.pathname.startsWith("/embed/") || parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2];
      }
    }
  } catch {
    // 不是合法網址（例如空字串、相對路徑），當作不是 YouTube 連結
  }
  return undefined;
}

/**
 * 2026-09-10 實測第一支真的塞進 `/content/videos` 的影片是 YouTube
 * 連結（`Video.Uri` 直接填 YouTube 網址，不是上傳到 FileManagement
 * 的 mp4 檔）——這種情況下 `Video.ThumbnailUri` 十之八九不會另外填
 * （YouTube 本身就有縮圖，何必自己再上傳一張），畫面上會整排都是
 * `VIDEO_FALLBACK_THUMBNAIL` 佔位圖，不是真的沒接好，是沒有幫這種
 * 「影片來源其實是 YouTube」的情況做特別處理。加這個小工具，`uri`
 * 是 YouTube 連結、又沒有另外設定縮圖時，直接借用 YouTube 自己的
 * 縮圖，不用管理員手動截圖上傳。
 */
export function getYouTubeThumbnail(url?: string | null): string | undefined {
  const videoId = parseYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
}

/**
 * 一般分享用的 YouTube 網址（`youtu.be/{id}`、`youtube.com/watch?v=`）
 * 不能直接塞進 `<iframe src>`——YouTube 自己的浏览器頁面對這兩種網址
 * 設了 `X-Frame-Options`/CSP `frame-ancestors`，擋掉被其他網站用
 * iframe 嵌入，只有 `/embed/{id}` 這個專門給嵌入用的路徑允許。
 *
 * 一開始想偷懶讓 Fancybox（`data-fancybox`）自己認網址、自動判斷要不
 * 要轉成 embed 格式，實測發現這支專案用的 Fancybox 版本（5.0.33）
 * 對 `youtu.be/{id}?si=...`（YouTube 分享按鈕產生的網址，這幾年才有
 * 的 `si` 追蹤參數）認不出來，燈箱殼開得起來、但內容一直卡在讀取中
 * ——不是被擋，是 Fancybox 沒判斷出「這是 YouTube」，把原始分享網址
 * 當成一般網頁嵌進 iframe，而 YouTube 分享頁本身又不允許被嵌入，
 * 兩個問題疊在一起。改成不依賴 Fancybox 的自動判斷，自己算出正確的
 * `/embed/{id}` 網址，透過 `data-type="iframe"`／`data-src` 明確告訴
 * Fancybox 要嵌入哪個網址，不用它自己猜。
 */
export function getYouTubeEmbedUrl(url?: string | null): string | undefined {
  const videoId = parseYouTubeId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
}
