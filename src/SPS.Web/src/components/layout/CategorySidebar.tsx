/**
 * 積木元件：左側分類選單的「外殼」（手機版收合按鈕 + accordion 容器），
 * 對應舊站每個頁面重複出現的 `.side.side1` 那一整塊。
 *
 * 實際的分類清單（首頁目前是空的；news 頁是 side1_news.html 的頁籤；
 * serve 頁是 side1_serve.html 的樹狀選單）當作 children 傳進來就好，
 * 外殼本身（顯示分類按鈕、collapse 行為）每頁都一樣，不用重寫。
 *
 * 首頁目前沒有分類可選，所以整塊隱藏（hidden）；有分類選單的內頁
 * （news、serve…）就不用傳這個 prop。
 */
export default function CategorySidebar({
  hidden = false,
  children,
}: {
  hidden?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`side side1${hidden ? " d-none" : ""}`} aria-label="分類選單">
      <a href="#left-block" id="left-block" accessKey="L" title="左側選單區塊" className="visually-hidden-focusable">
        ::: 左側選單區塊
      </a>

      <div className="function-bar text-end d-flex d-lg-none justify-content-lg-end justify-content-between">
        <div className="sideNavBtn d-lg-none mb-2">
          <button
            type="button"
            className="btn btn-primary collapse-side-btn"
            aria-expanded="false"
            aria-controls="sideAutoUcCollapse"
          >
            <i className="icon fas fa-list" aria-hidden="true"></i>
            <span>顯示分類</span>
          </button>
        </div>
      </div>

      <div className="filter-sidebar side_auto_uc multiple-collapse accordion lg-accordion accordion-blocks d-block">
        <div className="navbar" role="region" aria-label="分類篩選項目">
          <div className="collapse navbar-collapse justify-content-lg-end d-lg-block">
            <div id="sideAutoUcCollapse" className="sideAutoUcCollapse">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
