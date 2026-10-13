import type { NewsDetail, NewsItem } from "@/lib/types";
import { formatIsoDate } from "@/lib/content-list-utils";

/**
 * 人才培育課程（`/talent`、`/talent/[id]`）。資料來自後台「人才培育 → 課程內容」維護的內容——跟公告共用
 * `News` 資料表（`section = 3`），課程專屬的欄位（開課單位、日期區間、講師聯絡人、費用…）存在 `News.Meta`；
 * 這裡只負責把後端形狀轉成表格與詳情頁用的樣子。2026-10-13 從前台寫死的假資料改接真後端，不再有假資料。
 * 內文、附件下載、相關連結都在後台的內容編輯器裡做成區塊。
 */
export interface TalentCourse {
  id: string;
  title: string;
  organizer: string;
  /** 課程日期區間，表格欄位窄，兩個日期要分兩行顯示（見 CourseTable.tsx），不能是單一長字串 */
  dateStart: string;
  dateEnd: string;
  city: string;
  contactName: string;
  contactPhone: string;
  courseCode: string;
  courseDate: string;
  courseTime: string;
  totalHours: string;
  fee: string;
  audience: string;
  location: string;
  hostOrganizer: string;
  executor: string;
  keywords: string[];
  /** 對應「熱門課程」側欄的「剩餘 X 名」；後台沒填就是 undefined，側欄不顯示名額 */
  remainingSeats?: number;
  /** 課程公告上架日期，跟 dateStart/dateEnd（課程實際上課日期區間）是兩回事，對應「熱門課程」側欄顯示的日期 */
  postedDate: string;
  /** 「立即報名」連去的網址；後台沒填就不顯示按鈕 */
  registerUrl?: string;
}

/** 後台日期欄位存 `YYYY-MM-DD`，前台課程日期顯示成 `YYYY/MM/DD` */
function slashDate(value?: string): string {
  return value ? value.replaceAll("-", "/") : "";
}

function parseSeats(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/** 只放行 http／https 網址，避免後台誤填 `javascript:` 之類的值變成可點擊的連結 */
function safeUrl(value?: string): string | undefined {
  return value && /^https?:\/\//i.test(value) ? value : undefined;
}

export function toTalentCourse(item: NewsItem | NewsDetail): TalentCourse {
  const meta = item.meta ?? {};
  return {
    id: String(item.id),
    title: item.title,
    organizer: meta.organizer ?? "",
    dateStart: slashDate(meta.dateStart),
    dateEnd: slashDate(meta.dateEnd),
    city: meta.city ?? "",
    contactName: meta.contactName ?? "",
    contactPhone: meta.contactPhone ?? "",
    courseCode: meta.courseCode ?? "",
    courseDate: meta.courseDate ?? "",
    courseTime: meta.courseTime ?? "",
    totalHours: meta.totalHours ?? "",
    fee: meta.fee ?? "",
    audience: meta.audience ?? "",
    location: meta.location ?? "",
    hostOrganizer: meta.hostOrganizer ?? "",
    executor: meta.executor ?? "",
    keywords: item.tags ?? [],
    remainingSeats: parseSeats(meta.remainingSeats),
    postedDate: formatIsoDate(item.startDate ?? item.createdTime),
    registerUrl: safeUrl(meta.registerUrl),
  };
}
