export interface CategoryTabStripItem {
  label: string;
  href: string;
}

/**
 * 積木元件：公告事項列表頁最上方（麵包屑下方、搜尋列上方）那條滿版
 * 分類頁籤——客戶提供的新設計稿是方框、直線分隔、選中項目底部藍色
 * 底線，跟 [CategoryTabList](../layout/CategoryTabList.tsx)／`.wid-cont`
 * 那種側欄圓角膠囊按鈕是完全不同的視覺，沒有對應的舊站 class 可以
 * 沿用。
 *
 * 樣式寫在 globals.css 的 `.category-tab-strip`，不是 Tailwind
 * utility——這是全新設計，一開始想直接用 `tw:` utility 刻，結果
 * margin／padding／color 全部被 Bootstrap／舊站對 `ul`／`a` 的預設值
 * 蓋掉（Tailwind 這裡是用 `@layer utilities` 載入的，沒有 layer 的
 * 規則永遠贏，跟 selector 精不精準無關），globals.css 裡有更完整的
 * 說明。
 *
 * `CategoryTabList` 保留給 `/serve` 用（那邊維持原本側欄樣式，客戶
 * 這次只提到公告事項要改），兩邊分類選單長相不同，刻意不合併成一個
 * 元件硬凹一個 variant。
 *
 * 用 InnerPageShell 的 `topBar` 插槽放，不是 `sidebar`——這條頁籤要
 * 橫跨整個內容寬度（蓋過原本側欄+內容兩欄的寬度總和），塞進側欄那個
 * 窄欄位裡撐不開。
 *
 * RWD：手機寬度下維持四欄等寬會讓「活動資訊」「外部消息」這種四個字
 * 的分類擠到自動換行、格子高度歪掉，很難看。這是全新設計、沒有舊站
 * 版本可以照抄斷點，所以自己定：`md`（768px）以下改成「橫向捲動、
 * 文字不換行」，滑動就看得到其他分類；`md` 以上才是設計稿那種四欄
 * 等寬、彼此不換行的樣子。`no-scrollbar` 用來隱藏橫向捲動的捲軸，
 * 不然某些瀏覽器/系統會預留捲軸的垂直空間，桌機寬度明明用不到捲動，
 * 整個框卻會憑空多出一截高度。
 */
export default function CategoryTabStrip({ items, activeHref }: { items: CategoryTabStripItem[]; activeHref: string }) {
  return (
    <div className="category-tab-strip no-scrollbar" style={{ overflowX: "auto" }}>
      <ul>
        {items.map((item) => {
          const isActive = item.href === activeHref;
          return (
            <li key={item.href}>
              <a href={item.href} title={item.label} aria-current={isActive ? "page" : undefined}>
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
