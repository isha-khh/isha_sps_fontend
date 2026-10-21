import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MatchingSubNav from "@/components/matching/MatchingSubNav";
import MatchingSearchBar from "@/components/matching/MatchingSearchBar";
import EnterpriseCard from "@/components/matching/EnterpriseCard";
import Pagination from "@/components/ui/Pagination";
import { fetchBanners, fetchCompaniesPage, fetchTagTaxonomy } from "@/lib/api.server";
import { getContentSettingsSSR } from "@/lib/api/public-settings";
import { parseTagIds, techGroupLabels } from "@/lib/company-tags";
import EnterpriseBottomBanner from "@/components/matching/EnterpriseBottomBanner";
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
 * 列表下方的橫幅（設計稿 2026-10-14 從「我要媒合」首頁搬過來）原本寫死，2026-10-21 起改由後台「橫幅管理」的 `enterprise-bottom` 版位維護（issue #55）。
 *
 * 沒有側欄分類（`side1`）、沒有右欄廣告（`side2`）——設計稿這兩塊都是 `d-none`，
 * 所以 `InnerPageShell` 沒給 `sidebar`／`aside`，讓 `.content` 自動撐滿。
 */
export default async function MatchingEnterprisePage({ searchParams }: PageProps<"/matching/enterprise">) {
  const { page: rawPage, q: rawQuery, tags: rawTags } = await searchParams;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const tagIds = parseTagIds(rawTags);
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.floor(requestedPage) : 1;

  const [taxonomy, result, bottomBanners, contentSettings] = await Promise.all([
    fetchTagTaxonomy(),
    fetchCompaniesPage({ page, pageSize: ENTERPRISE_PAGE_SIZE, search: query, tagIds }),
    fetchBanners("enterprise-bottom"),
    // 後台「系統配置 → 內容設定」：企業列表要不要顯示標籤、簡介與簡介最多幾個字
    getContentSettingsSSR(),
  ]);
  const introduction = (text?: string | null) => {
    if (!contentSettings.showBusinessListIntroduction || !text) return "";
    const max = contentSettings.businessListIntroductionMaxLength;
    return max > 0 && text.length > max ? `${text.slice(0, max)}…` : text;
  };
  const totalPages = Math.max(1, Math.ceil(result.totalCount / ENTERPRISE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedListings = result.items;
  const hasFilter = Boolean(query) || tagIds.length > 0;

  return (
    <>
      <BodyClass className="matching enterprise" />
      <InnerPageShell
        title="企業名錄"
        titleAside={<MatchingSubNav activeHref="/matching/enterprise" />}
        breadcrumb={[{ label: "我要媒合", href: "/matching/enterprise" }, { label: "企業名錄", href: "/matching/enterprise" }]}
        topBar={
          <div className="searchma_tching mb-5">
            <MatchingSearchBar defaultKeyword={query} taxonomy={taxonomy} selectedTagIds={tagIds} />
          </div>
        }
      >
        <div className="row">
          {pagedListings.length === 0 && <p>{hasFilter ? "沒有符合的企業。" : "目前沒有刊登中的企業。"}</p>}

          {pagedListings.map((company) => (
            <EnterpriseCard
              key={company.id}
              data={{
                href: `/matching/enterprise/${company.id}`,
                image: company.photo || withBasePath("/images/all/new_logo.jpg"),
                title: company.name,
                description: introduction(company.introduction),
                // 卡片只顯示智慧技術的第一層大類（issue #34）；沒有標籤 id 的舊資料退回顯示全部標籤名稱
                keywords: !contentSettings.showBusinessListTags ? [] : company.tagIds ? techGroupLabels(company.tagIds, taxonomy) : company.tagNames,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(page) => {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (tagIds.length > 0) params.set("tags", tagIds.join(","));
            if (page > 1) params.set("page", String(page));
            const qs = params.toString();
            return qs ? `/matching/enterprise?${qs}` : "/matching/enterprise";
          }}
        />

        {/* 列表下方的橫幅：後台「橫幅管理 → 企業名錄底部橫幅」維護（issue #55），沒有上架中的 Banner 就不顯示 */}
        <EnterpriseBottomBanner banners={bottomBanners} />
      </InnerPageShell>
    </>
  );
}
