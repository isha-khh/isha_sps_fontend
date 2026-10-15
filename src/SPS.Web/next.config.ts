import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 2026-09-14：新增的 Dockerfile（多階段 build，見同層 Dockerfile）
  // 只複製 `.next/standalone`，沒有這個設定 build 出來會缺這個資料夾，
  // 容器啟動時直接找不到 server.js。
  //
  // 2026-09-17：這個設定只給「自己架 Docker」的部署方式用——Vercel
  // 自己有一套 Output File Tracing 機制，跟 `output: "standalone"`
  // 產生的追蹤檔案格式衝突，會在 build 最後一步噴
  // `ENOENT .../next-server.js.nft.json`（Vercel 官方文件本來就寫
  // 明部署到 Vercel 不需要、也不建議設這個）。用 Vercel build 時自動
  // 帶的 `VERCEL` 環境變數判斷，只在「不是 Vercel」的環境（本機、
  // Docker build）才開啟。
  output: process.env.VERCEL ? undefined : "standalone",
  // 2026-09-16：正式環境這個網站是掛在 `/sps` 這層路徑下（跟同網域下的
  // 舊系統共存），`src/lib/api-client.ts` 的 `normalizedBasePath` 早就
  // 假設這件事成立（瀏覽器端 API 呼叫、圖片/下載連結都會自動補上
  // `NEXT_PUBLIC_BASE_PATH` 前綴）——但沒開這個設定，Next.js 自己的頁面
  // 路由跟 `_next/*` 靜態資源還是長在網站根目錄，跟前面那層各自為政。
  //
  // 2026-09-17：Vercel 上的部署是給設計端純看畫面確認用的預覽連結，
  // 不是掛在內部伺服器那個共用網域底下，不需要 `/sps` 前綴（沒有這個
  // 前綴反而更單純，網址直接根目錄就能看）。跟 `output` 一樣用
  // `VERCEL` 環境變數判斷——Vercel 上不設，本機/Docker build 才設。
  // `withBasePath()`（api-client.ts）讀的 `NEXT_PUBLIC_BASE_PATH` 在
  // Vercel 上本來就不會被設定，兩邊天然一致，不用額外處理。
  basePath: process.env.VERCEL ? undefined : "/sps",
  // 2026-10-07：`public/` 底下的圖片與資料檔（`/images`、`/data`）原本是 Next 預設的 `max-age=0`（每次換頁瀏覽器都要問一次
  // 伺服器有沒有更新），改成快取一天。檔名沒有雜湊，所以不能用一年 `immutable`：換圖後使用者最多一天才看到新的；
  // `stale-while-revalidate` 讓過期後先用舊的、背景更新。`/css`、`/js` 刻意不加——那是整份複製過來的舊站樣式與腳本，
  // 改了要馬上生效（見 docs 的 public/css 同步說明）。`/_next/static` 本來就是一年 immutable。
  // 後台上傳的圖片走 API 的 `/api/FileManagement/{id}/download`，快取標頭在後端那邊設。
  // 2026-10-15：關掉 `X-Powered-By: Next.js`（ZAP 掃描：洩漏使用的框架）。
  // 前台的安全標頭在這個檔案設定（見下面的 `securityHeaders`）：Next.js 自己的回應，只能在 `next.config.ts` 改。
  // 後台「HTTP 安全設定」產生的是「專案自己的 nginx」用的標頭檔，管不到 Next.js 的回應，也管不到沒有 include 那個檔案的主機 nginx
  //（例如正式機上的 beta），所以前台要在這裡加。HSTS 與 `server_tokens` 屬於 nginx，不在這裡設。
  // 注意：測試機的 nginx（後台設定）在前面也會加同樣的標頭，值相同，標頭會出現兩次；要乾淨的話把測試機 nginx 對 /sps 的重複標頭用 proxy_hide_header 去掉。
  poweredByHeader: false,
  async headers() {
    const oneDay = "public, max-age=86400, stale-while-revalidate=604800";
    // 2026-10-15 ZAP 掃描建議的基本安全標頭（只影響前台 `/sps` 底下的回應）：
    //  - nosniff：瀏覽器不要自己猜內容型別；
    //  - SAMEORIGIN：只有自己的網站可以用 iframe 嵌入頁面（防點擊劫持）；
    //  - Referrer-Policy：跨站連出去時只帶來源網域，不帶完整路徑與查詢字串。
    // CSP：2026-10-15 在測試機以 `Content-Security-Policy-Report-Only` 觀察（公開頁面、登入後的會員中心都沒有違規）後，改為正式的
    // `Content-Security-Policy`（會擋）。違規仍會 POST 到 `/csp-report`（見 src/app/csp-report/route.ts，寫進伺服器日誌）；
    // 日後新增外部來源（例如新的嵌入影片網站、外部圖片）若被擋，要回來這裡的白名單補上。
    // 想暫時改回只回報、不擋：把下面標頭名稱改成 `Content-Security-Policy-Report-Only`。
    // `script-src` 目前必須允許 'unsafe-inline'（Next.js 的頁面資料用行內腳本）；2026-10-15 已拿掉 'unsafe-eval'（ZAP 掃描：中風險，實測沒有用到）。
    // 所以它擋得住「外部腳本來源、iframe、object、base 標籤、eval」，擋不住行內腳本注入；要完全擋住需改 nonce 方案（頁面要改成動態渲染）。
    // `style-src` 的 'unsafe-inline' 保留：舊站標記與 React 都大量使用 style 屬性，改掉的成本遠高於風險。
    const basePath = process.env.VERCEL ? "" : "/sps";
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://placehold.co",
      "media-src 'self' blob:",
      "connect-src 'self'",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.google.com https://maps.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
      // report-to 是新標準（Chromium 系列使用 Reporting-Endpoints 標頭的端點名稱）；report-uri 已被標為過時，但 Firefox／Safari 還在用，兩個都留。
      "report-to csp-endpoint",
      `report-uri ${basePath}/csp-report`,
    ].join("; ");
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders, { key: "Content-Security-Policy", value: csp }, { key: "Reporting-Endpoints", value: `csp-endpoint="${basePath}/csp-report"` }],
      },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: oneDay }] },
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: oneDay }] },
    ];
  },
};

export default nextConfig;
