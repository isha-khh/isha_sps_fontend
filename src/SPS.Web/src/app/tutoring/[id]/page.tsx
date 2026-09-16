import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import { TUTORING_ITEMS, getTutoringItem } from "@/lib/tutoring-data";
import { withBasePath } from "@/lib/api-client";

// 說明見 tutoring/page.tsx 同一份假資料的註解
const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

export function generateStaticParams() {
  return TUTORING_ITEMS.map((item) => ({ id: item.id }));
}

// 說明見 serve/[id]/page.tsx 同一行的註解：目前是固定假資料，不在
// 名單裡的 id 直接在路由層級當 404。
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/tutoring/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = getTutoringItem(id);
  return { title: item?.title ?? "找不到頁面" };
}

/**
 * 產業輔導詳情頁，對應設計稿 page/tutoring/show.html。結構跟
 * `/news/[id]` 幾乎一樣（沒有跑馬燈標題、封面圖＋撰稿人＋內文＋
 * 返回按鈕），目前後端沒有對應的內容類型，先用固定假資料。
 */
export default async function TutoringShowPage({ params }: PageProps<"/tutoring/[id]">) {
  const { id } = await params;
  const item = getTutoringItem(id);

  if (!item) {
    notFound();
  }

  const popularItems = TUTORING_ITEMS.map((popular) => ({
    href: `/tutoring/${popular.id}`,
    title: popular.title,
    date: popular.date,
    image: popular.image,
  }));

  return (
    <>
      <BodyClass className="tutoring show" />
      <InnerPageShell
        breadcrumb={[{ label: "產業輔導", href: "/tutoring" }, { label: item.title }]}
        aside={
          <>
            <PopularPosts items={popularItems} heading="熱門輔導" />
            <SidebarBanner items={SIDEBAR_BANNERS} />
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
                    <Badge>{item.category}</Badge>
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

          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src={item.image} alt={item.title} />
          </div>

          {item.contributor && <div className="Contributor">撰稿人 / {item.contributor}</div>}

          <div className="txt editor mb-md-5 mb-4" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />

          <MoreLink href="/tutoring" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
