import type { NewsItem } from "@/lib/types";
import { formatIsoDate } from "@/lib/content-list-utils";

/**
 * 服務專區（`/serve`）。資料來自後台「服務專區」維護的內容——跟公告共用同一張資料表（`News`，`section = 1`），
 * 分類是後台「服務專區分類」（`CategoryType.Serve`）；這裡只負責把後端形狀轉成列表卡片用的樣子。
 * 2026-10-13 從前台寫死的假資料改接真後端，不再有假資料。
 *
 * 前台主選單（`Headers.tsx`）的「服務專區」只有「技術工具」這一組（產業AI、技術文件）連來這一頁
 * （`/serve?category=<分類名稱>`）；人才培育、產業輔導、補助資源各有自己的頁面。所以後台「服務專區分類」
 * 要建立的就是這兩個，**名稱要跟選單一致**（產業AI、技術文件），前台用名稱對應分類。
 */
export interface ServeCardItem {
  id: number;
  category: string;
  date: string;
  title: string;
  description: string;
  /** 沒有封面圖就是 undefined，卡片不顯示圖片區塊（不再用 logo 當假圖） */
  image?: string;
  keywords: string[];
  /** 有沒有附件（卡片顯示「下載文件」）；附件本身要填完下載表單才看得到 */
  hasAttachments: boolean;
}

export function toServeCardItem(item: NewsItem): ServeCardItem {
  return {
    id: item.id,
    category: item.categoryName,
    date: formatIsoDate(item.startDate ?? item.createdTime),
    title: item.title,
    description: item.introduction,
    image: item.imageUrl || undefined,
    keywords: item.tags ?? [],
    hasAttachments: (item.attachmentCount ?? 0) > 0,
  };
}
