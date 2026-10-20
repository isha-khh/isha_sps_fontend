import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import PageSubNav, { SUPPORT_SUB_NAV } from "@/components/layout/PageSubNav";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import SearchBar from "@/components/ui/SearchBar";
import SupportRequestModal from "@/components/support/SupportRequestModal";
import Pagination from "@/components/ui/Pagination";
import { toSupportResource } from "@/lib/support-data";
import { withBasePath } from "@/lib/api-client";
import { fetchSectionCategories, fetchSectionItems, NewsSections, SectionCategoryTypes } from "@/lib/api.server";
import { buildListHref, readListQuery } from "@/lib/list-query";

export const metadata: Metadata = {
  title: "政府補助資源",
};

/**
 * 「政府補助資源」，對應設計稿 page/support/p01.html——「補助資源」
 * 底下跟 /support（本計畫補助）平行的另一頁，卡片列表，點卡片上的
 * 「索取資料協助評估」開 modal 留資料，不是連去文章詳情頁。
 *
 * 左側分類（page/_uc/side/side1_support.html）、搜尋列的「補助類型」
 * ／「適用產業」兩個下拉（page/_uc/search6.html）第一次讀設計稿時
 * 漏看了，2026-09-16 補上。
 *
 * 2026-10-13 起資料來自後台「補助專區 → 政府補助資源」（跟公告共用 News 資料表，見 `lib/support-data.ts`），
 * 左側分類是後台「補助資源分類」。2026-10-19（issue #24、#25）：搜尋列兩個下拉原本是空的——「補助類型」現在列出
 * 補助資源分類（跟左側同一個 `?category=`），「適用產業」列出後台「補助資源產業別」（`?industry=`，一個資源可以屬於多個產業別）；
 * 沒帶 `?category=` 時顯示全部（原本預設第一個分類，使用者以為只有那幾筆），左側分類多了「全部」。
 */
const SUPPORT_RESOURCE_PAGE_SIZE = 9;

