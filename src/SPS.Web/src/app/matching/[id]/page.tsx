import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MoreLink from "@/components/ui/MoreLink";
import AttachmentsPanel from "@/components/ui/AttachmentsPanel";
import Link from "next/link";
import SidebarBanner from "@/components/layout/SidebarBanner";
import RelatedNeeds from "@/components/matching/RelatedNeeds";
import ReplyNeedModal from "@/components/matching/ReplyNeedModal";
import ReplyNeedButton from "@/components/matching/ReplyNeedButton";
import FollowButton from "@/components/matching/FollowButton";
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
 * 2026-10-08 改版：右側欄按鈕改為「我要回應」（只有供應端企業會員可以，送出後待後台審核）與「追蹤」（只有需求端企業會員可以），
 * 見 `docs/媒合對接業務規格-2026-10-08.md`。
 * 跟企業名錄詳情頁（`/matching/enterprise/[id]`，對應 `show.html`）是
 * 完全不同的兩份設計稿——這頁沒有公司資訊區塊，是「需求」本身的內容
 * （公開摘要／內文／附件下載／相關需求輪播），右側欄按鈕也是「我要
 * 回應」而不是「取得聯繫窗口」，彈窗欄位也不同（見 `ReplyNeedModal`
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
            <ReplyNeedButton modalId={modalId} />

            <FollowButton demandId={Number(need.id)} variant="detail" />

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
                {need.location && (
                  <li className="mb-2">
                    <i className="bi bi-geo-alt me-1" />
                    <span>
                      <b>地點 : </b>
                      {need.location}
                    </span>
                  </li>
                )}
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

            {need.tags.length > 0 && (
              <ul className="nav ul-key">
                {need.tags.map((tag) => (
                  <li key={tag.id}>
                    <a href={withBasePath(`/matching?tags=${tag.id}`)} title={`查看同樣是「${tag.name}」的需求`} tabIndex={0}>
                      {tag.name}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 公開摘要：所有訪客都看得到 */}
          {need.description && (
            <div className="public_box mb-md-5 mb-4">
              <div className="h4 blue">
                <span>公開摘要</span>
              </div>
              <div className="txt editor">{need.description}</div>
            </div>
          )}

          {need.contentLocked ? (
            <p className="mb-md-5 mb-4">
              <i className="bi bi-lock me-2" aria-hidden="true" />
              <b className="red">企業會員可見完整內容與附件。</b>
              <Link href="/member/login" title="前往登入" className="ms-2">
                登入企業會員
              </Link>
            </p>
          ) : (
            <>
              {/* 內文是後台輸入的純文字，不當 HTML 輸出（避免後台內容夾帶腳本）；換行分段 */}
              <div className="txt editor mb-md-5 mb-4">
                {need.body
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>

              {need.attachments.length > 0 && (
                <div className="dk_conbo mb-md-5 mb-4">
                  <AttachmentsPanel attachments={need.attachments} />
                </div>
              )}
            </>
          )}

          <div className="dk_conbo mb-md-5 mb-4">
            <RelatedNeeds id={`related-needs-${need.id}`} needs={relatedNeeds} />
          </div>

          <MoreLink href="/matching" label="返回" title="返回" />
        </div>
      </InnerPageShell>

      <ReplyNeedModal id={modalId} demandId={need.id} demandTitle={need.title} followerCount={need.followerCount} />
    </>
  );
}
