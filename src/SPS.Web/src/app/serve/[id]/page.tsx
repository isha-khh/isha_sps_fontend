import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import SidebarBanner from "@/components/layout/SidebarBanner";
import DownloadRequestForm from "@/components/serve/DownloadRequestForm";
import { PuckRenderer } from "@/components/puck/PuckRenderer";
import NewsViewTracker from "@/components/news/NewsViewTracker";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchServeDetail } from "@/lib/api.server";
import { formatIsoDate } from "@/lib/content-list-utils";

export async function generateMetadata({ params }: PageProps<"/serve/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchServeDetail(id);
  // 查無這個項目時，分頁標題也要跟著換成「找不到頁面」，不然瀏覽器
  // 分頁會顯示「服務專區」，但畫面其實已經是 not-found.tsx 那頁了。
  return { title: item?.title ?? "找不到頁面" };
}

/**
 * 服務專區詳情頁，對應舊站 serve/show.html。跟 `/news/[id]` 結構很像
 * （沒有跑馬燈標題、沒有左側分類選單、ShareBox 在這裡才用），主要差異
 * 是 `dk_conbo` 那塊：news 是附件下載/相關連結/聯繫人資訊三個唯讀清單，
 * serve 是一份「留資料換下載文件」的表單（DownloadRequestForm，含
 * 個資蒐集同意 modal）。
 */
export default async function ServeShowPage({ params }: PageProps<"/serve/[id]">) {
  const sidebarBanners = await fetchBanners("sidebar-serve");
  const { id } = await params;
  const item = await fetchServeDetail(id);

  if (!item) {
    notFound();
  }

  return (
    <>
      {/* 設計稿詳情頁的 body 是 `news serve show`：`.news.show .breadcrumb { margin-top:110px }` 把麵包屑推到固定導覽列下面，少了 `news` 標題會壓到導覽列（issue #39） */}
      <BodyClass className="news serve show" />
      <NewsViewTracker newsId={item.id} />
      <InnerPageShell
        breadcrumb={[{ label: "服務專區", href: "/serve" }, { label: "技術工具", href: "/serve" }, ...(item.categoryName ? [{ label: item.categoryName, href: `/serve?category=${encodeURIComponent(item.categoryName)}` }] : []), { label: item.title }]}
        aside={<SidebarBanner banners={sidebarBanners} />}
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
              <h3>{item.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">
                    <Badge>{item.categoryName}</Badge>
                  </div>
                  <div className="part-line"></div>
                  <div className="date">{formatIsoDate(item.startDate ?? item.createdTime)}</div>
                </div>

                <ShareBox />
              </div>
            </div>

            {item.tags && item.tags.length > 0 && (
              <ul className="nav ul-key">
                {item.tags.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {item.imageUrl && <ZoomableImage src={item.imageUrl} alt={item.title} caption={item.title} />}

          <div className="txt editor mb-md-5 mb-4">
            <PuckRenderer content={item.content} />
          </div>

          {/* 有附件才顯示「立即下載」表單；附件不在頁面上列出，填完表單才拿得到下載連結 */}
          {(item.attachmentCount ?? 0) > 0 && (
            <div className="dk_conbo mb-md-5 mb-4">
              <DownloadRequestForm itemId={item.id} itemTitle={item.title} />
            </div>
          )}

          <MoreLink href="/serve" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
