import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MatchingSubNav from "@/components/matching/MatchingSubNav";
import MatchingSearchBar from "@/components/matching/MatchingSearchBar";
import EnterpriseCard from "@/components/matching/EnterpriseCard";
import Pagination from "@/components/ui/Pagination";
import { fetchCompanies } from "@/lib/api.server";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "企業名錄",
};

const ENTERPRISE_PAGE_SIZE = 8;

/**
 * 「我要媒合」企業名錄列表，對應設計稿 `page/matching/enterprise.html`。
 *
 * 資料來自後台「公司管理」已審核通過且啟用的企業（`fetchCompanies`，2026-10-06 從假資料改接真後端）；
 * 關鍵字搜尋（`?q=`）交給後端比對企業名稱／編號。搜尋列的應用情境／應用範疇／智慧技術三個勾選面板，
 * 企業目前沒有對應欄位，仍然只是畫面互動。
 *
 * 沒有側欄分類（`side1`）、沒有右欄廣告（`side2`）——設計稿這兩塊都是 `d-none`，
 * 所以 `InnerPageShell` 沒給 `sidebar`／`aside`，讓 `.content` 自動撐滿。
 */
export default async function MatchingEnterprisePage({ searchParams }: PageProps<"/matching/enterprise">) {
  const { page: rawPage, q: rawQuery } = await searchParams;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const { items: listings } = await fetchCompanies({ search: query });

  const totalPages = Math.max(1, Math.ceil(listings.length / ENTERPRISE_PAGE_SIZE));
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const pagedListings = listings.slice((currentPage - 1) * ENTERPRISE_PAGE_SIZE, currentPage * ENTERPRISE_PAGE_SIZE);

  return (
    <>
      <BodyClass className="matching enterprise" />
      <InnerPageShell
        title="企業名錄"
        titleAside={<MatchingSubNav activeHref="/matching/enterprise" />}
        breadcrumb={[{ label: "企業名錄" }]}
        topBar={
          <div className="searchma_tching mb-5">
            <MatchingSearchBar defaultKeyword={query} />
          </div>
        }
      >
        <div className="row">
          {pagedListings.length === 0 && <p>{query ? "沒有符合的企業。" : "目前沒有刊登中的企業。"}</p>}

          {pagedListings.map((company) => (
            <EnterpriseCard
              key={company.id}
              data={{
                href: `/matching/enterprise/${company.id}`,
                image: company.photo || withBasePath("/images/all/new_logo.jpg"),
                title: company.name,
                description: company.introduction ?? "",
                keywords: company.tagNames,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(page) => {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (page > 1) params.set("page", String(page));
            const qs = params.toString();
            return qs ? `/matching/enterprise?${qs}` : "/matching/enterprise";
          }}
        />
      </InnerPageShell>
    </>
  );
}
