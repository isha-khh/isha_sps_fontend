export interface SidebarBannerItem {
  href: string;
  image: string;
  title: string;
}

/**
 * 積木元件：右側欄的廣告圖片區，對應舊站 page/_uc/side2_banner.html。
 * 就是幾張可點的連結圖片疊在一起，沒有其他邏輯。
 */
export default function SidebarBanner({ items }: { items: SidebarBannerItem[] }) {
  return (
    <div className="column_box">
      {items.map((item, index) => (
        <a href={item.href} className="mb-4" title={item.title} key={`${item.href}-${index}`}>
          <div className="ratio ratio-4x3 mb-4">
            <img className="img-fluid d-block" src={item.image} alt="" />
          </div>
        </a>
      ))}
    </div>
  );
}
