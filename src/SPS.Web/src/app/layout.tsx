import type { Metadata } from "next";
import Script from "next/script";
import BootstrapModalRouteCleanup from "@/components/BootstrapModalRouteCleanup";
import { notoSansTC } from "@/lib/fonts";
import "./globals.css";

// ------------------------------------------------------------------
// 過渡期資源載入策略
//
// 舊站的樣式跟一堆 jQuery 套件（bootstrap bundle、bsnav 手機選單、AOS
// 滾動動畫、fancybox 彈窗…）目前先照抄原本的整包載入，讓畫面跟行為先
// 跟舊站一致。之後元件一個一個換成 React/Tailwind 寫法時，可以把對應
// 的舊 CSS class、甚至整支舊版套件，從這裡拿掉。
//
// 兩種載入方式都用得到：
//
// 1. 乾淨的第三方套件 CSS（bootstrap / bootstrap-icons / bsnav / fancybox /
//    aos）用 ES `import`——Next.js 官方「External stylesheets」寫法
//    (https://nextjs.org/docs/app/getting-started/css#external-stylesheets)，
//    讓 bundler 處理，url() 參照到的字型/圖檔也會一併打包。
//
// 2. 舊站自己的三支 CSS（coreStyle / style / style_rwd）不能這樣處理：
//    coreStyle.css 是廠商共用樣板，裡面有些這個網站用不到的 class
//    背景圖參照到根本沒交付進來的圖檔；style_rwd.css 裡還留著一段
//    Big5 編碼的中文註解，不是合法 UTF-8。這兩種狀況用嚴格解析的
//    import 都會直接建置失敗（coreStyle 是 module not found，
//    style_rwd 甚至讓 Turbopack 整個 panic）。所以這三支改用一般的
//    <link>，直接交給瀏覽器載入——不合法的 url() 只會讓瀏覽器 404
//    那張背景圖，不影響其他樣式，跟原本舊站的行為一致。
//
//    【踩過的坑】一開始這裡沒有給 `precedence`，想說「單獨的 <link>
//    元素放在樹裡任何地方，React 19 都會自動 hoist 進 <head>」——這句
//    話只對一半：React 只有在給了 `precedence` 的時候，才會把
//    `<link rel="stylesheet">` 當成正式的 Stylesheet Resource 處理
//    （搬進 <head>、去重、依 precedence 排序）。沒給 `precedence` 的
//    話，React 就把它當成普通 host element，「照 JSX 寫的位置」原樣
//    渲染——用 curl 撈 SSR 出來的原始 HTML 實測過，這三個 <link> 真的
//    是被塞在 <body> 開頭、`</head>` 後面，不在 <head> 裡。這解釋了
//    使用者回報「即使 production build，首次載入/重新整理還是會閃一下
//    沒套樣式的畫面」——瀏覽器對 <head> 裡的 stylesheet 有很穩定的
//    render-blocking 保證（整份文件不會畫出任何東西，直到樣式表載完），
//    <body> 裡的 <link> 沒有這個保證那麼牢靠。加上 `precedence` 之後
//    確認三支都正確出現在 <head>（用一樣的 curl 方式驗證過）。三支給
//    同一個 precedence 值，確保彼此之間維持 coreStyle → style →
//    style_rwd 這個原本 JSX 裡寫的載入順序（React 對同一個
//    precedence 的規則是照渲染順序插入）。
// ------------------------------------------------------------------
import "../../public/js/bootstrap-5.3.2/dist/css/bootstrap.min.css";
import "../../public/js/bootstrap-icons-1.11.3/font/bootstrap-icons.min.css";
import "../../public/js/bsnav-master/dist/bsnav.min.css";
import "../../public/js/fancybox-5.0.33/dist/fancybox/fancybox.css";
import "../../public/js/aos-master/dist/aos.css";
import "../../public/js/slick-1.8.1/slick/slick.css";
import "../../public/js/slick-1.8.1/slick/slick-theme.css";

