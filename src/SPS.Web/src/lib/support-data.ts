import type { NewsItem } from "@/lib/types";
import { formatIsoDate } from "@/lib/content-list-utils";

/**
 * 「補助資源」底下兩個平行頁面的假資料，對應設計稿：
 * - page/support/index.html（本計畫補助）：計畫本身的公告消息列表。
 * - page/support/p01.html（政府補助資源）：跟本計畫無關、外部政府
 *   補助方案的卡片列表，點進去是「索取資料協助評估」的表單 modal，
 *   不是文章詳情頁——所以這裡不像 news/serve 做成 list+detail，
 *   兩個都是純列表頁。
 *
 * 本計畫補助的公告列表與政府補助資源都來自後台（`News` 資料表）；四個資訊區塊（適用對象／補助類別／補助金額／
 * 聯繫諮詢）是這個計畫的固定說明文字，目前仍寫在這個檔案裡。
 */

export interface SupportApplicantRequirement {
  label: string;
  children?: string[];
}

export interface SupportInfoBlock {
  icon: string;
  title: string;
  items: { label: string; children?: string[]; phone?: string; email?: string }[];
  /** 區塊底部的「完整內容請參閱〈…〉」：連到對應的下載資源（後台「下載資源」的 key） */
  fullTextLink?: { resourceKey: string; label: string };
}

export const SUPPORT_INFO_BLOCKS: SupportInfoBlock[] = [
  {
    icon: "bi-person",
    title: "適用對象",
    items: [
      { label: "符合產業類別", children: ["17石油及煤製品製造業", "18化學材料及肥料製造業", "19其他化學製品製造業"] },
    ],
    // 2026-10-05 設計稿：其他資格條件不在這裡逐條列，改請讀者看申請須知
    fullTextLink: { resourceKey: "support-notice", label: "申請須知" },
  },
  {
    icon: "bi-card-checklist",
    title: "補助類別",
    items: [
      { label: "基礎升級", children: ["導入感測技術和物聯網（IoT），幫助管理者迅速掌握工廠運行情況，並在發生異常時及時反應"] },
      { label: "進階升級", children: ["運用人工智慧技術，透過深度學習、數據分析等技術，幫助工廠預測和防範安全風險"] },
    ],
  },
  {
    icon: "bi-currency-dollar",
    title: "補助金額",
    items: [
      { label: "基礎升級 - 上限400萬元", children: ["每案申請補助款以新臺幣400萬元為上限，且政府經費不得超過總計畫經費之50%"] },
      { label: "進階升級 - 上限800萬元", children: ["每案申請補助款以新臺幣800萬元為上限，且政府經費不得超過總計畫經費之50%"] },
    ],
  },
  {
    icon: "bi-telephone",
    title: "聯繫諮詢",
    items: [
      { label: "李先生", phone: "02-2755-5615 #37", email: "03421@cpc.org.tw" },
      { label: "吳小姐", phone: "02-2755-5615 #53", email: "03398@cpc.org.tw" },
    ],
  },
];

/**
 * 補助專區下方的五個快速連結。`resourceKey` 對應後台「頁面設定 → 下載資源」的項目
 * （後端 `DownloadResourceCatalog` 的 key）：檔案與格式（Word／ODF／PDF）或外部連結由後台維護，
 * 這裡只決定圖示、文字與對應哪個項目。
 */
export const SUPPORT_QUICK_LINKS = [
  { icon: "supp_five_icon01.svg", label: "補助懶人包", resourceKey: "support-leaflet" },
  { icon: "supp_five_icon02.svg", label: "申請須知", resourceKey: "support-notice" },
  { icon: "supp_five_icon03.svg", label: "計畫書格式", resourceKey: "support-plan" },
  { icon: "supp_five_icon04.svg", label: "線上申請說明", resourceKey: "support-online-guide" },
  { icon: "supp_five_icon05.svg", label: "常見問答", resourceKey: "support-qa" },
];

export interface SupportAnnouncement {
  id: string;
  date: string;
  title: string;
}

/** 後台「補助專區 → 補助公告」（`News` 資料表，`section = 2`）轉成列表用的樣子 */
export function toSupportAnnouncement(item: NewsItem): SupportAnnouncement {
  return { id: String(item.id), date: formatIsoDate(item.startDate ?? item.createdTime), title: item.title };
}

export interface SupportResource {
  id: string;
  /** 沒有封面圖就是 undefined，卡片不顯示圖片區塊 */
  image?: string;
  title: string;
  description: string;
  applicant: string;
  amount: string;
  organizer: string;
  period: string;
  keywords: string[];
  /** 後台「補助資源分類」名稱 */
  category: string;
}

/**
 * 政府補助資源（`News` 資料表，`section = 5`）：適用對象／補助金額／主辦單位／申請期間存在 `News.Meta`，
 * 分類是後台「補助資源分類」。2026-10-13 從前台寫死的假資料改接真後端，不再有假資料。
 */
export function toSupportResource(item: NewsItem): SupportResource {
  const meta = item.meta ?? {};
  return {
    id: String(item.id),
    image: item.imageUrl || undefined,
    title: item.title,
    description: item.introduction ?? "",
    applicant: meta.applicant ?? "",
    amount: meta.amount ?? "",
    organizer: meta.organizer ?? "",
    period: meta.period ?? "",
    keywords: item.tags ?? [],
    category: item.categoryName ?? "",
  };
}
