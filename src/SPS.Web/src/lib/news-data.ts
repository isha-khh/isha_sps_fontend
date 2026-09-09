import { wrapHtmlAsPuckContent } from "@/lib/puck-content";
import type { NewsItem, NewsDetail } from "@/lib/types";
import { formatIsoDate, sortByViewCount } from "@/lib/content-list-utils";

export type { NewsItem, NewsDetail };

export interface NewsCategory {
  id: number;
  name: string;
}

/**
 * 薄包裝，實際邏輯在 `content-list-utils.ts`（`/promotion` 對接真
 * 後端時也需要一模一樣的日期格式化，抽成共用函式，這裡保留原本的
 * 名字/簽名不變，呼叫端不用改）。
 */
export function formatNewsDate(dateString: string | null): string {
  return formatIsoDate(dateString);
}

/**
 * 分類清單不是另外拉一支 `/api/Category` API，而是直接從「畫面上有
 * 哪些公告」反推「所以有哪些分類」——理由跟 `faq-data.ts` 的
 * `deriveFaqCategories` 完全一樣：真後端 `categoryId` 是資料庫數字
 * 主鍵，跟這裡假資料隨便編的 id 不會是同一組數字，如果分類清單跟
 * 公告清單各自獨立取得，退回假資料時很容易兜不起來（側欄看得到一個
 * 分類，點進去卻是空的）。用同一份 `items` 反推，不管是真後端資料
 * 還是下面的 `NEWS_ARTICLES` 假資料，側欄分類永遠對得上。
 */
export function deriveNewsCategories(items: NewsItem[]): NewsCategory[] {
  const seen = new Map<number, string>();
  for (const item of items) {
    if (item.categoryId == null) continue;
    if (!seen.has(item.categoryId)) {
      seen.set(item.categoryId, item.categoryName || `分類 ${item.categoryId}`);
    }
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

/**
 * 公告假資料——後端無法連線或尚無資料時的退回內容。
 *
 * 形狀直接對到真後端的 `NewsItem`／`NewsDetail`（見 lib/types.ts）：
 * 同一筆資料同時滿足兩邊（`NewsDetail` 只是多一個 `content` 欄位），
 * 列表頁跟詳情頁都從這裡讀同一份，不用各自維護。
 *
 * 真後端 `News` 沒有「撰稿人／附件下載／相關連結」這幾個欄位（entity
 * 只有 Title/Introduction/Content/StartDate/EndDate/Category/Tags/
 * Picture），這幾項舊版假資料有、新版拿掉了——內文（`content`）跟
 * FAQ 一樣是 Puck 區塊 JSON，交給 `PuckRenderer` 顯示，不會因為拿掉
 * 這幾個欄位就沒東西可看。
 *
 * 封面圖／標簽 2026-09-08 已請後端一併補進 API（`NewsListItemResponse`／
 * `NewsResponse` 的 `ImageUrl`／`Tags`，見 docs/改版規劃.md）——`imageUrl`
 * 沒設定圖片時仍可能是 undefined，卡片圖用 `NEWS_FALLBACK_IMAGE` 佔位。
 */
export const NEWS_FALLBACK_IMAGE = "/images/all/new_logo.jpg";

/**
 * 「活動進行中／即將開始／已結束」這個狀態標籤不是後端另外存一個狀態
 * 欄位，是前台自己用 `startDate`／`endDate` 跟現在時間比對算出來的：
 * - 沒有 `endDate`：不是「活動」類公告（沒有起訖區間），不顯示標籤
 * - 現在 < `startDate`：即將開始
 * - `startDate` <= 現在 <= `endDate`：活動進行中
 * - 現在 > `endDate`：活動已結束
 *
 * 這個判定邏輯是 2026-09-08 跟後端一起定案的（見 docs/改版規劃.md）：
 * 「是不是活動」不需要額外欄位，有沒有填 `endDate` 就代表了。
 *
 * `startDate` 可能是 `null`（見 `formatNewsDate` 的說明）——沒有開始
 * 日期就沒辦法判斷「即將開始 vs 進行中」，這種殘缺資料一律不顯示
 * 狀態標籤，比顯示一個算錯的狀態安全。
 */
export function getNewsActivityStatus(startDate: string | null, endDate?: string): string | undefined {
  if (!startDate || !endDate) return undefined;

  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  if (now < start) return "即將開始";
  if (now > end) return "活動已結束";
  return "活動進行中";
}

/**
 * 薄包裝，實際邏輯在 `content-list-utils.ts`（`sortByViewCount`）——
 * `viewCount` 這個欄位其實後端本來就有
 * （`NewsListItemResponse.ViewCount`），只是先前沒有從 DTO 補進前台
 * 的 `NewsItem` 型別，一直被晾在旁邊沒用到；`/promotion` 對接真後端
 * 時也需要一模一樣的排序邏輯，抽成共用函式，這裡保留原本的名字/
 * 簽名不變。
 */
export function sortNewsByViewCount(items: NewsItem[]): NewsItem[] {
  return sortByViewCount(items);
}

export const NEWS_ARTICLES: (NewsItem & Pick<NewsDetail, "content" | "tags">)[] = [
  {
    id: 1,
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    introduction: "本計畫提供最高500萬元補助，協助企業導入AIoT、5G等智慧化技術，申請截止日期為7月31日。",
    startDate: "2026-04-15",
    endDate: "2026-07-31",
    published: true,
    categoryId: 1,
    categoryName: "活動資訊",
    createdTime: "2026-04-15",
    viewCount: 128,
    tags: ["產業AI", "技術文件"],
    content: wrapHtmlAsPuckContent(
      "news-1",
      "<p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。</p><p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰。</p>",
    ),
  },
  {
    id: 2,
    title: "AI 視覺辨識技術於石化廠工安巡檢的應用趨勢",
    introduction: "彙整國內外導入案例，說明電腦視覺結合物聯網感測器，如何協助降低巡檢人力負擔並提升異常偵測速度。",
    startDate: "2026-04-10",
    published: true,
    categoryId: 2,
    categoryName: "產業新知",
    createdTime: "2026-04-10",
    viewCount: 76,
    content: wrapHtmlAsPuckContent(
      "news-2",
      "<p>彙整國內外導入案例，說明電腦視覺結合物聯網感測器，如何協助降低巡檢人力負擔並提升異常偵測速度，並針對導入時常見的資料標註與現場光源問題提出建議做法。</p>",
    ),
  },
  {
    id: 3,
    title: "經濟部產業發展署公告 114 年度智慧化補助說明會場次",
    introduction: "說明會將於全台北中南三場舉辦，歡迎有意申請補助的企業報名參加，現場並提供一對一諮詢服務。",
    startDate: "2026-03-28",
    published: true,
    categoryId: 3,
    categoryName: "外部消息",
    createdTime: "2026-03-28",
    viewCount: 42,
    content: wrapHtmlAsPuckContent(
      "news-3",
      "<p>說明會將於全台北中南三場舉辦，歡迎有意申請補助的企業報名參加，現場並提供一對一諮詢服務，詳細場次時間請參閱附件。</p>",
    ),
  },
];

export function getNewsArticle(id: string): (NewsItem & Pick<NewsDetail, "content" | "tags">) | undefined {
  return NEWS_ARTICLES.find((article) => String(article.id) === id);
}
