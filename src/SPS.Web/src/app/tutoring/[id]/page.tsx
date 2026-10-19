import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner from "@/components/layout/SidebarBanner";
import NewsViewTracker from "@/components/news/NewsViewTracker";
import { PuckRenderer } from "@/components/puck/PuckRenderer";
import { toTutoringItem } from "@/lib/tutoring-data";
import { fetchBanners, fetchSectionDetail, fetchSectionItems, NewsSections } from "@/lib/api.server";
import { sortByViewCount } from "@/lib/content-list-utils";

export async function generateMetadata({ params }: PageProps<"/tutoring/[id]">): Promise<Metadata> {
  const { id } = await params;
  const detail = await fetchSectionDetail(NewsSections.Tutoring, id);
  return { title: detail?.title ?? "找不到頁面" };
}

/**
 * 產業輔導詳情頁，對應設計稿 page/tutoring/show.html。結構跟 `/news/[id]` 幾乎一樣（沒有跑馬燈標題、封面圖＋
 * 撰稿人＋內文＋返回按鈕）。2026-10-13 起資料來自後台「產業輔導 → 輔導內容」；附件下載（簡章）、相關連結、
 * 聯絡資訊都是後台內容編輯器裡的區塊。
 */
export default async function TutoringShowPage({ params }: PageProps<"/tutoring/[id]">) {
  const { id } = await params;
  const [detail, sidebarBanners, popularSource] = await Promise.all([
    fetchSectionDetail(NewsSections.Tutoring, id),
    fetchBanners("sidebar-tutoring"),
    fetchSectionItems(NewsSections.Tutoring, { pageSize: 20 }),
  ]);

  if (!detail) {
    notFound();
  }

  const item = toTutoringItem(detail);
  const popularItems = sortByViewCount(popularSource.items)
    .slice(0, 5)
    .map(toTutoringItem)
    .map((popular) => ({ href: `/tutoring/${popular.id}`, title: popular.title, date: popular.date, image: popular.image }));

  return (
    <>
      <BodyClass className="tutoring show" />
      <NewsViewTracker newsId={detail.id} />
      <InnerPageShell
        breadcrumb={[{ label: "產業輔導", href: "/tutoring" }, ...(item.industry ? [{ label: item.industry, href: `/tutoring?category=${encodeURIComponent(item.industry)}` }] : []), { label: item.title }]}
        aside={
          <>
            {popularItems.length > 0 && <PopularPosts items={popularItems} heading="熱門輔導" />}
            <SidebarBanner banners={sidebarBanners} />
          </>
        }
      >
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{item.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  {/* 設計稿的 `.tit_three_left .tag-wrap span` 是 display:block，多個產業別會一個一行；用 flex 讓它們排在同一行、太長自動換行 */}
                  <div className="tag-wrap" style={{ display: "flex", flexWrap: "wrap", columnGap: "0.75rem" }}>
                    {item.industries.length > 0 && <span>產業別：</span>}
                    {item.industries.map((name) => (
                      <Badge key={name}>{name}</Badge>
                    ))}
                  </div>
                  <div className="part-line"></div>
                  <div className="date">{item.date}</div>
                </div>

                <ShareBox />
              </div>
            </div>

            {item.keywords.length > 0 && (
              <ul className="nav ul-key">
                {item.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {item.image && <ZoomableImage src={item.image} alt={item.title} caption={item.title} />}

          {item.contributor && <div className="Contributor">撰稿人 / {item.contributor}</div>}

          <div className="txt editor mb-md-5 mb-4">
            <PuckRenderer content={detail.content} />
          </div>

          <MoreLink href="/tutoring" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
