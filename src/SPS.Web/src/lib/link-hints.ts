/**
 * 富文字（後台編輯的文章內容）裡的連結，只要是「另開新視窗」就補一段只給螢幕閱讀器看的提示。
 *
 * 無障礙檢測（開新視窗的連結要事先告知）：編輯者在富文字裡插的連結會帶 `target="_blank"`，
 * 但連結文字通常只寫「點我報名」，使用者按下去才發現開了新分頁。這裡在顯示前統一補上
 * `<span class="visually-hidden">（另開新視窗）</span>`（Bootstrap 內建 class），不用要求編輯者每個連結都自己寫。
 *
 * 跟 `heading-levels.ts` 同一個做法：只在顯示時處理，不改資料庫裡存的內容。
 * 連結文字或 title 已經寫了「另開／新視窗／新分頁」的不重複加；燈箱圖片連結（`data-fancybox`）是 JS 在頁面內放大，不加。
 */

const HINT = "（另開新視窗）";
const HINT_PATTERN = /另開|新視窗|新分頁|new (window|tab)/i;

export function addNewWindowHints(html: string): string {
  if (!/target\s*=\s*["']?_blank/i.test(html)) return html;

  return html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, (whole, attrs: string, inner: string) => {
    if (!/target\s*=\s*["']?_blank/i.test(attrs)) return whole;
    if (/data-fancybox/i.test(attrs)) return whole;
    if (HINT_PATTERN.test(attrs) || HINT_PATTERN.test(inner)) return whole;
    return `<a${attrs}>${inner}<span class="visually-hidden">${HINT}</span></a>`;
  });
}

/** 對 Puck 資料裡所有字串欄位做同樣處理（只會動到含有 `target="_blank"` 的 HTML 字串） */
export function addNewWindowHintsDeep<T>(value: T): T {
  if (typeof value === "string") return addNewWindowHints(value) as T;
  if (Array.isArray(value)) return value.map((item) => addNewWindowHintsDeep(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, addNewWindowHintsDeep(item)])) as T;
  }
  return value;
}
