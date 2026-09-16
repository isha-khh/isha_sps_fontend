import { withBasePath } from "@/lib/api-client";

/**
 * 「輔助資源」底下兩個平行頁面的假資料，對應設計稿：
 * - page/support/index.html（本計畫補助）：計畫本身的公告消息列表。
 * - page/support/p01.html（政府補助資源）：跟本計畫無關、外部政府
 *   補助方案的卡片列表，點進去是「索取資料協助評估」的表單 modal，
 *   不是文章詳情頁——所以這裡不像 news/serve 做成 list+detail，
 *   兩個都是純列表頁。
 *
 * 目前後端沒有對應的內容類型，先照 news/serve 假資料先行的做法。
 */

export interface SupportApplicantRequirement {
  label: string;
  children?: string[];
}

export interface SupportInfoBlock {
  icon: string;
  title: string;
  items: { label: string; children?: string[] }[];
}

export const SUPPORT_INFO_BLOCKS: SupportInfoBlock[] = [
  {
    icon: "bi-person",
    title: "適用對象",
    items: [
      { label: "符合產業類別", children: ["17石油及煤製品製造業", "18化學材料及肥料製造業", "19其他化學製品製造業"] },
      { label: "依法辦理工廠登記" },
      { label: "須與至少1家具備相關量能之智慧科技業者合作" },
      { label: "非屬銀行拒絕往來戶" },
      { label: "公司淨值應為正值" },
      { label: "不得有陸資投資" },
    ],
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
      { label: "基礎升級 - 上限400萬元" },
      { label: "進階升級 - 上限800萬元" },
    ],
  },
  {
    icon: "bi-telephone",
    title: "聯繫諮詢",
    items: [
      { label: "李先生 - 02-2755-5615 #37" },
      { label: "吳小姐 - 02-2755-5615 #53" },
    ],
  },
];

export const SUPPORT_QUICK_LINKS = [
  { icon: "supp_five_icon01.svg", label: "補助懶人包" },
  { icon: "supp_five_icon02.svg", label: "申請須知" },
  { icon: "supp_five_icon03.svg", label: "計畫書格式" },
  { icon: "supp_five_icon04.svg", label: "線上申請說明" },
  { icon: "supp_five_icon05.svg", label: "常見問答" },
];

export interface SupportAnnouncement {
  id: string;
  date: string;
  title: string;
}

export const SUPPORT_ANNOUNCEMENTS: SupportAnnouncement[] = Array.from({ length: 5 }, (_, index) => ({
  id: String(index + 1),
  date: "2026-04-15",
  title: "114年度石化產業智慧化補助計畫正式開放申請",
}));

export interface SupportResource {
  id: string;
  image: string;
  title: string;
  description: string;
  applicant: string;
  amount: string;
  organizer: string;
  period: string;
  keywords: string[];
  /** 左側欄分類，對應設計稿 page/_uc/side/side1_support.html（數位轉型／設備升級／工安改善） */
  category: string;
}

export const SUPPORT_RESOURCE_CATEGORIES = ["數位轉型", "設備升級", "工安改善"];

export const SUPPORT_RESOURCES: SupportResource[] = [
  {
    id: "1",
    image: withBasePath("/images/all/new_logo.jpg"),
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
    applicant: "製造業（依法登記之公司）",
    amount: "最高補助新臺幣 300 萬元",
    organizer: "經濟部產業發展署",
    period: "2026/01/15 – 2026/03/31",
    keywords: ["數位轉型", "工安改善"],
    category: "數位轉型",
  },
  {
    id: "2",
    image: withBasePath("/images/all/new_logo.jpg"),
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
    applicant: "製造業（依法登記之公司）",
    amount: "最高補助新臺幣 300 萬元",
    organizer: "經濟部產業發展署",
    period: "2026/01/15 – 2026/03/31",
    keywords: ["數位轉型", "工安改善"],
    category: "設備升級",
  },
];
