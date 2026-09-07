import type { ReactNode } from "react";

export interface TabItem {
  /** 對應面板 id，也會拿去組按鈕 id（`${id}-tab`），同一頁內要唯一 */
  id: string;
  /** 頁籤按鈕內容，可以只是文字，也可以像服務專區那種圖示+文字+小字 */
  label: ReactNode;
  /** 按鈕的 aria-label；label 不是純文字時建議另外給 */
  ariaLabel?: string;
  content: ReactNode;
}

/**
 * 積木元件：bootstrap 的 nav-pills 頁籤，對應舊站 `home_news.html`／
 * `home_service.html` 裡那組 `data-bs-toggle="pill"` 頁籤。
 *
 * 切換行為刻意「不」用 React state 自己重刻：bootstrap.bundle.min.js
 * 已經整站載入，它靠 `data-bs-toggle`/`data-bs-target` 這些屬性，用
 * document 上的事件代理就能認得任何符合的按鈕，不需要每個實例額外
 * 掛 JS。這裡純粹是把當初來回複製貼上的一大段 HTML 換成資料驅動：
 *
 *   <Tabs
 *     id="pills-tab"
 *     ariaLabel="最新消息分類頁籤"
 *     items={[
 *       { id: "pills-all", label: "全部", content: <...> },
 *       { id: "pills-event", label: "活動", content: <...> },
 *     ]}
 *   />
 *
 * 這也表示點擊切換頁籤後 active/aria-selected 的變化是 bootstrap
 * 直接操作真實 DOM，不會反映回這個元件的 props——只要這棵樹不會
 * 因為別的原因重新 render，就不會被蓋掉，跟 AOS/bsnav 是同一種
 * 「舊套件接手管理一小塊 DOM」的處理方式。
 */
export default function Tabs({
  id,
  ariaLabel,
  items,
  defaultActiveId,
}: {
  id: string;
  ariaLabel: string;
  items: TabItem[];
  defaultActiveId?: string;
}) {
  const activeId = defaultActiveId ?? items[0]?.id;

  return (
    <>
      <ul className="nav nav-pills mb-3" id={id} role="tablist" aria-label={ariaLabel}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li className="nav-item" role="presentation" key={item.id}>
              <button
                className={`nav-link${isActive ? " active" : ""}`}
                id={`${item.id}-tab`}
                data-bs-toggle="pill"
                data-bs-target={`#${item.id}`}
                type="button"
                role="tab"
                aria-controls={item.id}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                aria-label={item.ariaLabel ?? (typeof item.label === "string" ? item.label : undefined)}
              >
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="tab-content" id={`${id}Content`} data-aos="fade-up">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <div
              key={item.id}
              className={`tab-pane fade${isActive ? " show active" : ""}`}
              id={item.id}
              role="tabpanel"
              aria-labelledby={`${item.id}-tab`}
            >
              {item.content}
            </div>
          );
        })}
      </div>
    </>
  );
}
