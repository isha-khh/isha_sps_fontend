export interface CategoryTabItem {
  label: string;
  href: string;
}

/**
 * 積木元件：左側分類選單*裡面*的清單本身，對應舊站
 * page/_uc/side/side1_news.html／side1_serve.html——兩支檔案結構
 * 完全一樣（一個 `ul.wid-cont`，目前分類加 `.active`），只有清單
 * 內容不同，所以合併成一個資料驅動的元件。
 *
 * 要放進 <CategorySidebar> 的 children：
 *   <CategorySidebar>
 *     <CategoryTabList activeHref="/news" items={[...]} />
 *   </CategorySidebar>
 */
export default function CategoryTabList({
  items,
  activeHref,
}: {
  items: CategoryTabItem[];
  activeHref: string;
}) {
  return (
    <ul className="nav wid-cont">
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href} title={item.label} className={item.href === activeHref ? "active" : undefined}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
