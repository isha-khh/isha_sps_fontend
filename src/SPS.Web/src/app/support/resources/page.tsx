import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
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
 * 左側分類是後台「補助資源分類」；沒帶 `?category=` 時預設第一個分類（後台還沒建立任何分類時顯示全部）。
 */
const SUPPORT_RESOURCE_PAGE_SIZE = 9;

export default async function SupportResourcesPage({ searchParams }: PageProps<"/support/resources">) {
  const params = await searchParams;
  const { query, page } = readListQuery(params);
  const rawCategory = params.category;
  const categories = await fetchSectionCategories(SectionCategoryTypes.SupportResource);
  const requestedName = typeof rawCategory === "string" && rawCategory ? rawCategory : undefined;
  const activeCategory = requestedName ? categories.find((c) => c.name === requestedName) : categories[0];
  // 指定了分類卻找不到 → 不顯示任何項目，而不是退回「全部」誤導使用者
  const unknownCategory = requestedName !== undefined && !activeCategory;
  const activeName = activeCategory?.name ?? requestedName;

  const result = unknownCategory
    ? { items: [], totalCount: 0, backendAvailable: true }
    : await fetchSectionItems(NewsSections.SupportResource, { search: query || undefined, categoryId: activeCategory?.id, page, pageSize: SUPPORT_RESOURCE_PAGE_SIZE });
  const filteredResources = result.items.map(toSupportResource);
  const totalPages = Math.max(1, Math.ceil(result.totalCount / SUPPORT_RESOURCE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  return (
    <>
      <BodyClass className="support resources" />
      <InnerPageShell
        title="政府補助資源"
        breadcrumb={[{ label: "補助資源" }, { label: "政府補助資源" }]}
        sidebar={
          categories.length > 0 ? (
            <CategoryTabList
              activeHref={`/support/resources?category=${encodeURIComponent(activeName ?? "")}`}
              items={categories.map((category) => ({
                label: category.name,
                href: `/support/resources?category=${encodeURIComponent(category.name)}`,
              }))}
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
            years={[]}
            yearLabel="補助類型"
            typeOptions={[]}
            typeLabel="適用產業"
            keywordPlaceholder="請輸入關鍵字"
            defaultKeyword={query}
            hiddenFields={activeName ? { category: activeName } : undefined}
          />
        </div>

        <div className="row">
          {!result.backendAvailable && <p>目前無法載入補助資源，請稍後再試。</p>}
          {result.backendAvailable && filteredResources.length === 0 && <p>{query ? "沒有符合的補助資源。" : "目前這個分類還沒有補助資源。"}</p>}
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
                  <div className={resource.image ? "tit mt-4" : "tit"}>
                    <div className="tit_nsl">
                      <div className="h3_solid">
                        <h3>{resource.title}</h3>
                      </div>
                      <p>{resource.description}</p>
                      <ul className="nav d-block mb-3">
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
                      href="javascript:void(0)"
                      data-bs-toggle="modal"
                      data-bs-target={`#${modalId}`}
                      className="det_more"
                      title="索取資料協助評估"
                    >
                      索取資料協助評估
                    </a>
                  </div>
                </div>

                <SupportRequestModal id={modalId} resourceId={resource.id} resourceTitle={resource.title} />
              </div>
            );
          })}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(target) => buildListHref("/support/resources", { category: activeName, q: query, page: target })} />
      </InnerPageShell>
    </>
  );
}
