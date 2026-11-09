/**
 * Google Analytics 4 的衡量 ID（格式 `G-XXXXXXXXXX`），從「執行時」的環境變數 `GA_MEASUREMENT_ID` 讀取。
 * 沒設定或格式不對回傳 null——代表不載入 GA、CSP 也不放行 GA 網域（本機與測試機不要設定，才不會把測試流量算進正式資料）。
 * 放在純函式檔，讓 `proxy.ts` 與 `components/GoogleAnalytics.tsx` 共用，proxy 不必載入 React 元件。
 */
const MEASUREMENT_ID = /^G-[A-Z0-9]{6,}$/;

export function getGaMeasurementId(): string | null {
  const id = process.env.GA_MEASUREMENT_ID?.trim();
  return id && MEASUREMENT_ID.test(id) ? id : null;
}
