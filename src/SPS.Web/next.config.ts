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
  basePath: "/sps",
};

export default nextConfig;
