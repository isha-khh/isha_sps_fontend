/**
 * 表單送出被擋下來（欄位沒填、格式不對）之後，把鍵盤焦點帶到出錯的地方（無障礙檢測 GN2330300E：
 * 要有讓使用者「跳到出錯之處」的機制）：
 * - 找得到第一個還沒填的必填欄位（`required` 又是空的，瀏覽器的 `:invalid`）就聚焦它並捲到畫面中間；
 * - 找不到（錯誤是「密碼太短」「兩次不一致」這類自己寫的檢查）就聚焦錯誤訊息本身，螢幕閱讀器會直接念出內容。
 * 錯誤訊息元素要有 `tabIndex={-1}` 才聚焦得到。
 */
export function focusFirstInvalidField(scope: ParentNode | null | undefined, fallback?: HTMLElement | null): void {
  const invalid = scope?.querySelector<HTMLElement>(":is(input, select, textarea)[required]:invalid:not([type=hidden])");
  const target = invalid ?? fallback;
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: "center", behavior: "smooth" });
}
