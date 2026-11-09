import Script from "next/script";
import { getGaMeasurementId } from "@/lib/ga";

/**
 * Google Analytics 4（gtag）。衡量 ID 從「執行時」的環境變數 `GA_MEASUREMENT_ID`（格式 `G-XXXXXXXXXX`）讀取，
 * 沒設定或格式不對就完全不載入（見 `lib/ga.ts`）——本機與測試機不要設定，才不會把測試流量算進正式資料。
 * 不啟用廣告相關功能（Google signals、廣告個人化）。CSP 要允許 GA 的網域，見 `src/proxy.ts`（同樣依這個環境變數決定）。
 */
export default function GoogleAnalytics() {
  const id = getGaMeasurementId();
  if (!id) return null;
  return (
    <>
      <Script id="ga-loader" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}
