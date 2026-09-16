import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SupportRequestModal from "@/components/support/SupportRequestModal";
import { SUPPORT_RESOURCES } from "@/lib/support-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "政府補助資源",
};

/**
 * 「政府補助資源」，對應設計稿 page/support/p01.html——「輔助資源」
 * 底下跟 /support（本計畫補助）平行的另一頁，卡片列表，點卡片上的
 * 「索取資料協助評估」開 modal 留資料，不是連去文章詳情頁。
 */
export default function SupportResourcesPage() {
  return (
    <>
      <BodyClass className="support resources" />
      <InnerPageShell
        title="政府補助資源"
        breadcrumb={[{ label: "輔助資源" }, { label: "政府補助資源" }]}
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
        <div className="search mb-4" />

        <div className="row">
          {SUPPORT_RESOURCES.map((resource) => {
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
