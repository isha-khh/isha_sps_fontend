import PromoBanner from "@/components/ui/PromoBanner";

/**
 * 積木元件：公告事項列表頁最上方那條輪播看板，對應舊站
 * page/_uc/banner.html（`.banner_section` + `.wid-banner-news`）——
 * 只有 `/news` 列表頁有這塊，`/serve` 沒有（那邊的 `.banner` 沒被
 * 用到，側欄廣告是另一支 `.side2_banner`，見 SidebarBanner.tsx）。
 *
 * 2026-09-16：`/talent`、`/support` 也發現同一塊（內容一模一樣），
 * 實際內容/邏輯抽到共用的 `PromoBanner.tsx`，這裡留一層薄的包裝，
 * 呼叫端（`news/page.tsx`）不用改。
 */
export default function NewsBanner() {
  return <PromoBanner id="news-banner" />;
}
