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
import { fetchVideos } from "@/lib/api.server";
import { PROMOTION_VIDEOS, deriveVideoCategories, sortVideosByOrdinal } from "@/lib/promotion-data";
import { formatIsoDate, getYouTubeThumbnail } from "@/lib/content-list-utils";
import type { VideoItem } from "@/lib/types";

export const metadata: Metadata = {
  title: "影音專區",
};

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

const VIDEO_PAGE_SIZE = 9;
const VIDEO_FALLBACK_THUMBNAIL = "/images/home/ser_bg2.jpg";
// 精選影音＋清單卡片共用同一個 Fancybox 分組，燈箱開著時可以直接用
// 上一部/下一部切換到頁面上其他支影片，不用先關掉燈箱再點下一張卡片
const VIDEO_FANCYBOX_GROUP = "promotion-video";

/**
 * 卡片點下去要連去哪裡：優先用 `linkUrl`（後台「連結網址」欄位），
 * 沒填的話退回 `uri`——實測第一支塞進後台的影片直接把 YouTube 網址
 * 填在「影片檔案」（`uri`）欄位、沒有另外填「連結網址」，這種情況
 * `href` 應該還是要能連出去，不是卡在 `#` 沒反應（`uri` 本來就可能
 * 是外部影片頁面網址，不是只有 FileManagement 檔案路徑才會出現在
 * 這個欄位）。
 *
 * 縮圖同理：`thumbnailUri` 沒填、但 `uri` 是 YouTube 連結時，借用
 * YouTube 自己的縮圖（`getYouTubeThumbnail`），不用管理員手動找圖
 * 上傳，最後才退回站內的通用佔位圖。
 */
function toGridCardData(video: VideoItem) {
  return {
    href: video.linkUrl || video.uri || "#",
    thumbnail: video.thumbnailUri || getYouTubeThumbnail(video.uri) || VIDEO_FALLBACK_THUMBNAIL,
    title: video.name ?? "",
    date: formatIsoDate(video.createdTime),
    playOnSite: video.playOnSite,
  };
}

/**
 * 推廣專區「影音專區」，對應舊站 page/promotion/video.html。
 *
 * 2026-09-10 對接真後端 `GET /api/Video`（見 `fetchVideos`）：
 * - `backendAvailable:false`（連不到後端）才退回 `PROMOTION_VIDEOS`
 *   假資料，理由跟 `/news`／`/promotion` 一樣。
 * - 分類（`?category=`）對到 `albumTitle`（自由文字，不是數字 id），
 *   跟 `/promotion` 的 `industry` 篩選是同一種做法。
 * - 「精選影音」（`FeaturedVideoCard`）挑 `ordinal` 最小的那一支，
 *   不是隨便拿列表第一筆——見 `sortVideosByOrdinal` 的說明。
 * - 「熱門影片」side2 這裡**沒有**真的照熱門度排序：`Video` entity
 *   沒有點閱數欄位，跟 News/Promotion 的「熱門文章/案例」不是同一種
 *   情況，這裡只能退而求其次一樣用 `ordinal` 排序，標題還是沿用
 *   「熱門影片」字樣（沒有更好的替代說法），但語意上其實是「精選
 *   影片清單」——之後如果要做到真的照觀看數排序，`Video` entity
 *   要先加欄位。
 * - 分頁改成跟 `/news`／`/promotion` 一樣真的照筆數切頁
 *   （`VIDEO_PAGE_SIZE`），不是原本寫死的 `totalPages={1}`。
 *
 * 搜尋列這裡簡化了一點：舊站 search3.html 除了關鍵字，還有「年份」
 * 跟「類型」兩個下拉選單，`SearchBar` 目前只支援單一個「年份」下拉，
 * 沒有另外做「類型」——這兩個下拉在舊站本來也只是靜態展示、沒有真的
 * 接篩選邏輯，先不為了一頁多做一個下拉變體。
 */
export default async function PromotionVideoPage({ searchParams }: PageProps<"/promotion/video">) {
  const { category: rawCategory, page: rawPage } = await searchParams;
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  const activeHref = category ? `/promotion/video?category=${category}` : "/promotion/video";

  const { items: backendItems, backendAvailable } = await fetchVideos();
  const items = backendAvailable ? backendItems : PROMOTION_VIDEOS;
  const categories = deriveVideoCategories(items);

  const sorted = sortVideosByOrdinal(items);
  const featured = sorted[0];
  const remaining = category ? sorted.slice(1).filter((v) => v.albumTitle === category) : sorted.slice(1);

  const totalPages = Math.max(1, Math.ceil(remaining.length / VIDEO_PAGE_SIZE));
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const pagedVideos = remaining.slice((currentPage - 1) * VIDEO_PAGE_SIZE, currentPage * VIDEO_PAGE_SIZE);
  const getPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/promotion/video?${qs}` : "/promotion/video";
  };

  return (
    <>
      <BodyClass className="serve video" />
      <InnerPageShell
        title="影音專區"
        titleAside={<PromotionSubNav activeHref="/promotion/video" />}
        banner={
          featured && (
            <FeaturedVideoCard
              data={{
                href: featured.linkUrl || featured.uri || "#",
                title: featured.name ?? "",
                thumbnail: featured.thumbnailUri || getYouTubeThumbnail(featured.uri) || VIDEO_FALLBACK_THUMBNAIL,
                date: formatIsoDate(featured.createdTime),
                playOnSite: featured.playOnSite,
              }}
              group={VIDEO_FANCYBOX_GROUP}
            />
          )
        }
        breadcrumb={[{ label: "推廣專區" }, { label: "影音專區" }]}
        sidebar={
          <CategoryTabList
            activeHref={activeHref}
            items={[
              { label: "全部", href: "/promotion/video" },
              ...categories.map((c) => ({ label: c, href: `/promotion/video?category=${encodeURIComponent(c)}` })),
            ]}
          />
        }
        aside={
          <>
            <PopularPosts items={sorted.slice(0, 5).map(toGridCardData).map((v) => ({ href: v.href, title: v.title, date: v.date, image: v.thumbnail }))} heading="熱門影片" imageRatio="ratio-16x9" />
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
          {pagedVideos.length === 0 && <p>目前沒有符合這個分類的影片。</p>}

          {pagedVideos.map((video) => (
            <VideoGridCard key={video.id} data={toGridCardData(video)} group={VIDEO_FANCYBOX_GROUP} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={getPageHref} />
      </InnerPageShell>
    </>
  );
}
