import { headers } from "next/headers";
import Script from "next/script";
import { getGaMeasurementId } from "@/lib/ga";

/**
 * Google Analytics 4（gtag）。衡量 ID 從「執行時」的環境變數 `GA_MEASUREMENT_ID`（格式 `G-XXXXXXXXXX`）讀取，
 * 沒設定或格式不對就完全不載入（見 `lib/ga.ts`）——本機與測試機不要設定，才不會把測試流量算進正式資料。
 * 不啟用廣告相關功能（Google signals、廣告個人化）。CSP 要允許 GA 的網域，見 `src/proxy.ts`（同樣依這個環境變數決定）。
 *
 * `<Script>` 必須自己帶 `nonce`：全站的 CSP 沒有 'unsafe-inline'，`proxy.ts` 每個請求產生一組 nonce 並放進 `x-nonce` 請求標頭；
 * Next 只會自動替框架腳本加 nonce，`afterInteractive` 的 `<Script>`（尤其是這段行內的初始化碼）是在瀏覽器端動態插入的，
 * 沒有手動傳 `nonce` 就會被瀏覽器擋下（2026-11-10 在測試機踩過：「Executing inline script violates the following Content Security Policy」，gtag 沒有初始化）。
 */
export default async function GoogleAnalytics() {
  const id = getGaMeasurementId();
  if (!id) return null;
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <>
      <Script id="ga-loader" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" nonce={nonce} />
      <Script id="ga-init" strategy="afterInteractive" nonce={nonce}>
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{allow_google_signals:false,allow_ad_personalization_signals:false});`}
      </Script>
    </>
  );
}
