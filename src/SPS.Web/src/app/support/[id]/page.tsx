import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import SidebarBanner from "@/components/layout/SidebarBanner";
import NewsViewTracker from "@/components/news/NewsViewTracker";
import { PuckRenderer } from "@/components/puck/PuckRenderer";
import { fetchBanners, fetchSectionDetail, NewsSections } from "@/lib/api.server";
import { formatIsoDate } from "@/lib/content-list-utils";

export async function generateMetadata({ params }: PageProps<"/support/[id]">): Promise<Metadata> {
  const { id } = await params;
  const detail = await fetchSectionDetail(NewsSections.Support, id);
  return { title: detail?.title ?? "找不到頁面" };
}

/**
 * 補助公告詳情頁（`/support` 列表點進來）。設計稿沒有這一頁，版型沿用服務專區／產業輔導詳情（標題、日期、
 * 封面圖、內文、返回）；內文、附件下載、相關連結都是後台內容編輯器裡的區塊。
 */
export default async function SupportNoticePage({ params }: PageProps<"/support/[id]">) {
  const { id } = await params;
  const [detail, sidebarBanners] = await Promise.all([fetchSectionDetail(NewsSections.Support, id), fetchBanners("sidebar-support")]);

  if (!detail) {
    notFound();
  }

  return (
    <>
      <BodyClass className="support show" />
      <NewsViewTracker newsId={detail.id} />
      <InnerPageShell breadcrumb={[{ label: "補助資源" }, { label: "本計畫補助", href: "/support" }, { label: detail.title }]} aside={<SidebarBanner banners={sidebarBanners} />}>
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{detail.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="date">{formatIsoDate(detail.startDate ?? detail.createdTime)}</div>
                </div>

                <ShareBox />
              </div>
            </div>
          </div>

          {detail.imageUrl && <ZoomableImage src={detail.imageUrl} alt={detail.title} caption={detail.title} />}

          <div className="txt editor mb-md-5 mb-4">
            <PuckRenderer content={detail.content} />
          </div>

          <MoreLink href="/support" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
