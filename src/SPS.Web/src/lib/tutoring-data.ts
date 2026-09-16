import { withBasePath } from "@/lib/api-client";
import type { AttachmentLink, ContactInfo } from "@/components/ui/AttachmentsPanel";

/**
 * 「產業輔導」假資料，對應設計稿 page/tutoring/index.html（列表）／
 * page/tutoring/show.html（詳情）。目前後端沒有對應的內容類型，
 * 照 news/serve 假資料先行的做法，之後接真後端時只換這個檔案。
 */
export interface TutoringItem {
  id: string;
  image: string;
  title: string;
  description: string;
  keywords: string[];
  applicant: string;
  organizer: string;
  contactPhone: string;
  date: string;
  category: string;
  /** 左側欄「產業別」分類，對應設計稿 page/_uc/side/side1_tutoring.html（石化業／塑膠製品／化學材料） */
  industry: string;
  contributor?: string;
  bodyHtml: string;
  /** 對應詳情頁「附件下載／相關連結／聯繫人資訊」（page/news/_uc/dot.html、link.html、cont.html），見 AttachmentsPanel.tsx */
  attachments: AttachmentLink[];
  relatedLinks: AttachmentLink[];
  contact: ContactInfo;
}

export const TUTORING_FALLBACK_IMAGE = withBasePath("/images/all/new_logo.jpg");

/** 對應 side1_tutoring.html 的三個產業別分類，「石化業」是設計稿預設的 active 分類 */
export const TUTORING_INDUSTRIES = ["石化業", "塑膠製品", "化學材料"];

export const TUTORING_ITEMS: TutoringItem[] = Array.from({ length: 2 }, (_, index) => ({
  id: String(index + 1),
  image: TUTORING_FALLBACK_IMAGE,
  title: "114年度石化產業智慧化補助計畫正式開放申請",
  description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
  keywords: ["產業AI", "技術文件"],
  applicant: "製造業（依法登記之公司）",
  organizer: "經濟部產業發展署",
  contactPhone: "+886-7-550-3115",
  date: "2026-04-15",
  category: "活動資訊",
  industry: TUTORING_INDUSTRIES[index] ?? TUTORING_INDUSTRIES[0],
  contributor: "設計研發組研究員 郭憶璇、江宛庭",
  bodyHtml:
    "<p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。書中以自行車 AI 工具開發、工具機沉浸展示、循環石材材料研發等跨產業案例，說明設計如何在不確定時代降低創新風險、提升決策精準度，並加速技術與市場需求的連結。</p><p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰（Gutsche，2021）。</p>",
  attachments: [
    { name: "附件名稱附件.pdf", href: "#" },
    { name: "附件名稱附件名稱附件名稱.pdf", href: "#" },
    { name: "附件名稱附件名稱.pdf", href: "#" },
  ],
  relatedLinks: [
    { name: "相關連結名稱相關連結名稱", href: "#" },
    { name: "相關連結名稱相關連結名稱相關連結名稱", href: "#" },
    { name: "相關連結名稱相關", href: "#" },
  ],
  contact: {
    phone: "+886-7-550-3115",
    email: "isha_khh@mail.isha.org.tw",
    address: "813707 高雄市左營區博愛三路12號15樓",
    addressMapUrl: "https://maps.app.goo.gl/iZ6rqmW5CcSKJgp17",
  },
}));

export function getTutoringItem(id: string): TutoringItem | undefined {
  return TUTORING_ITEMS.find((item) => item.id === id);
}
