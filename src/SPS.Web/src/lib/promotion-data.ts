import { wrapHtmlAsPuckContent } from "@/lib/puck-content";
import type { PromotionCase, PromotionCaseDetail, VideoItem } from "@/lib/types";

export type { PromotionCase, PromotionCaseDetail, VideoItem };

/**
 * 分類清單（`albumTitle`）不是另外拉一支 API，直接從「畫面上有哪些
 * 影片」反推——理由跟 `derivePromotionIndustries` 一樣。`Video.AlbumId`
 * 可以是 null（沒掛任何相簿），沒有相簿的影片不計入分類清單。
 */
export function deriveVideoCategories(items: VideoItem[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (item.albumTitle) seen.add(item.albumTitle);
  }
  return Array.from(seen);
}

/**
 * 「精選影音」（`/promotion/video` 跑馬燈下方那則、`HomeVideo` 輪播）
 * 挑 `ordinal` 最小的那一支——`Video` entity 沒有「是否精選」的布林
 * 欄位，`ordinal` 是唯一真的可以人工控制順序的欄位，挑最小值當作
 * 「小編排在最前面」的意思，跟 SuccessCase／News 用 `viewCount` 排序
 * 是不同機制（Video 沒有點閱數欄位，見下面 `PROMOTION_VIDEOS` 的
 * 說明）。
 */
export function sortVideosByOrdinal(items: VideoItem[]): VideoItem[] {
  return items.slice().sort((a, b) => a.ordinal - b.ordinal);
}

/**
 * 分類清單（industry）不是另外拉一支 API，直接從「畫面上有哪些案例」
 * 反推——理由跟 `news-data.ts` 的 `deriveNewsCategories` 一樣：假資料
 * 退回時分類要跟看得到的案例對得上。跟 News/FAQ 不一樣的地方：這裡
 * 不用 id/name 對應（`SuccessCase.Industry` 本來就是自由文字，不是
 * `Category` 表的數字外鍵），直接回傳去重複的字串陣列就好。
 */
export function derivePromotionIndustries(items: PromotionCase[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    if (item.industry) seen.add(item.industry);
  }
  return Array.from(seen);
}

/**
 * 產業案例假資料——後端無法連線或尚無資料時的退回內容。
 *
 * 形狀直接對到真後端的 `PromotionCase`／`PromotionCaseDetail`（見
 * lib/types.ts）：同一筆資料同時滿足兩邊（`PromotionCaseDetail` 只是
 * 多一個 `content` 欄位），列表頁跟詳情頁都從這裡讀同一份。
 *
 * 真後端 `SuccessCase` 沒有「撰稿人」欄位、也沒有掛到真正的
 * `Company` 資料表（`CompanyName` 只是一段自由文字，沒有 logo／
 * 介紹／網址這些欄位可以拉），原本假資料的撰稿人跟「公司簡介輪播」
 * 都拿掉了，見 docs/改版規劃.md。內文（`content`）跟 News/FAQ 一樣
 * 是 Puck 區塊 JSON，交給 `PuckRenderer` 顯示。
 */
export const PROMOTION_FALLBACK_IMAGE = "/images/all/new_logo.jpg";