const LEGACY_SITE_STYLESHEETS = [
  "/css/coreStyle.css",
  "/css/style.css",
  "/css/style_rwd.css",
] as const;

export const metadata: Metadata = {
  // 每個頁面用 `export const metadata = { title: "頁面名稱" }` 就好，
  // Next 會自動套進這個 template 變成「頁面名稱 | 高雄技術處」。
  // 只有首頁（沒有自己 title 的路由）會顯示 default 這個值。
  title: {
    default: "高雄技術處",
    template: "%s | 高雄技術處",
  },
  description: "智慧工安技術產業資訊暨媒合平台",
  // 之前這裡漏了 `public/favicon.ico`（客戶實際的品牌 icon）會被
  // `src/app/favicon.ico`蓋掉——Next.js App Router 有一個檔案慣例：
  // `app/favicon.ico` 存在的話，會自動幫你產生一個 <link rel="icon">
  // 指過去，而且這個「檔案慣例」的優先權比這裡 `metadata.icons` 設定
  // 的還高。專案一開始 scaffold 出來的 `app/favicon.ico` 其實是
  // Next.js 預設的黑底白三角形 logo，不是客戶的圖，一直沒被換掉/刪掉，
  // 導致瀏覽器分頁圖示長期顯示錯的（Next.js 預設）icon，這裡設定的
  // 客戶真正 icon 反而完全沒生效。已經把那個檔案刪掉，讓下面這份
  // 設定真的能生效。
  //
  // 其餘幾個尺寸（android-chrome-192x192／256x256、mask-icon）是
  // `public/` 裡本來就有、但一直沒有接進 `<head>` 的既有素材，一併補上：
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-256x256.png", sizes: "256x256", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "mask-icon", url: "/safari-pinned-tab.svg", color: "#f4d44d" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-tw" data-scroll-behavior="smooth" className={notoSansTC.variable}>
      <body>
        {LEGACY_SITE_STYLESHEETS.map((href) => (
          <link key={href} rel="stylesheet" href={href} precedence="legacy-site" />
        ))}

        <BootstrapModalRouteCleanup />

        {children}

        {/* 舊站第三方套件，依照原本的載入順序保留，元件轉換完成後再逐步移除 */}
        <Script src="/js/jquery-3.7.1.min.js" strategy="beforeInteractive" />
        <Script
          src="/js/bootstrap-5.3.2/dist/js/bootstrap.bundle.min.js"
          strategy="beforeInteractive"
        />
        <Script src="/js/aos-master/dist/aos.js" strategy="beforeInteractive" />
        <Script src="/js/slick-1.8.1/slick/slick.min.js" strategy="beforeInteractive" />
        <Script
          src="/js/fancybox-5.0.33/dist/fancybox/fancybox.umd.js"
          strategy="beforeInteractive"
        />
        <Script src="/js/TweenLite.min.js" strategy="beforeInteractive" />
        <Script src="/js/CSSPlugin.min.js" strategy="beforeInteractive" />

        {/*
          這兩支排在 afterInteractive（hydrate 完成後才執行），跟其他套件不同：
          bsnav.min.js 裡有一段 `$(document).ready(...)`，一載入就會馬上重排
          導覽列的 DOM（搬移選單、加 class）；coreScript.js 則是在 ready
          裡呼叫 AOS.init()，會替所有 [data-aos] 元素加上 class 跟屬性。
          這兩個「載入當下就馬上改 DOM」的動作如果跟其他套件一樣排
          beforeInteractive（hydrate 前執行），改出來的 DOM 會跟 React 在
          server 端算出來的 HTML 對不上，變成 hydration mismatch（實測過，
          拿掉其中任一支、或改回 beforeInteractive 都會重現）。
        */}
        <Script src="/js/bsnav-master/dist/bsnav.min.js" strategy="afterInteractive" />
        <Script src="/js/coreScript.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