export default async function SupportResourcesPage({ searchParams }: PageProps<"/support/resources">) {
  const params = await searchParams;
  const { query, page } = readListQuery(params);
  const rawCategory = params.category;
  const rawIndustry = params.industry;
  const [categories, industries] = await Promise.all([
    fetchSectionCategories(SectionCategoryTypes.SupportResource),
    fetchSectionCategories(SectionCategoryTypes.SupportResourceIndustry),
  ]);
  const requestedName = typeof rawCategory === "string" && rawCategory ? rawCategory : undefined;
  const requestedIndustry = typeof rawIndustry === "string" && rawIndustry ? rawIndustry : undefined;
  const activeCategory = requestedName ? categories.find((c) => c.name === requestedName) : undefined;
  const activeIndustry = requestedIndustry ? industries.find((c) => c.name === requestedIndustry) : undefined;
  // 指定了分類或產業別卻找不到 → 不顯示任何項目，而不是退回「全部」誤導使用者
  const unknownFilter = (requestedName !== undefined && !activeCategory) || (requestedIndustry !== undefined && !activeIndustry);
  const activeName = activeCategory?.name ?? requestedName;
  const activeIndustryName = activeIndustry?.name ?? requestedIndustry;

  const result = unknownFilter
    ? { items: [], totalCount: 0, backendAvailable: true }
    : await fetchSectionItems(NewsSections.SupportResource, {
        search: query || undefined,
        categoryId: activeCategory?.id,
        industryId: activeIndustry?.id,
        page,
        pageSize: SUPPORT_RESOURCE_PAGE_SIZE,
      });
  const filteredResources = result.items.map(toSupportResource);
  const totalPages = Math.max(1, Math.ceil(result.totalCount / SUPPORT_RESOURCE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <>
      {/* 設計稿 page/support/p01.html 的 body 是 `support p01`：`.support.p01 .content { width:100% }` 讓卡片列撐滿整個內容寬度（3 欄），
          沒有 `p01` 的話內容區卡在預設 67%，卡片又窄又擠、標題被擠成兩行（issue #35） */}
      <BodyClass className="support p01" />
      <InnerPageShell
        title="政府補助資源"
        titleAside={<PageSubNav links={SUPPORT_SUB_NAV} activeHref="/support/resources" />}
        breadcrumb={[{ label: "服務專區", href: "/serve" }, { label: "補助資源", href: "/support" }, { label: "政府補助資源", href: "/support/resources" }]}
        sidebar={
          categories.length > 0 ? (
            <CategoryTabList
              activeHref={activeName ? `/support/resources?category=${encodeURIComponent(activeName)}` : "/support/resources"}
              items={[
                { label: "全部", href: "/support/resources" },
                ...categories.map((category) => ({
                  label: category.name,
                  href: `/support/resources?category=${encodeURIComponent(category.name)}`,
                })),
              ]}
            />
          ) : undefined
        }
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_6.png")} alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
            </div>
          </>
        }
      >
        <div className="search mb-4">
          <SearchBar
            years={categories.map((category) => category.name)}
            yearLabel="全部補助類型"
            yearParamName="category"
            defaultYear={activeName ?? ""}
            typeOptions={industries.map((industry) => industry.name)}
            typeLabel="全部適用產業"
            typeParamName="industry"
            defaultType={activeIndustryName ?? ""}
            keywordPlaceholder="請輸入關鍵字"
            defaultKeyword={query}
          />
        </div>

        <div className="row">
          {!result.backendAvailable && <p>目前無法載入補助資源，請稍後再試。</p>}
          {result.backendAvailable && filteredResources.length === 0 && <p>{query || activeName || activeIndustryName ? "沒有符合的補助資源。" : "目前還沒有補助資源。"}</p>}
          {filteredResources.map((resource) => {
            const modalId = `support-request-${resource.id}`;
            return (
              <div className="col-lg-4 col-md-6 col-12 item mb-md-4 mb-4" key={resource.id}>
                <div className="item_box">
                  {resource.image && (
                    <div className="pic">
                      <div className="ratio ratio-4x3">
                        <img className="img-fluid d-block" src={resource.image} alt={resource.title} />
                      </div>
                    </div>
                  )}
                  {/* 設計稿卡片的 `.tit` 一律有 `mt-4`；沒有封面圖時原本沒加，標題會緊貼卡片上緣（issue #35） */}
                  <div className="tit mt-4">
                    <div className="tit_nsl">
                      <div className="h3_solid">
                        <h3>{resource.title}</h3>
                      </div>
                      <p>{resource.description}</p>
                      <ul className="nav d-block mb-3">
                        {resource.industries.length > 0 && (
                          <li className="mb-2">
                            <i className="bi bi-buildings" />
                            <span>
                              <b>適用產業 : </b>
                              {resource.industries.join("、")}
                            </span>
                          </li>
                        )}
                        {resource.applicant && (
                          <li className="mb-2">
                            <i className="bi bi-person" />
                            <span>
                              <b>適用對象 : </b>
                              {resource.applicant}
                            </span>
                          </li>
                        )}
                        {resource.amount && (
                          <li className="mb-2">
                            <i className="bi bi-currency-dollar" />
                            <span>
                              <b>補助金額 : </b>
                              {resource.amount}
                            </span>
                          </li>
                        )}
                        {resource.organizer && (
                          <li className="mb-2">
                            <i className="bi bi-briefcase" />
                            <span>
                              <b>主辦單位 : </b>
                              {resource.organizer}
                            </span>
                          </li>
                        )}
                        {resource.period && (
                          <li>
                            <i className="bi bi-calendar4-week" />
                            <span>
                              <b>申請期間 : </b>
                              {resource.period}
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>

                    <ul className="nav ul-key">
                      {resource.keywords.map((keyword) => (
                        <li key={keyword}>
                          <a href="#" title={keyword} tabIndex={0}>
                            {keyword}
                          </a>
                        </li>
                      ))}
                    </ul>

                    <a
                      href="#"
                      data-bs-toggle="modal"
                      data-bs-target={`#${modalId}`}
                      className="det_more"
                      title="索取資料協助評估"
                    >
                      索取資料協助評估
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(target) => buildListHref("/support/resources", { category: activeName, industry: activeIndustryName, q: query, page: target })} />
      </InnerPageShell>

      {/*
        彈窗必須放在 `<main>` 外面（issue #26）：`<main>` 有 `position:relative; z-index:10`，自成一個堆疊層，
        放在裡面的彈窗（z-index 1055）永遠比掛在 `<body>` 底下的背景遮罩（1050）低，遮罩會蓋住彈窗、攔截所有點擊，
        整個彈窗點不動。其他頁（媒合對接）的彈窗也都是放在頁面最外層。
      */}
      {filteredResources.map((resource) => (
        <SupportRequestModal key={resource.id} id={`support-request-${resource.id}`} resourceId={resource.id} resourceTitle={resource.title} />
      ))}
    </>
  );
}
