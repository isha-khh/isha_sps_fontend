import type { NewsDetail, NewsItem } from "@/lib/types";
import { formatIsoDate } from "@/lib/content-list-utils";

/**
 * 產業輔導項目（`/tutoring`、`/tutoring/[id]`）。資料來自後台「產業輔導 → 輔導內容」維護的內容——跟公告共用
 * `News` 資料表（`section = 4`），產業別是後台「產業別」分類，申請對象／主辦單位／聯絡電話／撰稿人存在 `News.Meta`；
 * 這裡只負責把後端形狀轉成卡片與詳情頁用的樣子。2026-10-13 從前台寫死的假資料改接真後端，不再有假資料。
 * 內文、附件下載（簡章）、相關連結、聯絡資訊都是後台內容編輯器裡的區塊。
 */
export interface TutoringItem {
  id: string;
  /** 沒有封面圖就是 undefined，卡片不顯示圖片區塊 */
  image?: string;
  title: string;
  description: string;
  keywords: string[];
  applicant: string;
  organizer: string;
  contactPhone: string;
  date: string;
  /** 產業別（後台「產業別」分類名稱）；多選時是第一個 */
  industry: string;
  /** 所有產業別（一則輔導可以屬於多個） */
  industries: string[];
  contributor?: string;
}

export function toTutoringItem(item: NewsItem | NewsDetail): TutoringItem {
  const meta = item.meta ?? {};
  return {
    id: String(item.id),
    image: item.imageUrl || undefined,
    title: item.title,
    description: item.introduction ?? "",
    keywords: item.tags ?? [],
    applicant: meta.applicant ?? "",
    organizer: meta.organizer ?? "",
    contactPhone: meta.contactPhone ?? "",
    date: formatIsoDate(item.startDate ?? item.createdTime),
    industry: item.categoryName ?? "",
    industries: item.categoryNames && item.categoryNames.length > 0 ? item.categoryNames : item.categoryName ? [item.categoryName] : [],
    contributor: meta.contributor || undefined,
  };
}
