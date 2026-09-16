import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import SearchBar from "@/components/ui/SearchBar";
import SupportRequestModal from "@/components/support/SupportRequestModal";
import { SUPPORT_RESOURCES, SUPPORT_RESOURCE_CATEGORIES } from "@/lib/support-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "政府補助資源",
};

/**
 * 「政府補助資源」，對應設計稿 page/support/p01.html——「輔助資源」
 * 底下跟 /support（本計畫補助）平行的另一頁，卡片列表，點卡片上的
 * 「索取資料協助評估」開 modal 留資料，不是連去文章詳情頁。
 *
 * 左側分類（page/_uc/side/side1_support.html）、搜尋列的「補助類型」
 * ／「適用產業」兩個下拉（page/_uc/search6.html）第一次讀設計稿時
 * 漏看了，2026-09-16 補上。
 */
export default async function SupportResourcesPage({ searchParams }: PageProps<"/support/resources">) {
  const { category: rawCategory } = await searchParams;
  const activeCategory = typeof rawCategory === "string" && SUPPORT_RESOURCE_CATEGORIES.includes(rawCategory) ? rawCategory : SUPPORT_RESOURCE_CATEGORIES[0];
  const filteredResources = SUPPORT_RESOURCES.filter((resource) => resource.category === activeCategory);

  return (
    <>
      <BodyClass className="support resources" />
      <InnerPageShell
        title="政府補助資源"
        breadcrumb={[{ label: "輔助資源" }, { label: "政府補助資源" }]}
        sidebar={
          <CategoryTabList
            activeHref={`/support/resources?category=${encodeURIComponent(activeCategory)}`}
            items={SUPPORT_RESOURCE_CATEGORIES.map((category) => ({
              label: category,
              href: `/support/resources?category=${encodeURIComponent(category)}`,
            }))}
          />
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
            hiddenFields={{ category: activeCategory }}
          />
        </div>

        <div className="row">
          {filteredResources.length === 0 && <p>目前這個分類還沒有補助資源。</p>}
          {filteredResources.map((resource) => {
            const modalId = `support-request-${resource.id}`;
            return (
              <div className="col-lg-4 col-md-6 col-12 item mb-md-4 mb-4" key={resource.id}>
                <div className="item_box">
                  <div className="pic">
                    <div className="ratio ratio-4x3">
                      <img className="img-fluid d-block" src={resource.image} alt={resource.title} />
                    </div>
                  </div>
                  <div className="tit mt-4">
                    <div className="tit_nsl">
                      <div className="h3_solid">
                        <h3>{resource.title}</h3>
                      </div>
                      <p>{resource.description}</p>
                      <ul className="nav d-block mb-3">
                        <li className="mb-2">
                          <i className="bi bi-person" />
                          <span>
                            <b>適用對象 : </b>
                            {resource.applicant}
                          </span>
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-currency-dollar" />
                          <span>
                            <b>補助金額 : </b>
                            {resource.amount}
                          </span>
                        </li>
                        <li className="mb-2">
                          <i className="bi bi-briefcase" />
                          <span>
                            <b>主辦單位 : </b>
                            {resource.organizer}
                          </span>
                        </li>
                        <li>
                          <i className="bi bi-calendar4-week" />
                          <span>
                            <b>申請期間 : </b>
                            {resource.period}
                          </span>
                        </li>
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

                <SupportRequestModal id={modalId} resourceTitle={resource.title} />
              </div>
            );
          })}
        </div>
      </InnerPageShell>
    </>
  );
}
