import localFont from "next/font/local";

/**
 * 中文字型改用 `next/font/google` 自架（build time 下載字型檔、自己
 * 網域伺服，不再跟 fonts.googleapis.com 拿）。
 *
 * 原本 globals.css 用 `@import url("https://fonts.googleapis.com/...")`
 * 掛字型，這個寫法本身就是額外一段序列請求鏈（先載入主 CSS→解析到
 * @import→再去要 Google Fonts 那份 CSS→解析完才知道字型檔網址→再去
 * 要字型檔本體），而且套用 `display=swap` 只是「換字型時不要整個卡住
 * 空白」，換字型當下文字還是會因為字型 metrics 不同而重新排版（寬度/
 * 行高變了），這就是使用者回報「即使首次載入的 CSS 都正確擺進 <head>
 * 了，畫面還是會閃一下、只是變短」剩下的那段——不是樣式表遺漏，是字型
 * 换字造成的版面抖動（FOUT）。
 *
 * `next/font` 除了少一段對外請求，還會自動在產生的 `@font-face` 裡帶
 * `size-adjust`／`ascent-override` 等 fallback 字型校正參數，讓「還沒
 * 換上 Noto Sans TC、暫時用系統字型」跟「換上 Noto Sans TC 之後」這
 * 兩種狀態的文字佔用空間盡量一致，大幅降低換字當下的版面抖動幅度
 * （不是 100% 消除——字型畢竟長得不一樣，但不會再有明顯的「字忽然變
 * 大變小」）。
 *
 * `variable` 名稱沿用 globals.css 的 `@theme inline` 裡本來就寫好、
 * 但一直沒有真的被賦值的 `--font-noto-sans-tc`（之前只有變數名稱，
 * 沒有 next/font 提供實際值，等於白寫）。
 */
/**
 * 2026-10-08：從 `next/font/google` 改成 `next/font/local`，字型檔直接放在 repo（`src/fonts/`）。
 * 原本每次 build（包含 Docker build）都要連 fonts.googleapis.com 下載字型，伺服器上連不到的時候整個 frontend build 會失敗
 * （Turbopack 噴 540 個 `Module not found: @vercel/turbopack-next/internal/font/google/font`），部署就卡住。
 *
 * 這個檔案是 Google Fonts 的 Noto Sans TC **拉丁字母子集**（可變字重 100–900，約 25KB，OFL 授權）——原本設定
 * `subsets: ["latin"]` 本來就只載入拉丁字母，中文字一直是走系統的中文字型，所以畫面不會有任何差別。
 * 要換版本時從 `https://fonts.googleapis.com/css2?family=Noto+Sans+TC` 裡標示 latin 的區塊取 woff2 網址。
 */
export const notoSansTC = localFont({
  src: [{ path: "../fonts/NotoSansTC-latin-var.woff2", weight: "100 900", style: "normal" }],
  variable: "--font-noto-sans-tc",
  display: "swap",
});
