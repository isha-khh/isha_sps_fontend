export interface FaqCategory {
  label: string;
  href: string;
}

export interface FaqItem {
  category: string;
  question: string;
  answer: string;
}

/**
 * 常見問題假資料——單一資料來源，`/faq` 頁跟側欄分類清單都從這裡讀。
 * 對應舊站 page/_uc/side/side1_faq.html 列的四個分類；舊站範例
 * page/faq/index.html 只給了 3 題示範內容（都屬於「平台與服務說明」），
 * 其他三個分類目前沒有範例文字，這裡先各補一題合理的假資料，讓分類
 * 篩選看得出真的有作用，不是點了都一樣空白。
 */
export const FAQ_CATEGORIES: FaqCategory[] = [
  { label: "平台與服務說明", href: "/faq?category=平台與服務說明" },
  { label: "會員申請與資格說明", href: "/faq?category=會員申請與資格說明" },
  { label: "功能操作與資訊查詢", href: "/faq?category=功能操作與資訊查詢" },
  { label: "帳號與登入相關問題", href: "/faq?category=帳號與登入相關問題" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: "平台與服務說明",
    question: "智慧石化媒合平台的建置目的與主要功能為何？",
    answer:
      "本平台建置目的在於整合石化產業智慧化技術、人才與資源，協助企業快速掌握補助計畫、技術文件與媒合對象。主要功能包含公告資訊查詢、服務資源媒合、技術案例展示與會員專屬服務。",
  },
  {
    category: "平台與服務說明",
    question: "平台在智慧工安推動中所扮演的角色為何？",
    answer: "平台扮演資訊整合與媒合的角色，串接政府補助資源、技術服務廠商與企業需求，協助產業更快速導入智慧化工安解決方案。",
  },
  {
    category: "平台與服務說明",
    question: "哪些產業與對象適合使用智慧石化媒合平台？",
    answer: "凡從事石化相關製造、加工、倉儲、運輸的企業，以及提供智慧化工安技術、設備或顧問服務的廠商，都適合使用本平台。",
  },
  {
    category: "會員申請與資格說明",
    question: "哪些單位可以申請成為會員？",
    answer: "凡依法登記營業、實際從事石化相關產業或智慧化技術服務的企業或機構，皆可提出會員申請，實際資格以審核結果為準。",
  },
  {
    category: "功能操作與資訊查詢",
    question: "如何查詢歷年計畫申請與補助資訊？",
    answer: "可透過「公告事項」頁面依分類與關鍵字查詢歷年公告，或於「服務專區」查看對應的技術文件與申請說明。",
  },
  {
    category: "帳號與登入相關問題",
    question: "忘記密碼該怎麼辦？",
    answer: "請至會員中心登入頁點選「忘記密碼」，依指示輸入註冊信箱，系統會寄送重設密碼連結至您的信箱。",
  },
];
