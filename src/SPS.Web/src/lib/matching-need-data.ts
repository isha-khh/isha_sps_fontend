import type { DemandItem } from "@/lib/types";
import { formatIsoDate } from "@/lib/content-list-utils";
import type { AttachmentLink } from "@/components/ui/AttachmentsPanel";

/**
 * 「媒合對接」（`/matching`）的需求，對應設計稿 `page/matching/index.html`（列表）／
 * `show2.html`（詳情，提供解方頁）。資料來自後台「需求張貼管理」維護的 `Demand`
 * （`GET /api/Demand`，見 `fetchDemands`），這裡只負責把後端形狀轉成畫面用的樣子。
 *
 * 地點、公開摘要、附件由後台「需求張貼管理」填寫；完整內容與附件只有登入的企業會員看得到
 * （設計稿的「企業會員可見完整內容」），其他人只看得到公開摘要。狀態標籤固定為「徵求中」（前台只看得到已發布的需求）。
 */
export interface MatchingNeed {
  id: string;
  statusLabel: string;
  title: string;
  /** 列表卡片的簡短描述（內文開頭） */
  description: string;
  publishedDate: string;
  needCode: string;
  /** 追蹤此需求的人數；只有供應端會員拿得到，其他人是 null */
  followerCount: number | null;
  /** 需求的標籤（後台「需求張貼管理」勾選），點進去看有同樣標籤的需求 */
  tags: { id: number; name: string }[];
  /** 詳情頁內文（純文字，換行分段）；沒有權限看完整內容時是空字串 */
  body: string;
  location: string;
  /** 沒有權限（匿名、個人會員）看完整內容與附件，詳情頁顯示登入提示 */
  contentLocked: boolean;
  attachments: AttachmentLink[];
}

export function demandToNeed(demand: DemandItem): MatchingNeed {
  return {
    id: String(demand.id),
    statusLabel: "徵求中",
    title: demand.name,
    // 摘要由後端決定（公開摘要，沒填就取內容開頭），匿名也看得到
    description: demand.summary ?? "",
    publishedDate: formatIsoDate(demand.publishedTime ?? demand.createdTime),
    needCode: demand.number,
    followerCount: demand.followerCount ?? null,
    tags: (demand.tagIds ?? []).map((id, index) => ({ id, name: demand.tagNames?.[index] ?? "" })).filter((t) => t.name),
    body: (demand.introduction ?? "").trim(),
    location: (demand.location ?? "").trim(),
    contentLocked: demand.contentLocked,
    attachments: (demand.attachments ?? []).map((a) => ({ name: `${a.fileName}（${a.formattedFileSize}）`, href: a.url })),
  };
}
