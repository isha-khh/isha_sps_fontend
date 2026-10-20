import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import PageSubNav, { TALENT_SUB_NAV } from "@/components/layout/PageSubNav";
import BodyClass from "@/components/BodyClass";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import CourseTable from "@/components/talent/CourseTable";
import PopularCourses from "@/components/talent/PopularCourses";
import NewsBanner from "@/components/news/NewsBanner";
import SidebarBanner from "@/components/layout/SidebarBanner";
import { toTalentCourse } from "@/lib/talent-data";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchSectionItems, NewsSections } from "@/lib/api.server";
import { buildListHref, readListQuery } from "@/lib/list-query";
import { sortByViewCount } from "@/lib/content-list-utils";

export const metadata: Metadata = {
  title: "知識加值",
};

const TALENT_PAGE_SIZE = 10;

// 對應設計稿 page/_uc/side2_banner.html——「熱門課程」下面還有一個共用的廣告欄位。
/**
 * 人才培訓課程列表，對應設計稿 page/talent/index.html。2026-10-13 起資料來自後台「人才培育 → 課程內容」
 * （跟公告共用 News 資料表，見 `lib/talent-data.ts`），關鍵字搜尋與分頁交給後端；「熱門課程」側欄取瀏覽數最高的 5 筆。
 */
export default async function TalentIndexPage({ searchParams }: PageProps<"/talent">) {
  const { query, page } = readListQuery(await searchParams);
  const [sidebarBanners, topBanners, result, popularSource] = await Promise.all([
    fetchBanners("sidebar-talent"),
    fetchBanners("talent-top"),
    fetchSectionItems(NewsSections.Talent, { search: query || undefined, page, pageSize: TALENT_PAGE_SIZE }),
    fetchSectionItems(NewsSections.Talent, { pageSize: 20 }),
  ]);
  const courses = result.items.map(toTalentCourse);
  const popularCourses = sortByViewCount(popularSource.items).slice(0, 5).map(toTalentCourse);
  const totalPages = Math.max(1, Math.ceil(result.totalCount / TALENT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  return (
    <>
      <BodyClass className="talent" />
      <InnerPageShell
        title="知識加值"
        titleAside={<PageSubNav links={TALENT_SUB_NAV} activeHref="/talent" />}
        breadcrumb={[{ label: "服務專區", href: "/serve" }, { label: "人才培育", href: "/talent" }, { label: "知識加值", href: "/talent" }]}
        banner={topBanners.some((b) => b.uri) ? <NewsBanner id="talent-banner" banners={topBanners} /> : undefined}
        aside={
          <>
            {popularCourses.length > 0 && <PopularCourses courses={popularCourses} />}
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
        <div className="search mb-4">
          <SearchBar years={[]} typeOptions={[]} keywordPlaceholder="請輸入關鍵字" defaultKeyword={query} />
        </div>

        {!result.backendAvailable && <p>目前無法載入課程資料，請稍後再試。</p>}
        {result.backendAvailable && courses.length === 0 && <p>{query ? "沒有符合的課程。" : "目前沒有課程資料。"}</p>}
        {courses.length > 0 && <CourseTable courses={courses} startIndex={(currentPage - 1) * TALENT_PAGE_SIZE} />}

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(target) => buildListHref("/talent", { q: query, page: target })} />
      </InnerPageShell>
    </>
  );
}
