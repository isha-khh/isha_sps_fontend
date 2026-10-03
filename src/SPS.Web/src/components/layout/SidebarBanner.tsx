import BannerImpressions from "@/components/ui/BannerImpressions";
import TrackedLink from "@/components/ui/TrackedLink";
import type { BannerItem } from "@/lib/types";

/**
 * 積木元件：右側欄的廣告圖片區，對應舊站 page/_uc/side2_banner.html。
 * 就是幾張可點的連結圖片疊在一起，沒有其他邏輯。
 *
 * `heading` 對應 page/_uc/side2_banner2.html 那個變體（`/support` 用，
 * 多一個標題文字，其餘結構一樣）——沒給就跟原本的 side2_banner.html
 * 一樣不顯示標題。
 *
 * 外層 `.side2_banner`／`.side2_banner2` 不能省略，理由跟
 * `PopularPosts.tsx` 的 `.side2_new` 是同一種坑：hover 陰影
 * （style.css:1206）、圖片圓角（1213）、`side2_banner2` 那條分隔線
 * （580）都寫死靠這兩個 class 當祖先選擇器，沒有這層全部不會生效。
 *
 * 2026-10-03：原本每頁都寫死兩張連到 `#` 的假廣告；改成吃後台「橫幅管理」設定在各頁面側欄版位
 * （`sidebar-*`）的 Banner（上架中、依排序）：點擊與曝光會記錄次數；沒圖片的略過；
 * 「一張都沒有」就整塊不渲染（連 `heading` 也不顯示，不會留一個空標題），不再用假資料頂替。
 */
export default function SidebarBanner({ banners, heading }: { banners: BannerItem[]; heading?: string }) {
  const items = banners.filter((b) => b.uri);
  if (items.length === 0) return null;

  return (
    <div className={heading ? "side2_banner2" : "side2_banner"}>
      <div className="column_box">
        {heading && <h4 className="mb-4">{heading}</h4>}
        {items.map((item) => {
          const title = item.title || item.name || "廣告";
          const picture = (
            <div className="ratio ratio-4x3 mb-4">
              <img className="img-fluid d-block" src={item.uri as string} alt="" />
            </div>
          );
          // 沒設連結就只顯示圖片，不包 `<a>`
          return item.linkUrl ? (
            <TrackedLink
              bannerId={item.id}
              href={item.linkUrl}
              target={item.linkTarget}
              className="mb-4"
              title={item.linkTarget === "_blank" ? `${title}（另開視窗）` : title}
              key={item.id}
            >
              {picture}
            </TrackedLink>
          ) : (
            <div className="mb-4" key={item.id}>
              {picture}
            </div>
          );
        })}
      </div>
      <BannerImpressions ids={items.map((b) => b.id)} />
    </div>
  );
}
