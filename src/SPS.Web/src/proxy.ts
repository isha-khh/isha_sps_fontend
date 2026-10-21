import { NextResponse, type NextRequest } from "next/server";

/**
 * 每個請求產生一組 nonce，組成 Content-Security-Policy 並同時放進「請求」與「回應」標頭：
 *  - 放進請求標頭：Next.js 在伺服器端渲染時會解析它，把 nonce 自動加到框架腳本、頁面腳本與自己產生的行內腳本上；
 *  - 放進回應標頭：瀏覽器據此執行。
 * 因此 `script-src` 不需要 'unsafe-inline'：沒有帶正確 nonce 的行內腳本（例如被注入的 <script>、onclick="…"）都會被擋下。
 * 代價：使用 nonce 的頁面必須動態渲染（見 app/layout.tsx 的 `await connection()`），不能再被靜態快取。
 *
 * `script-src` 仍保留 'self'：舊站的第三方套件（jQuery、Bootstrap、Fancybox…，`public/js/`）是同網域的外部檔案，不需要 nonce。
 * `style-src` 保留 'unsafe-inline'：全站有大量 `style` 屬性（React 與舊站標記），無法用 nonce 涵蓋；樣式注入的風險遠小於腳本。
 * 違規回報：只用 `report-uri` 指向 /csp-report，寫進伺服器日誌。ZAP 會提示 report-uri 已過時（低風險），但 2026-10-15 在測試機實測：
 * 同時加 `report-to` 之後，瀏覽器（優先用 report-to，走批次的 Reporting API）送的違規一直沒有到伺服器；只用 `report-uri` 時瀏覽器的回報會立刻送達。
 * 可靠的違規回報比消掉一則低風險提示重要，所以拿掉 report-to。
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const basePath = request.nextUrl.basePath ?? "";
  const isDev = process.env.NODE_ENV === "development";

  const csp = [
    "default-src 'self'",
    // 開發模式 React 會用 eval 還原錯誤堆疊，正式版不需要
    `script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://placehold.co",
    "media-src 'self' blob:",
    // 頁尾電子報訂閱直接打 Newsleopard（EDM 服務）的 API
    "connect-src 'self' https://api-backend.app.newsleopard.com",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    `report-uri ${basePath}/csp-report`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

// `config` 必須是 Next.js 能靜態分析的字面值（不能用變數展開），所以 missing 條件在兩條規則裡各寫一次
export const config = {
  matcher: [
    // 只處理頁面請求：略過靜態檔案、圖片最佳化、favicon、違規回報端點本身，以及 Next.js 的預先載入請求
    {
      source: "/((?!api|csp-report|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
    // 站台掛在 basePath（/sps）底下時，上面那條會被展開成 `/sps/(…)`，比對不到沒有結尾斜線的首頁 `/sps`，要另外列
    {
      source: "/",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
