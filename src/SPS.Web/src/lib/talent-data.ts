import { withBasePath } from "@/lib/api-client";

/**
 * 「人才培訓」課程假資料，對應設計稿 page/talent/index.html（表格
 * 列表）／page/talent/show.html（詳情）。目前後端沒有對應的內容
 * 類型，先照 news/serve 假資料先行的做法，之後接真後端時只換這個
 * 檔案。
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
  /** 對應設計稿「熱門課程」側欄的「剩餘 X 名」 */
  remainingSeats: number;
  /** 課程公告上架日期，跟 dateStart/dateEnd（課程實際上課日期區間）是兩回事，對應「熱門課程」側欄顯示的日期 */
  postedDate: string;
  bodyHtml: string;
}

export const TALENT_FALLBACK_IMAGE = withBasePath("/images/all/new_logo.jpg");

export const TALENT_COURSES: TalentCourse[] = Array.from({ length: 3 }, (_, index) => ({
  id: String(index + 1),
  title: "AI智慧基礎與淨零永續實作",
  organizer: "財團法人工業技術研究院南分院",
  dateStart: "2026/06/25",
  dateEnd: "2026/08/31",
  city: "臺南市",
  contactName: "許佩昱",
  contactPhone: "06-3847108",
  courseCode: "115SE048",
  courseDate: "2026/10/20~2026/10/20",
  courseTime: "09:30~16:00",
  totalHours: "6 小時",
  fee: "免費",
  audience: "具備AI導入1年以上經驗之輔導團成員",
  location: "集思台中新烏日會議中心4F富蘭克林廳（臺中市烏日區高鐵東1路26號-4F）",
  hostOrganizer: "經濟部產業發展署",
  executor: "精密機械研究發展中心",
  keywords: ["產業AI", "技術文件"],
  remainingSeats: 6,
  postedDate: "2026-04-15",
  bodyHtml:
    "<p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。書中以自行車 AI 工具開發、工具機沉浸展示、循環石材材料研發等跨產業案例，說明設計如何在不確定時代降低創新風險、提升決策精準度，並加速技術與市場需求的連結。</p><p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰（Gutsche，2021）。</p>",
}));

export function getTalentCourse(id: string): TalentCourse | undefined {
  return TALENT_COURSES.find((item) => item.id === id);
}
