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
  async headers() {
    const oneDay = "public, max-age=86400, stale-while-revalidate=604800";
    return [
      { source: "/images/:path*", headers: [{ key: "Cache-Control", value: oneDay }] },
      { source: "/data/:path*", headers: [{ key: "Cache-Control", value: oneDay }] },
    ];
  },
};

export default nextConfig;
