import type { BadgeStyle, NewsDetail, NewsItem } from "@/lib/types";
import { tagBadgesOf } from "@/lib/badge-style";
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
  coOrganizer: string;
  executor: string;
  keywords: string[];
  /** 與 keywords 一一對應的標籤徽章顏色（後台「標籤管理」設定） */
  keywordBadges?: (BadgeStyle | null | undefined)[];
  /** 後台「熱門課程排序」（數字越小越前面）；有值就列入前台「熱門課程」側欄，沒填是 undefined */
  popularOrder?: number;
  /** 課程公告上架日期，跟 dateStart/dateEnd（課程實際上課日期區間）是兩回事，對應「熱門課程」側欄顯示的日期 */
  postedDate: string;
  /** 「立即報名」連去的網址；後台沒填就不顯示按鈕 */
  registerUrl?: string;
}

/** 後台日期欄位存 `YYYY-MM-DD`，前台課程日期顯示成 `YYYY/MM/DD` */
function slashDate(value?: string): string {
  return value ? value.replaceAll("-", "/") : "";
}

function parseOrder(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/** 課程的排序時間：開課起日（YYYY-MM-DD），沒填就用公告上架日期、再退回建立時間 */
function courseTime(item: NewsItem | NewsDetail): string {
  return item.meta?.dateStart ?? item.startDate ?? item.createdTime ?? "";
}

/**
 * 課程表格的排序：不手動維護，一律依時間——開課起日由新到舊（沒填開課起日的用上架日期），
 * 同一天的再用建立時間由新到舊，順序才穩定。
 */
export function sortCoursesByDate<T extends NewsItem | NewsDetail>(items: T[]): T[] {
  return items.slice().sort((a, b) => courseTime(b).localeCompare(courseTime(a)) || (b.createdTime ?? "").localeCompare(a.createdTime ?? ""));
}

/**
 * 「熱門課程」側欄的課程：獨立於表格排序，由後台課程的「熱門課程排序」決定——有填數字的列入，數字小的在前（最多 `limit` 筆，同數字的新課程在前）。
 * 後台還沒有任何課程填排序時，退回瀏覽數最高的課程，側欄才不會一下子消失。
 */
export function pickPopularCourses<T extends NewsItem | NewsDetail>(items: T[], limit = 5): T[] {
  const marked = items.filter((item) => parseOrder(item.meta?.popularOrder) !== undefined);
  if (marked.length > 0) {
    return marked
      .slice()
      .sort((a, b) => parseOrder(a.meta?.popularOrder)! - parseOrder(b.meta?.popularOrder)! || courseTime(b).localeCompare(courseTime(a)))
      .slice(0, limit);
  }
  return items
    .slice()
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, limit);
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
    coOrganizer: meta.coOrganizer ?? "",
    executor: meta.executor ?? "",
    keywords: item.tags ?? [],
    keywordBadges: tagBadgesOf(item),
    popularOrder: parseOrder(meta.popularOrder),
    postedDate: formatIsoDate(item.startDate ?? item.createdTime),
    registerUrl: safeUrl(meta.registerUrl),
  };
}
