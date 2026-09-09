import { wrapHtmlAsPuckContent } from "@/lib/puck-content";
import type { FaqItem } from "@/lib/types";

export type { FaqItem };

export interface FaqCategory {
  id: number;
  name: string;
}

/**
 * 分類清單不是另外拉一支 `/api/Category` API 出來的固定清單，而是直接
 * 從「畫面上有哪些 FAQ」反推「所以有哪些分類」——原因是真後端的
 * `categoryId`（例如 20）跟這裡假資料隨便編的 id 不會是同一組數字，
 * 如果分類清單跟題目清單各自獨立取得（一個查真資料庫、一個退回假
 * 資料），會出現「側欄看得到一個分類，點進去卻永遠是空的」這種真假
 * 資料兜不起來的情況。用同一份 `items` 反推分類，不管 `items` 到底是
 * 真後端資料還是下面的 `FAQ_ITEMS` 假資料，側欄分類永遠跟看得到的題目
 * 對得上。
 */
export function deriveFaqCategories(items: FaqItem[]): FaqCategory[] {
  const seen = new Map<number, string>();
  for (const item of items) {
    if (item.categoryId == null) continue;
    if (!seen.has(item.categoryId)) {
      seen.set(item.categoryId, item.categoryName || `分類 ${item.categoryId}`);
    }
  }
  return Array.from(seen, ([id, name]) => ({ id, name }));
}

/**
 * 常見問題假資料——後端無法連線或尚無資料時的退回內容。
 * 對應舊站 page/_uc/side/side1_faq.html 列的四個分類；舊站範例
 * page/faq/index.html 只給了 3 題示範內容（都屬於「平台與服務說明」），
 * 其他三個分類目前沒有範例文字，這裡先各補一題合理的假資料，讓分類
 * 篩選看得出真的有作用，不是點了都一樣空白。
 *
 * 形狀跟真後端 `fetchFaq()` 回傳的 `FaqItem`（見 lib/types.ts）完全一致
 * （id/href/categoryId/categoryName），這樣 `/faq/page.tsx` 不用另外
 * 判斷資料來源，兩邊都走同一套渲染/分類邏輯。
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "faq-1",
    href: "/faq/faq-1",
    question: "智慧石化媒合平台的建置目的與主要功能為何？",
    answer: wrapHtmlAsPuckContent(
      "faq-1",
      "<p>本平台建置目的在於整合石化產業智慧化技術、人才與資源，協助企業快速掌握補助計畫、技術文件與媒合對象。主要功能包含公告資訊查詢、服務資源媒合、技術案例展示與會員專屬服務。</p>",
    ),
    categoryId: 1,
    categoryName: "平台與服務說明",
  },
  {
    id: "faq-2",
    href: "/faq/faq-2",
    question: "平台在智慧工安推動中所扮演的角色為何？",
    answer: wrapHtmlAsPuckContent(
      "faq-2",
      "<p>平台扮演資訊整合與媒合的角色，串接政府補助資源、技術服務廠商與企業需求，協助產業更快速導入智慧化工安解決方案。</p>",
    ),
    categoryId: 1,
    categoryName: "平台與服務說明",
  },
  {
    id: "faq-3",
    href: "/faq/faq-3",
    question: "哪些產業與對象適合使用智慧石化媒合平台？",
    answer: wrapHtmlAsPuckContent(
      "faq-3",
      "<p>凡從事石化相關製造、加工、倉儲、運輸的企業，以及提供智慧化工安技術、設備或顧問服務的廠商，都適合使用本平台。</p>",
    ),
    categoryId: 1,
    categoryName: "平台與服務說明",
  },
  {
    id: "faq-4",
    href: "/faq/faq-4",
    question: "哪些單位可以申請成為會員？",
    answer: wrapHtmlAsPuckContent(
      "faq-4",
      "<p>凡依法登記營業、實際從事石化相關產業或智慧化技術服務的企業或機構，皆可提出會員申請，實際資格以審核結果為準。</p>",
    ),
    categoryId: 2,
    categoryName: "會員申請與資格說明",
  },
  {
    id: "faq-5",
    href: "/faq/faq-5",
    question: "如何查詢歷年計畫申請與補助資訊？",
    answer: wrapHtmlAsPuckContent(
      "faq-5",
      "<p>可透過「公告事項」頁面依分類與關鍵字查詢歷年公告，或於「服務專區」查看對應的技術文件與申請說明。</p>",
    ),
    categoryId: 3,
    categoryName: "功能操作與資訊查詢",
  },
  {
    id: "faq-6",
    href: "/faq/faq-6",
    question: "忘記密碼該怎麼辦？",
    answer: wrapHtmlAsPuckContent(
      "faq-6",
      "<p>請至會員中心登入頁點選「忘記密碼」，依指示輸入註冊信箱，系統會寄送重設密碼連結至您的信箱。</p>",
    ),
    categoryId: 4,
    categoryName: "帳號與登入相關問題",
  },
];
