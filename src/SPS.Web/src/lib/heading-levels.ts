/**
 * 內容裡的標題層級重新排：編輯者在富文字裡隨手選 H2、H4、H5，頁面上文章標題是 H2，
 * 內容直接出現 H4 會變成「H2 跳到 H4」，無障礙檢測 HM1130104E 不過。
 * 這裡只看「這段內容自己的標題相對結構」，從 H3 開始往下依序排（文章標題已經是 H2，不會跳級）：
 * 內容裡最上層的標題變 H3，比它低的依序 H4、H5、H6（最多 H6）；同一層的維持同一個層級。
 * 例：H2、H4、H4、H5、H2 → H3、H4、H4、H5、H3。標籤成對處理，沒有成對的（壞掉的 HTML）不動。
 */
const HEADING_TAG = /<(\/?)h([1-6])(?=[\s>\/])([^>]*)>/gi;

export function normalizeHeadingLevels(html: string, baseLevel = 3): string {
  if (!/<h[1-6][\s>]/i.test(html)) return html;
  const outline: number[] = []; // 目前這條路徑上各層標題的「原始」層級
  const pending: number[] = []; // 還沒關閉的標題，記它換成的層級，關閉標籤用
  return html.replace(HEADING_TAG, (match, slash: string, level: string, rest: string) => {
    if (slash) {
      const mapped = pending.pop();
      return mapped === undefined ? match : `</h${mapped}>`;
    }
    const original = Number(level);
    while (outline.length > 0 && outline[outline.length - 1] >= original) outline.pop();
    outline.push(original);
    const mapped = Math.min(6, baseLevel + outline.length - 1);
    pending.push(mapped);
    return `<h${mapped}${rest}>`;
  });
}

/**
 * 把 Puck 資料裡所有「含標題標籤的字串」（富文字欄位存的 HTML）逐個重排標題層級。
 * Puck 的富文字欄位在 `<Render>` 裡會被 Puck 自己轉成 React 節點，到區塊的 render 函式時已經不是字串，
 * 所以不能等到顯示時才處理，要在資料交給 Puck 之前先改好。其他欄位（標題、網址…）不含標題標籤，原樣保留。
 */
export function normalizeHeadingLevelsDeep<T>(value: T, baseLevel = 3): T {
  if (typeof value === "string") {
    return (/<h[1-6][\s>]/i.test(value) ? normalizeHeadingLevels(value, baseLevel) : value) as T;
  }
  if (Array.isArray(value)) return value.map((item) => normalizeHeadingLevelsDeep(item, baseLevel)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeHeadingLevelsDeep(item, baseLevel)])) as T;
  }
  return value;
}
