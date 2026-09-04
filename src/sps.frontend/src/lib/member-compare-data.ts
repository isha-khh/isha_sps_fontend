export type CompareCell = string | { icon: "check" | "x"; text: string };

export interface CompareRow {
  label: string;
  cells: CompareCell[];
}

/**
 * 會員權益比較表資料，對應舊站 p01.html／compare.html 兩處完全相同的
 * `.compare-table`（同一份表格內容重複出現兩次：p01 是註冊流程 Step 2
 * 內嵌的精簡版，compare.html 是「權益比較表」獨立完整頁）。這裡拆成
 * 共用資料源＋共用元件（見 CompareTable.tsx），避免兩邊各自维護一份
 * 一模一樣的表格內容。
 */
export const COMPARE_ROWS: CompareRow[] = [
  { label: "適用對象", cells: ["潛在使用者", "潛在需求端", "需求端", "供給端", "供給端"] },
  { label: "審查方式", cells: ["無需註冊", "基本資料檢核", "文件審查", "文件審查", "文件審查＋至少5位專家審查"] },
  { label: "內容瀏覽", cells: ["公開資訊＋部分內容", "完整內容", "完整內容", "完整內容", "完整內容"] },
  { label: "廠商資料查詢", cells: ["企業名錄", "企業完整資訊", "企業完整資訊", "企業完整資訊", "企業完整資訊"] },
  {
    label: "需求刊登",
    cells: [
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
    ],
  },
  {
    label: "刊登服務",
    cells: [
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
    ],
  },
  {
    label: "建立公司專頁",
    cells: [
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
    ],
  },
  {
    label: "標籤建置",
    cells: [
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
    ],
  },
  {
    label: "投稿產業案例",
    cells: [
      { icon: "x", text: "不可刊登" },
      { icon: "x", text: "不可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
    ],
  },
  {
    label: "参與媒合",
    cells: [
      { icon: "x", text: "不可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
      { icon: "check", text: "可刊登" },
    ],
  },
  { label: "下載平台資源", cells: ["僅公開資訊下載", "公開+部分資訊下載", "完整資訊下載", "完整資訊下載", "完整資訊下載"] },
  {
    label: "電子報訂閱",
    cells: [
      { icon: "check", text: "可訂閱" },
      { icon: "check", text: "可訂閱" },
      { icon: "check", text: "可訂閱" },
      { icon: "check", text: "可訂閱" },
      { icon: "check", text: "可訂閱" },
    ],
  },
];
