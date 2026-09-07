import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import PromotionSubNav from "@/components/promotion/PromotionSubNav";
import FeaturedVideoCard from "@/components/promotion/FeaturedVideoCard";
import VideoGridCard from "@/components/promotion/VideoGridCard";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import { PROMOTION_VIDEOS } from "@/lib/promotion-data";

export const metadata: Metadata = {
  title: "影音專區",
};

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 推廣專區「影音專區」，對應舊站 page/promotion/video.html。
 *
 * 跟「產業案例」列表（app/promotion/page.tsx）結構像，多一塊
 * `FeaturedVideoCard`（精選影音，跑馬燈標題跟麵包屑中間，只有一則）。
 *
 * 搜尋列這裡簡化了一點：舊站 search3.html 除了關鍵字，還有「年份」
 * 跟「類型」兩個下拉選單，`SearchBar` 目前只支援單一個「年份」下拉，
 * 沒有另外做「類型」——這兩個下拉在舊站本來也只是靜態展示、沒有真的
 * 接篩選邏輯，先不為了一頁多做一個下拉變體。
 */
export default async function PromotionVideoPage({ searchParams }: PageProps<"/promotion/video">) {
  const { category: rawCategory } = await searchParams;
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  const activeHref = category ? `/promotion/video?category=${category}` : "/promotion/video";

  const featured = PROMOTION_VIDEOS[0];

  return (
    <>
      <BodyClass className="serve video" />
      <InnerPageShell
        title="影音專區"
        titleAside={<PromotionSubNav activeHref="/promotion/video" />}
        banner={
          <FeaturedVideoCard
            data={{
              href: "#",
              title: featured.title,
              description: featured.description,
              thumbnail: featured.thumbnail,
              date: featured.date,
              keywords: featured.keywords,
            }}
          />
        }
        breadcrumb={[{ label: "推廣專區" }, { label: "影音專區" }]}
        sidebar={
          <CategoryTabList
            activeHref={activeHref}
            items={[
              { label: "全部", href: "/promotion/video" },
              { label: "分類1", href: "/promotion/video?category=分類1" },
              { label: "分類2", href: "/promotion/video?category=分類2" },
            ]}
          />
        }
        aside={
          <>
            <PopularPosts
              items={PROMOTION_VIDEOS.map((video) => ({ href: "#", title: video.title, date: video.date, image: video.thumbnail }))}
              moreHref="/promotion/video"
              heading="熱門影片"
              moreLabel="查看更多影片"
              imageRatio="ratio-16x9"
            />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_6.png" alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
            </div>
          </>
        }
      >
        <div className="search mb-md-5 mb-4">
          <SearchBar years={[]} />
        </div>

        <div className="row">
          {PROMOTION_VIDEOS.map((video) => (
            <VideoGridCard
              key={video.id}
              data={{ href: "#", thumbnail: video.thumbnail, title: video.title, date: video.date, keywords: video.keywords }}
            />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={1} getHref={(page) => `/promotion/video?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
