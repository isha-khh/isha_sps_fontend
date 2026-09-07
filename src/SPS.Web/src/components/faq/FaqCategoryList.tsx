import Link from "next/link";

export interface FaqCategoryItem {
  label: string;
  href: string;
}

/**
 * 積木元件：常見問題左側分類清單，對應舊站 page/_uc/side/side1_faq.html
 * （`.wid-faq`）。跟 news/serve 用的 `.wid-cont`（CategoryTabList）是
 * 不同視覺——直式清單、每列右側一個小箭頭圖示（`.faq-arrow`，純 CSS
 * 背景圖，不用另外塞文字/icon），不是圓角膠囊按鈕，所以另外做一個
 * 元件，不跟 CategoryTabList 共用。
 *
 * 原本是純 `<a href>`，切分類會整頁重新載入（重新跟伺服器要一次完整
 * HTML/CSS）——這就是使用者回報「切 category 時側欄字會變大變小」
 * 那個畫面閃爍（FOUC）的根因：整頁 reload 的當下，瀏覽器會先畫出還
 * 沒套上舊站 CSS 的原始 HTML，等 CSS 載完才「跳」成正確樣式。改成
 * `Link` 走 client-side 導航之後，`<head>`／已載入的 CSS 都不會重
 * 新請求，不會有這段「還沒套樣式」的空窗期。
 */
export default function FaqCategoryList({ items, activeHref }: { items: FaqCategoryItem[]; activeHref: string }) {
  return (
    <ul className="nav wid-faq">
      {items.map((item) => (
        <li key={item.href}>
          <Link href={item.href} title={item.label} className={item.href === activeHref ? "active" : undefined}>
            <span>{item.label}</span>
            <div className="faq-arrow" aria-hidden="true"></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
