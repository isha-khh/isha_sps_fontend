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
    // CSP（含 nonce）與 Reporting-Endpoints 不在這裡設：每個請求要產生不同的 nonce，由 `src/proxy.ts` 負責。
    //
    // 2026-10-20 弱點掃描報告（Cymetrics）補上三個：
    //  - Permissions-Policy（VAS03）：關掉網站用不到的瀏覽器功能（相機、麥克風、定位、付款、USB、動作感測器）；沒有關全螢幕，影片需要；
    //  - Cross-Origin-Opener-Policy: same-origin（VAS02）：頁面不跟其他來源的視窗共用瀏覽環境（站內沒有靠 window.opener 溝通的彈窗）；
    //  - Cross-Origin-Resource-Policy: same-site（VAS02）：只有同一個網站（isafe.org.tw 底下）可以載入這些資源。
    //  刻意【不設】Cross-Origin-Embedder-Policy：`require-corp` 會擋掉沒有 CORP 標頭的跨來源內容（YouTube 影片、Google 字型、地圖），
    //  網站的影音專區與地圖都會壞；掃描報告把它列為低風險，接受這項殘餘風險。
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=()" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-site" },
    ];
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: oneDay }] },
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: oneDay }] },
    ];
  },
};

export default nextConfig;