export const INDUSTRY_CASES: PromotionCaseDetail[] = [
  {
    id: 1,
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    companyName: "示範企業股份有限公司",
    industry: "石化產業",
    coverImageUrl: undefined,
    summary: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
    tags: ["產業AI", "技術文件"],
    publishedDate: "2026-04-15",
    isPublished: true,
    viewCount: 100,
    createdTime: "2026-04-15",
    content: wrapHtmlAsPuckContent(
      "promotion-1",
      "<p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。書中以自行車 AI 工具開發、工具機沉浸展示、循環石材材料研發等跨產業案例，說明設計如何在不確定時代降低創新風險、提升決策精準度，並加速技術與市場需求的連結。</p><p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰。</p>",
    ),
  },
  {
    id: 2,
    title: "AI 智慧安全帽偵測系統導入石化廠",
    companyName: "示範企業股份有限公司",
    industry: "傳統製造業",
    coverImageUrl: undefined,
    summary: "透過電腦視覺即時偵測人員安全裝備佩戴情況，顯著降低工安事故發生率，有效提升工地安全管理效率。",
    tags: ["產業AI", "智慧監控"],
    publishedDate: "2026-04-10",
    isPublished: true,
    viewCount: 86,
    createdTime: "2026-04-10",
    content: wrapHtmlAsPuckContent(
      "promotion-2",
      "<p>透過多點 AI 監控區域結合邊緣運算節點，即時辨識人員安全帽、護目鏡等裝備佩戴情況，未正確佩戴時立即觸發現場聲光警報與中控室通報，降低人力巡檢負擔。</p>",
    ),
  },
  {
    id: 3,
    title: "AIoT 工安監控應用：降低職災風險的關鍵",
    companyName: "示範企業股份有限公司",
    industry: "石化產業",
    coverImageUrl: undefined,
    summary: "整合物聯網感測器與雲端平台，即時掌握廠區環境數據，協助企業提前預警、降低職災發生率。",
    tags: ["AIoT", "工安監控"],
    publishedDate: "2026-03-28",
    isPublished: true,
    viewCount: 64,
    createdTime: "2026-03-28",
    content: wrapHtmlAsPuckContent(
      "promotion-3",
      "<p>透過分佈於廠區各處的物聯網感測器，即時回傳溫度、氣體濃度、人員定位等數據至雲端平台，搭配預警模型提前示警，讓管理人員能在異常發生前介入處理。</p>",
    ),
  },
];

/**
 * 影音專區假資料——2026-09-10 對接真後端 `GET /api/Video`（見
 * `api.server.ts` 的 `fetchVideos`），後端 controller／service／entity
 * 都是完整的，只是目前資料庫是 0 筆、後台也還沒有影片管理頁面可以
 * 新增資料（見 docs/改版規劃.md），所以這份假資料還是會用到——不是
 * 「沒接後端」，是「接了但源頭沒有真資料前，這份假資料繼續當退回
 * 內容」。
 *
 * 形狀直接對到真後端的 `VideoItem`（見 lib/types.ts），跟 News/
 * Promotion 假資料同一套做法：不管資料是真後端來的還是這份假資料，
 * 呼叫端（`/promotion/video`、`HomeVideo`）都是同一套處理邏輯，不用
 * 分兩套。
 *
 * 真後端 `Video` entity 沒有「簡介」「關鍵字標籤」這兩個欄位（跟
 * News/SuccessCase 不一樣），原本假資料每支影片都有一段介紹文字跟
 * 標籤，改版後拿掉了——`FeaturedVideoCard` 的說明文字、卡片上的
 * 關鍵字標籤，真資料時都會是空的，這是真後端目前的欄位限制，不是
 * 忘記接。
 */
export const PROMOTION_VIDEOS: VideoItem[] = [
  {
    id: 1,
    name: "ESG 永續發展實務：石化廠的碳盤查經驗分享",
    thumbnailUri: "/images/home/ser_bg2.jpg",
    linkUrl: "#",
    playOnSite: true,
    published: true,
    ordinal: 1,
    albumTitle: "分類1",
    createdTime: "2026-04-15",
  },
  {
    id: 2,
    name: "AIoT 工安監控應用：降低職災風險的關鍵",
    thumbnailUri: "/images/home/ser_bg2.jpg",
    linkUrl: "#",
    playOnSite: true,
    published: true,
    ordinal: 2,
    albumTitle: "分類2",
    createdTime: "2025-01-19",
  },
  {
    id: 3,
    name: "全方位人員定位追蹤應用",
    thumbnailUri: "/images/home/ser_bg2.jpg",
    linkUrl: "#",
    playOnSite: true,
    published: true,
    ordinal: 3,
    albumTitle: "分類1",
    createdTime: "2025-01-19",
  },
];

export function getIndustryCase(id: string): PromotionCaseDetail | undefined {
  return INDUSTRY_CASES.find((item) => String(item.id) === id);
}
