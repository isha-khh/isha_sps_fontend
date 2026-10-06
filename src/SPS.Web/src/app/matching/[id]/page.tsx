import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MoreLink from "@/components/ui/MoreLink";
import SidebarBanner from "@/components/layout/SidebarBanner";
import RelatedNeeds from "@/components/matching/RelatedNeeds";
import ProposeSolutionModal from "@/components/matching/ProposeSolutionModal";
import { demandToNeed } from "@/lib/matching-need-data";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchDemandDetail, fetchDemands } from "@/lib/api.server";

export async function generateMetadata({ params }: PageProps<"/matching/[id]">): Promise<Metadata> {
  const { id } = await params;
  const demand = await fetchDemandDetail(id);
  return { title: demand?.name ?? "找不到頁面" };
}

/**
 * 「媒合對接」需求詳情頁（提供解方），對應設計稿 `page/matching/show2.html`。
 * 跟企業名錄詳情頁（`/matching/enterprise/[id]`，對應 `show.html`）是
 * 完全不同的兩份設計稿——這頁沒有公司資訊區塊，是「需求」本身的內容
 * （公開摘要／內文／附件下載／相關需求輪播），右側欄按鈕也是「我要
 * 提案」而不是「取得聯繫窗口」，彈窗欄位也不同（見 `ProposeSolutionModal`
 * 開頭的說明）。
 */
export default async function MatchingNeedDetailPage({ params }: PageProps<"/matching/[id]">) {
  const sidebarBanners = await fetchBanners("sidebar-matching");
  const { id } = await params;
  const demand = await fetchDemandDetail(id);

  if (!demand) {
    notFound();
  }

  const need = demandToNeed(demand);
  const { items: allDemands } = await fetchDemands();
  const relatedNeeds = allDemands
    .filter((item) => item.id !== demand.id)
    .slice(0, 6)
    .map(demandToNeed);
  const modalId = `propose-solution-${need.id}`;

  return (
    <>
      <BodyClass className="news matching index show" />

      <InnerPageShell
        breadcrumb={[{ label: "媒合對接", href: "/matching" }, { label: need.title }]}
        aside={
          <>
            <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target={`#${modalId}`} className="me_Publish more_x">
              <span>我要提案</span>
              <i className="bi bi-pencil-square" aria-hidden="true" />
            </a>

            <SidebarBanner banners={sidebarBanners} />
          </>
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
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <div className="tag-wrap">
                <span className="badge-tag">{need.statusLabel}</span>
              </div>

              <h3>{need.title}</h3>

              <ul className="nav mb-4">
                <li className="mb-2">
                  <i className="bi bi-calendar4-week me-1" />
                  <span>
                    <b>發布日期 : </b>
                    {need.publishedDate}
                  </span>
                </li>
                <li>
                  <i className="bi bi-card-text me-1" />
                  <span>
                    <b>需求編號 : </b>
                    {need.needCode}
                  </span>
                </li>
              </ul>
            </div>

            {need.keywords.length > 0 && (
              <ul className="nav ul-key">
                {need.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 內文是後台輸入的純文字，不當 HTML 輸出（避免後台內容夾帶腳本）；換行分段 */}
          <div className="txt editor mb-md-5 mb-4">
            {need.body.split(/\n+/).filter(Boolean).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="dk_conbo mb-md-5 mb-4">
            <RelatedNeeds id={`related-needs-${need.id}`} needs={relatedNeeds} />
          </div>

          <MoreLink href="/matching" label="返回" title="返回" />
        </div>
      </InnerPageShell>

      <ProposeSolutionModal id={modalId} />
    </>
  );
}
