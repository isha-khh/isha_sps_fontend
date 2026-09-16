import { withBasePath } from "@/lib/api-client";

export interface SidebarBannerItem {
  href: string;
  image: string;
  title: string;
}

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
 */
export default function SidebarBanner({ items, heading }: { items: SidebarBannerItem[]; heading?: string }) {
  return (
    <div className={heading ? "side2_banner2" : "side2_banner"}>
      <div className="column_box">
        {heading && <h4 className="mb-4">{heading}</h4>}
        {items.map((item, index) => (
          <a href={withBasePath(item.href)} className="mb-4" title={item.title} key={`${item.href}-${index}`}>
            <div className="ratio ratio-4x3 mb-4">
              <img className="img-fluid d-block" src={item.image} alt="" />
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
