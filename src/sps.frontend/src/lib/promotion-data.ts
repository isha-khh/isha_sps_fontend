export interface IndustryCase {
  id: string;
  title: string;
  description: string;
  image: string;
  date: string;
  views: number;
  category: string;
  keywords?: string[];
  contributor?: string;
  bodyHtml: string;
}

export interface PromotionVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  keywords?: string[];
}

/**
 * 推廣專區假資料——單一資料來源，`/promotion`（產業案例列表）、
 * `/promotion/[id]`（案例詳情）、`/promotion/video`（影音專區）都從這裡
 * 讀。分類名稱（分類1／分類2）照舊站 side1_industry.html 原樣保留——
 * 那本來就是客戶還沒填的預留分類名稱，不是我們遷移時漏填，所以沒有
 * 另外幫忙取名字。
 */
export const INDUSTRY_CASES: IndustryCase[] = [
  {
    id: "1",
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
    image: "/images/all/new_logo.jpg",
    date: "2026-04-15",
    views: 100,
    category: "分類1",
    keywords: ["產業AI", "技術文件"],
    contributor: "設計研發組研究員 郭憶璇、江宛庭",
    bodyHtml: `
      <p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。書中以自行車 AI 工具開發、工具機沉浸展示、循環石材材料研發等跨產業案例，說明設計如何在不確定時代降低創新風險、提升決策精準度，並加速技術與市場需求的連結。</p>
      <p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰（Gutsche，2021）。</p>
    `,
  },
  {
    id: "2",
    title: "AI 智慧安全帽偵測系統導入石化廠",
    description: "透過電腦視覺即時偵測人員安全裝備佩戴情況，顯著降低工安事故發生率，有效提升工地安全管理效率。",
    image: "/images/all/new_logo.jpg",
    date: "2026-04-10",
    views: 86,
    category: "分類2",
    keywords: ["產業AI", "智慧監控"],
    contributor: "設計研發組研究員 郭憶璇、江宛庭",
    bodyHtml: `<p>透過多點 AI 監控區域結合邊緣運算節點，即時辨識人員安全帽、護目鏡等裝備佩戴情況，未正確佩戴時立即觸發現場聲光警報與中控室通報，降低人力巡檢負擔。</p>`,
  },
  {
    id: "3",
    title: "AIoT 工安監控應用：降低職災風險的關鍵",
    description: "整合物聯網感測器與雲端平台，即時掌握廠區環境數據，協助企業提前預警、降低職災發生率。",
    image: "/images/all/new_logo.jpg",
    date: "2026-03-28",
    views: 64,
    category: "分類1",
    keywords: ["AIoT", "工安監控"],
    contributor: "設計研發組研究員 郭憶璇、江宛庭",
    bodyHtml: `<p>透過分佈於廠區各處的物聯網感測器，即時回傳溫度、氣體濃度、人員定位等數據至雲端平台，搭配預警模型提前示警，讓管理人員能在異常發生前介入處理。</p>`,
  },
];

export const PROMOTION_VIDEOS: PromotionVideo[] = [
  {
    id: "1",
    title: "ESG 永續發展實務：石化廠的碳盤查經驗分享",
    description: "本集探討 AI 技術如何應用於工廠安全管理，透過即時監測、風險預警與數據分析，有效提升作業安全與營運效率，打造更智能、更安全的工作環境。",
    thumbnail: "/images/home/ser_bg2.jpg",
    date: "2026-04-15",
    keywords: ["產業AI", "技術文件"],
  },
  {
    id: "2",
    title: "AIoT 工安監控應用：降低職災風險的關鍵",
    description: "整合物聯網與雲端技術，打造安全、穩定且可擴充的系統平台，協助企業落實智慧化管理。",
    thumbnail: "/images/home/ser_bg2.jpg",
    date: "2025-01-19",
    keywords: ["AIoT", "工安監控"],
  },
  {
    id: "3",
    title: "全方位人員定位追蹤應用",
    description: "透過室內定位技術即時掌握人員位置，強化緊急應變效率與人員安全管理。",
    thumbnail: "/images/home/ser_bg2.jpg",
    date: "2025-01-19",
    keywords: ["智慧監控"],
  },
];

export function getIndustryCase(id: string): IndustryCase | undefined {
  return INDUSTRY_CASES.find((item) => item.id === id);
}
