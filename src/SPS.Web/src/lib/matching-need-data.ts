import type { DemandItem } from "@/lib/types";
import { formatIsoDate } from "@/lib/content-list-utils";

/**
 * 「媒合對接」（`/matching`）的需求，對應設計稿 `page/matching/index.html`（列表）／
 * `show2.html`（詳情，提供解方頁）。資料來自後台「需求張貼管理」維護的 `Demand`
 * （`GET /api/Demand`，見 `fetchDemands`），這裡只負責把後端形狀轉成畫面用的樣子。
 *
 * 設計稿有、但後端的需求目前沒有對應欄位的部分——地點、公開摘要、附件下載——前台不顯示，
 * 等後端補上欄位再接；狀態標籤固定為「徵求中」（前台只看得到已發布的需求）。
 * 設計稿的應用情境／應用範疇／智慧技術三種篩選，需求沒有這幾個欄位，所以搜尋列只有關鍵字有作用。
 */
export interface MatchingNeed {
  id: string;
  statusLabel: string;
  title: string;
  /** 列表卡片的簡短描述（內文開頭） */
  description: string;
  publishedDate: string;
  needCode: string;
  keywords: string[];
  /** 詳情頁內文（純文字，換行分段） */
  body: string;
}

const DESCRIPTION_LENGTH = 120;

export function demandToNeed(demand: DemandItem): MatchingNeed {
  const body = (demand.introduction ?? "").trim();
  const flat = body.replace(/\s+/g, " ");
  return {
    id: String(demand.id),
    statusLabel: "徵求中",
    title: demand.name,
    description: flat.length > DESCRIPTION_LENGTH ? `${flat.slice(0, DESCRIPTION_LENGTH)}…` : flat,
    publishedDate: formatIsoDate(demand.createdTime),
    needCode: demand.number,
    keywords: demand.tagNames ?? [],
    body,
  };
}
