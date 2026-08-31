import type { NewsListCardMeta } from "@/components/news/NewsListCard";

export interface LinkListItem {
  href: string;
  label: string;
}

export interface NewsArticle {
  id: string;
  category: string;
  date: string;
  /** 例如「活動進行中」，列表頁跟詳情頁都會用到 */
  status?: string;
  title: string;
  /** 列表頁用的摘要 */
  description: string;
  /** 列表頁「活動時間／地點」條列，詳情頁不用 */
  meta?: NewsListCardMeta[];
  image: string;
  /** 詳情頁專用欄位 */
  keywords?: string[];
  contributor?: string;
  /** CMS 文章編輯器（CKEditor）產出的 HTML，之後接真的 CMS 資料時就是這個形狀 */
  bodyHtml: string;
  attachments?: LinkListItem[];
  relatedLinks?: LinkListItem[];
}

/**
 * 新聞假資料——單一資料來源，`/news`（列表）跟 `/news/[id]`（詳情）
 * 都從這裡讀，不要各自複製一份，不然改一個字要改兩個地方。
 * 之後接真的 CMS／API 時，把這個檔案換成真正的資料取得函式就好，
 * 兩個頁面的元件不用動。
 */
export const NEWS_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    category: "活動資訊",
    date: "2026-04-15",
    status: "活動進行中",
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "本計畫提供最高500萬元補助，協助企業導入AIoT、5G等智慧化技術，申請截止日期為7月31日。",
    meta: [
      { icon: "calendar", text: "2026.4.15(四)09:00-16:30" },
      { icon: "geo", text: "台北國際會議中心101會議室" },
    ],
    image: "/images/all/new_logo.jpg",
    keywords: ["產業AI", "技術文件"],
    contributor: "設計研發組研究員 郭憶璇、江宛庭",
    bodyHtml: `
      <p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。書中以自行車 AI 工具開發、工具機沉浸展示、循環石材材料研發等跨產業案例，說明設計如何在不確定時代降低創新風險、提升決策精準度，並加速技術與市場需求的連結。</p>
      <p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰（Gutsche，2021）。</p>
    `,
    attachments: [
      { href: "#", label: "114年度智慧化補助計畫公告.pdf" },
      { href: "#", label: "申請書表下載.pdf" },
      { href: "#", label: "常見問答集.pdf" },
    ],
    relatedLinks: [
      { href: "#", label: "經濟部產業發展署" },
      { href: "#", label: "智慧化補助線上申請系統" },
    ],
  },
  {
    id: "2",
    category: "產業新知",
    date: "2026-04-10",
    title: "AI 視覺辨識技術於石化廠工安巡檢的應用趨勢",
    description: "彙整國內外導入案例，說明電腦視覺結合物聯網感測器，如何協助降低巡檢人力負擔並提升異常偵測速度。",
    image: "/images/all/new_logo.jpg",
    keywords: ["電腦視覺", "工安監控"],
    contributor: "技術輔導組研究員 林哲宇",
    bodyHtml: `
      <p>彙整國內外導入案例，說明電腦視覺結合物聯網感測器，如何協助降低巡檢人力負擔並提升異常偵測速度，並針對導入時常見的資料標註與現場光源問題提出建議做法。</p>
    `,
    attachments: [{ href: "#", label: "案例彙整報告.pdf" }],
  },
  {
    id: "3",
    category: "外部消息",
    date: "2026-03-28",
    title: "經濟部產業發展署公告 114 年度智慧化補助說明會場次",
    description: "說明會將於全台北中南三場舉辦，歡迎有意申請補助的企業報名參加，現場並提供一對一諮詢服務。",
    image: "/images/all/new_logo.jpg",
    bodyHtml: `
      <p>說明會將於全台北中南三場舉辦，歡迎有意申請補助的企業報名參加，現場並提供一對一諮詢服務，詳細場次時間請參閱附件。</p>
    `,
    relatedLinks: [{ href: "#", label: "經濟部產業發展署官網" }],
  },
];

export function getNewsArticle(id: string): NewsArticle | undefined {
  return NEWS_ARTICLES.find((article) => article.id === id);
}
