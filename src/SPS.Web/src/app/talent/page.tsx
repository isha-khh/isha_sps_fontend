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
import { pickPopularCourses, sortCoursesByDate, toTalentCourse } from "@/lib/talent-data";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchSectionItems, NewsSections } from "@/lib/api.server";
import { buildListHref, readListQuery } from "@/lib/list-query";

export const metadata: Metadata = {
  title: "知識加值",
};

const TALENT_PAGE_SIZE = 10;
// 年份／類型篩選要在前台做，一次抓的課程數上限（課程數量不多）
const ALL_COURSES_LIMIT = 100;

// 對應設計稿 page/_uc/side2_banner.html——「熱門課程」下面還有一個共用的廣告欄位。
/**
 * 人才培訓課程列表，對應設計稿 page/talent/index.html。2026-10-13 起資料來自後台「人才培育 → 課程內容」
 * （跟公告共用 News 資料表，見 `lib/talent-data.ts`），關鍵字搜尋交給後端；表格依開課起日由新到舊排序；「熱門課程」側欄由後台課程的「熱門課程排序」決定（最多 5 筆）。
 *
 * 搜尋列的「年份」「類型」兩個下拉原本是空的（設計稿的佔位，客戶回報「知識加值選單沒功能」）。現在：
 * - 年份＝課程開課起日的年份（後台「課程資訊 → 開課起日」；沒填就用公告上架日期的年份），選項列出所有課程出現過的年份；
 * - 類型＝課程的「課程類型」（後台「人才培育 → 課程類型」維護、課程編輯時勾選，後端 TagType.CourseType，跟公告共用的關鍵字標籤是獨立的兩組），選項列出所有課程用到的類型。
 * 課程數量不多，所以一次抓全部（上限 100 筆）在前台篩選與分頁，選項才不會被目前頁面或搜尋結果限縮。
 */
export default async function TalentIndexPage({ searchParams }: PageProps<"/talent">) {
  const params = await searchParams;
  const { query, page } = readListQuery(params);
  const year = typeof params.year === "string" && /^\d{4}$/.test(params.year) ? params.year : "";
  const type = typeof params.type === "string" ? params.type.trim() : "";
  const [sidebarBanners, topBanners, result, allSource] = await Promise.all([
    fetchBanners("sidebar-talent"),
    fetchBanners("talent-top"),
    fetchSectionItems(NewsSections.Talent, { search: query || undefined, page: 1, pageSize: ALL_COURSES_LIMIT }),
    fetchSectionItems(NewsSections.Talent, { pageSize: ALL_COURSES_LIMIT }),
  ]);
  // 課程的年份：開課起日（YYYY-MM-DD）的年份，沒填就用上架日期
  const yearOf = (item: (typeof allSource.items)[number]) => (item.meta?.dateStart ?? item.startDate ?? item.createdTime ?? "").slice(0, 4);
  const years = Array.from(new Set(allSource.items.map(yearOf).filter((y) => /^\d{4}$/.test(y)))).sort((a, b) => Number(b) - Number(a));
  const types = Array.from(new Set(allSource.items.flatMap((item) => (item.courseTypes ?? []).map((t) => t.name)))).sort((a, b) => a.localeCompare(b, "zh-Hant"));
  // 表格依時間排序（開課起日由新到舊），不手動維護
  const filtered = sortCoursesByDate(result.items).filter((item) => (!year || yearOf(item) === year) && (!type || (item.courseTypes ?? []).some((t) => t.name === type)));
  const totalPages = Math.max(1, Math.ceil(filtered.length / TALENT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const courses = filtered.slice((currentPage - 1) * TALENT_PAGE_SIZE, currentPage * TALENT_PAGE_SIZE).map(toTalentCourse);
  // 「熱門課程」獨立排序：後台課程的「熱門課程排序」，不受表格排序影響
  const popularCourses = pickPopularCourses(allSource.items).map(toTalentCourse);
  const hasFilter = Boolean(query || year || type);
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
          <SearchBar
            years={years}
            yearLabel="全部年份"
            defaultYear={year}
            typeOptions={types}
            typeLabel="全部類型"
            defaultType={type}
            keywordPlaceholder="請輸入關鍵字"
            defaultKeyword={query}
          />
        </div>

        {!result.backendAvailable && <p>目前無法載入課程資料，請稍後再試。</p>}
        {result.backendAvailable && courses.length === 0 && <p>{hasFilter ? "沒有符合的課程。" : "目前沒有課程資料。"}</p>}
        {courses.length > 0 && <CourseTable courses={courses} startIndex={(currentPage - 1) * TALENT_PAGE_SIZE} />}

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(target) => buildListHref("/talent", { year, type, q: query, page: target })} />
      </InnerPageShell>
    </>
  );
}
