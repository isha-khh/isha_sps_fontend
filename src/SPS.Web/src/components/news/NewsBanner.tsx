import PromoBanner, { type PromoBannerSlide } from "@/components/ui/PromoBanner";
import type { BannerItem } from "@/lib/types";

/**
 * 積木元件：公告事項列表頁最上方那條輪播看板，對應舊站
 * page/_uc/banner.html（`.banner_section` + `.wid-banner-news`）——
 * 只有 `/news` 列表頁有這塊，`/serve` 沒有（那邊的 `.banner` 沒被
 * 用到，側欄廣告是另一支 `.side2_banner`，見 SidebarBanner.tsx）。
 *
 * 2026-09-16：`/talent`、`/support` 也發現同一塊（內容一模一樣），
 * 實際內容/邏輯抽到共用的 `PromoBanner.tsx`，這裡留一層薄的包裝。
 *
 * 2026-10-03：加 `id` 參數，`/talent`、`/support` 的頂部輪播也用這顆（各自的版位與 DOM id）。
 *
 * 2026-10-02：原本是 `PromoBanner` 內建 3 張寫死、連結是 `#` 的假輪播；改成吃後台「橫幅管理」
 * 設定在「公告頂部輪播」版位（`news-top`）的 Banner（上架中、依排序）。沒有圖片的 Banner 略過；
 * 呼叫端在「一張都沒有」時整塊不要渲染（`news/page.tsx`），不再用假資料頂替。
 */
export default function NewsBanner({ banners, id = "news-banner" }: { banners: BannerItem[]; id?: string }) {
  const slides: PromoBannerSlide[] = banners
    .filter((b) => b.uri)
    .map((b) => ({
      bannerId: b.id,
      title: b.title || b.name || "公告輪播",
      image: b.uri as string,
      href: b.linkUrl || undefined,
      target: b.linkTarget,
    }));

  return <PromoBanner id={id} slides={slides} />;
}
