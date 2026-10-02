import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SearchBar from "@/components/ui/SearchBar";
import { fetchSearch } from "@/lib/api.server";
import { formatIsoDate } from "@/lib/content-list-utils";

export const metadata: Metadata = {
  title: "全站搜尋",
};

/** 摘要太長（例如公告的整段簡介）會把結果列表撐得很亂，截短顯示 */
function truncate(text: string, max = 90): string {
  const plain = text.replace(/\s+/g, " ").trim();
  return plain.length > max ? `${plain.slice(0, max)}…` : plain;
}

/**
 * 全站搜尋結果頁（`/search?q=`）。舊站沒有這一頁（連 header 都沒有搜尋框），
 * 版面是 2026-10-02 沿用既有 `.search`／`.column_box` 這幾個 class 自行設計的，
 * 不是照設計稿。
 *
 * 資料來自後端 `GET /api/Search`：一次查公告、產業案例、常見問題、影音（只含已發布的），
 * 依類型分組、每組顯示前 5 筆，超過的用「查看全部」連到該類型自己的列表頁（那邊本來
 * 就有同一個關鍵字的搜尋與分頁）。
 *
 * 三種狀況刻意分開處理：沒帶關鍵字（提示輸入）、後端連不到（`fetchSearch` 回 null，顯示
 * 服務暫時無法使用）、搜尋了但 0 筆（照實顯示查無結果）。
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const { q: rawQuery } = await searchParams;
  const query = typeof rawQuery === "string" ? rawQuery.trim().slice(0, 100) : "";
  const result = query ? await fetchSearch(query) : undefined;

  return (
    <>
      <BodyClass className="search-results" />
      <InnerPageShell title="全站搜尋" breadcrumb={[{ label: "全站搜尋" }]}>
        <div className="search mb-md-5 mb-4">
          <SearchBar defaultKeyword={query} keywordPlaceholder="請輸入想搜尋的關鍵字" />
        </div>

        {!query && <p>請輸入關鍵字，搜尋公告、產業案例、常見問題與影音。</p>}

        {query && result === null && <p>搜尋服務暫時無法使用，請稍後再試。</p>}

        {result && (
          <>
            <p className="mb-4">
              {result.totalCount > 0 ? (
                <>
                  搜尋「<strong>{result.keyword}</strong>」共找到 <strong>{result.totalCount}</strong> 筆結果
                </>
              ) : (
                <>找不到符合「{result.keyword}」的內容，請換個關鍵字試試。</>
              )}
            </p>

            {result.groups
              .filter((group) => group.totalCount > 0)
              .map((group) => (
                <section className="mb-5" key={group.type} aria-label={group.label}>
                  <h3 className="mb-3 me_sho">
                    {group.label}
                    <small className="ms-2 text-muted">共 {group.totalCount} 筆</small>
                  </h3>

                  <ul className="list-unstyled">
                    {group.items.map((item) => (
                      <li className="mb-3 pb-3 border-bottom" key={`${group.type}-${item.id}`}>
                        <Link href={item.url} className="fw-bold" title={item.title}>
                          {item.title}
                        </Link>
                        {item.date && <span className="ms-3 text-muted small">{formatIsoDate(item.date)}</span>}
                        {item.summary && <p className="mb-0 mt-1 text-muted">{truncate(item.summary)}</p>}
                      </li>
                    ))}
                  </ul>

                  {group.totalCount > group.items.length && (
                    <Link href={group.moreUrl} className="blue text-decoration-underline" title={`查看全部${group.label}搜尋結果`}>
                      查看全部 {group.totalCount} 筆{group.label}
                      <i className="bi bi-chevron-right ms-1" aria-hidden="true"></i>
                    </Link>
                  )}
                </section>
              ))}
          </>
        )}
      </InnerPageShell>
    </>
  );
}
