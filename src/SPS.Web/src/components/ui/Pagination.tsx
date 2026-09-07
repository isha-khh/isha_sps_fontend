import Link from "next/link";

type PageToken = number | "dots";

/**
 * 算出要顯示哪些頁碼：永遠顯示第一頁跟最後一頁，目前頁附近 `siblingDelta`
 * 頁範圍內的頁碼，中間空隙用一個 "dots" 頂替（畫成 …）。
 *
 * 例：getPageTokens(6, 12, 2) → [1, "dots", 4, 5, 6, 7, 8, "dots", 12]
 */
function getPageTokens(currentPage: number, totalPages: number, siblingDelta: number): PageToken[] {
  const tokens: PageToken[] = [1];

  const rangeStart = Math.max(2, currentPage - siblingDelta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + siblingDelta);

  if (rangeStart > 2) {
    tokens.push("dots");
  }

  for (let page = rangeStart; page <= rangeEnd; page++) {
    tokens.push(page);
  }

  if (rangeEnd < totalPages - 1) {
    tokens.push("dots");
  }

  if (totalPages > 1) {
    tokens.push(totalPages);
  }

  return tokens;
}

/**
 * 積木元件：列表頁共用的分頁器，對應舊站的 `.page-box` + bootstrap
 * `.pagination`。頁碼本身是連結（用 `getHref` 算出每頁的網址），不是
 * 按鈕——分頁在這類內容網站上本來就該是可以分享/加書籤的網址。
 *
 * 用法：<Pagination currentPage={2} totalPages={12} getHref={(p) => `/news?page=${p}`} />
 */
export default function Pagination({
  currentPage,
  totalPages,
  getHref,
  siblingDelta = 2,
}: {
  currentPage: number;
  totalPages: number;
  getHref: (page: number) => string;
  siblingDelta?: number;
}) {
  if (totalPages <= 1) return null;

  const tokens = getPageTokens(currentPage, totalPages, siblingDelta);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="page-box mt-md-5 mt-4">
      <ul className="pagination">
        <li className={`page-item${hasPrev ? "" : " disabled"}`}>
          {hasPrev ? (
            <Link href={getHref(currentPage - 1)} className="page-link" aria-label="前往上一頁" title="前往上一頁">
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </Link>
          ) : (
            <span className="page-link" aria-hidden="true">
              <i className="bi bi-chevron-left" aria-hidden="true"></i>
            </span>
          )}
        </li>

        {tokens.map((token, index) =>
          token === "dots" ? (
            <li key={`dots-${index}`} className="page-item disabled" aria-hidden="true">
              <span className="page-link dots">…</span>
            </li>
          ) : (
            <li
              key={token}
              className={`page-item${token === currentPage ? " active" : ""}`}
              aria-current={token === currentPage ? "page" : undefined}
            >
              {token === currentPage ? (
                <span className="page-link" title={`目前在第 ${token} 頁`}>
                  {token}
                </span>
              ) : (
                <Link href={getHref(token)} className="page-link" aria-label={`前往第 ${token} 頁`} title={`前往第 ${token} 頁`}>
                  {token}
                </Link>
              )}
            </li>
          ),
        )}

        <li className={`page-item${hasNext ? "" : " disabled"}`}>
          {hasNext ? (
            <Link href={getHref(currentPage + 1)} className="page-link" aria-label="前往下一頁" title="前往下一頁">
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </Link>
          ) : (
            <span className="page-link" aria-hidden="true">
              <i className="bi bi-chevron-right" aria-hidden="true"></i>
            </span>
          )}
        </li>
      </ul>
    </div>
  );
}
