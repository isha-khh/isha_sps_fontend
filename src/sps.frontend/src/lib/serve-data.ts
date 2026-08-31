export interface ServeItem {
  id: string;
  category: string;
  date: string;
  title: string;
  description: string;
  image: string;
  keywords?: string[];
  contributor?: string;
  bodyHtml: string;
}

/**
 * 服務專區假資料，跟 news-data.ts 是一樣的做法：`/serve` 列表跟
 * `/serve/[id]` 詳情共用同一份，之後接真的 CMS 資料時只換這個檔案。
 */
export const SERVE_ITEMS: ServeItem[] = [
  {
    id: "1",
    category: "技術工具",
    date: "2026-04-15",
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
    image: "/images/all/new_logo.jpg",
    keywords: ["產業AI", "技術文件"],
    contributor: "設計研發組研究員 郭憶璇、江宛庭",
    bodyHtml: `
      <p>設計已不只是產品外觀與美學工具，而是協助企業理解市場、整合技術、回應永續議題，建立創新策略的核心驅動力。台灣設計研究院《產業設計創新趨勢與應用方法》提出「設計驅動產業創新模式」，涵蓋三大執行階段：瞭解現況與趨勢、發展解決方案、建構產品策略與迭代。</p>
      <p>世界改變的速度大幅加快，產業不僅要回應市場，也必須面對數位轉型、環境永續與社會責任等多重挑戰。過往所仰賴的開發模式與營運策略，已難以因應變化快速的市場，因此產業需具備新的思維與方法來面對未來的不確定性與轉型挑戰（Gutsche，2021）。</p>
    `,
  },
  {
    id: "2",
    category: "人才培育",
    date: "2026-04-10",
    title: "智慧化人才培訓課程即日起開放報名",
    description: "提供專業人才培訓方案，協助提升產業競爭力與技術能量，課程結業另有補助資格認證。",
    image: "/images/all/new_logo.jpg",
    keywords: ["培訓課程"],
    bodyHtml: `<p>提供專業人才培訓方案，協助提升產業競爭力與技術能量，課程結業另有補助資格認證，詳細課綱請下載附件。</p>`,
  },
  {
    id: "3",
    category: "產業輔導",
    date: "2026-03-28",
    title: "跨領域專家團隊進場輔導申請說明",
    description: "安排跨領域專家團隊進場輔導，協助診斷升級瓶頸與提供解決策略。",
    image: "/images/all/new_logo.jpg",
    keywords: ["專家諮詢"],
    bodyHtml: `<p>安排跨領域專家團隊進場輔導，協助診斷升級瓶頸與提供解決策略，申請流程與資格請參閱下載文件。</p>`,
  },
  {
    id: "4",
    category: "輔助資源",
    date: "2026-03-12",
    title: "中央與地方補助資源整合手冊",
    description: "整合中央與地方各項專案補助資源，減輕企業研發與數位轉型負擔。",
    image: "/images/all/new_logo.jpg",
    keywords: ["補助申請"],
    bodyHtml: `<p>整合中央與地方各項專案補助資源，減輕企業研發與數位轉型負擔，內容每季更新，請下載最新版手冊。</p>`,
  },
];

export function getServeItem(id: string): ServeItem | undefined {
  return SERVE_ITEMS.find((item) => item.id === id);
}
