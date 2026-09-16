import type { AttachmentLink } from "@/components/ui/AttachmentsPanel";

/**
 * 「媒合對接」（`/matching`）假資料，對應設計稿 `page/matching/index.html`
 * （列表）／`page/matching/show2.html`（詳情，提供解方頁）。跟
 * `matching-data.ts`（企業名錄）是同一支設計但不同內容類型——企業名錄
 * 是「公司」，這裡是企業/單位刊登出來、待其他企業提供解方的「需求」，
 * 目前後端沒有對應的內容類型，先照 news/serve 假資料先行的做法。
 *
 * `keywords`／應用情境／應用範疇／智慧技術三種篩選標籤跟企業名錄共用
 * 同一份分類定義（`APPLICATION_SCENARIOS`／`APPLICATION_SCOPES`／
 * `TECH_ATTRIBUTE_GROUPS`，見 `matching-data.ts`），這裡不重複定義。
 */
export interface MatchingNeed {
  id: string;
  statusLabel: string;
  title: string;
  /** 列表卡片的簡短描述 */
  description: string;
  location: string;
  publishedDate: string;
  needCode: string;
  keywords: string[];
  /** 詳情頁「公開摘要」，對應設計稿 `.public_box`（跟列表 description 是分開的兩段文字） */
  summary: string;
  bodyHtml: string;
  /** 詳情頁「附件下載」，對應 `page/news/_uc/dot.html`——這頁只有附件，沒有相關連結/聯繫人資訊區塊 */
  attachments: AttachmentLink[];
}

export const MATCHING_NEEDS: MatchingNeed[] = Array.from({ length: 2 }, (_, index) => ({
  id: String(index + 1),
  statusLabel: "狀態標籤",
  title: "114年度石化產業智慧化補助計畫正式開放申請",
  description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
  location: "高雄市小港區",
  publishedDate: "2026-04-15",
  needCode: `REO-202508-0${11 + index}`,
  keywords: ["產業AI", "技術文件"],
  summary: "專注於提供企業數位轉型與智慧工安解決方案，協助客戶優化營運流程、降低風險並提升作業效率。",
  bodyHtml:
    "<p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。書中以自行車 AI 工具開發、工具機沉浸展示、循環石材材料研發等跨產業案例，說明設計如何在不確定時代降低創新風險、提升決策精準度，並加速技術與市場需求的連結。</p><p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰（Gutsche，2021）。</p>",
  attachments: [
    { name: "附件名稱附件.pdf", href: "#" },
    { name: "附件名稱附件名稱附件名稱.pdf", href: "#" },
    { name: "附件名稱附件名稱.pdf", href: "#" },
  ],
}));

export function getMatchingNeed(id: string): MatchingNeed | undefined {
  return MATCHING_NEEDS.find((item) => item.id === id);
}
