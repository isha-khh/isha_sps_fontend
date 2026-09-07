import type { LinkListItem } from "@/lib/news-data";

/**
 * 積木元件：文章詳情頁的「附件下載」跟「相關連結」，對應舊站
 * page/news/_uc/dot.html 跟 link.html——兩支結構完全一樣（同一個
 * `.dow_t` + 標題圖示 + 清單），只有圖示跟標題文字不同，合併成一個
 * 資料驅動元件。
 *
 * 修正原始碼一個小失誤：連結原本沒有 `target="_blank"`，但 title
 * 卻寫著「（另開視窗）」——明顯是想開新視窗但忘了加屬性，這裡照 title
 * 講的補上。
 *
 * 沒有資料就不渲染整塊（詳情頁不是每篇文章都有附件或相關連結）。
 */
export default function LinkListBox({
  icon,
  title,
  items,
}: {
  icon: string;
  title: string;
  items: LinkListItem[];
}) {
  if (items.length === 0) return null;

  return (
    <div className="dow_t">
      <div className="dow-name">
        <i className={`bi ${icon} me-1`} aria-hidden="true"></i>
        <span>{title}</span>
      </div>
      <ul className="nav d-block">
        {items.map((item, index) => (
          <li key={`${item.href}-${index}`}>
            <a href={item.href} title={`${item.label}（另開視窗）`} target="_blank" rel="noopener noreferrer">
              <i className="bi bi-caret-right-fill me-1" aria-hidden="true"></i>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
