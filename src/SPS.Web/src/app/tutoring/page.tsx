import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import TutoringItemCard from "@/components/tutoring/TutoringItemCard";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner from "@/components/layout/SidebarBanner";
import CategoryTabList from "@/components/layout/CategoryTabList";
import { toTutoringItem } from "@/lib/tutoring-data";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchSectionCategories, fetchSectionItems, NewsSections, SectionCategoryTypes } from "@/lib/api.server";
import { buildListHref, readListQuery } from "@/lib/list-query";
import { sortByViewCount } from "@/lib/content-list-utils";

export const metadata: Metadata = {
  title: "產業輔導",
};

const TUTORING_PAGE_SIZE = 6;

// 對應設計稿 page/_uc/side2_banner.html
/**
 * 產業輔導列表，對應設計稿 page/tutoring/index.html。2026-10-13 起資料來自後台「產業輔導 → 輔導內容」
 * （跟公告共用 News 資料表，見 `lib/tutoring-data.ts`）；左側分類是後台「產業別」，沒帶 `?category=` 時
 * 比照設計稿預設第一個產業別（後台還沒建立任何產業別時顯示全部）；關鍵字搜尋與分頁交給後端。
 */
export default async function TutoringIndexPage({ searchParams }: PageProps<"/tutoring">) {
  const params = await searchParams;
  const { query, page } = readListQuery(params);
  const rawCategory = params.category;
  const [sidebarBanners, industries, popularSource] = await Promise.all([
    fetchBanners("sidebar-tutoring"),
    fetchSectionCategories(SectionCategoryTypes.Tutoring),
    fetchSectionItems(NewsSections.Tutoring, { pageSize: 20 }),
  ]);
  const requestedName = typeof rawCategory === "string" && rawCategory ? rawCategory : undefined;
  const activeIndustry = requestedName ? industries.find((c) => c.name === requestedName) : industries[0];
  // 指定了產業別卻找不到（或已下架）→ 不顯示任何項目，而不是退回「全部」誤導使用者
  const unknownIndustry = requestedName !== undefined && !activeIndustry;

  const result = unknownIndustry
    ? { items: [], totalCount: 0, backendAvailable: true }
    : await fetchSectionItems(NewsSections.Tutoring, { search: query || undefined, categoryId: activeIndustry?.id, page, pageSize: TUTORING_PAGE_SIZE });
  const items = result.items.map(toTutoringItem);
  const totalPages = Math.max(1, Math.ceil(result.totalCount / TUTORING_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const activeName = activeIndustry?.name ?? requestedName;

  // 對應設計稿 page/_uc/side2_industry.html——原始檔案標題寫「熱門產業案例」、連去 /promotion，明顯是共用範本
  // 複製時忘記改，這裡照這頁實際的內容類型換成「熱門輔導」，卡片版型沿用同一顆通用的 PopularPosts。
  const popularItems = sortByViewCount(popularSource.items)
    .slice(0, 5)
    .map(toTutoringItem)
    .map((item) => ({ href: `/tutoring/${item.id}`, title: item.title, date: item.date, image: item.image }));

  return (
    <>
      <BodyClass className="tutoring" />
      <InnerPageShell
        title="輔導"
        breadcrumb={[{ label: "產業輔導" }, { label: "輔導" }]}
        sidebar={
          industries.length > 0 ? (
            <CategoryTabList
              activeHref={`/tutoring?category=${encodeURIComponent(activeName ?? "")}`}
              items={industries.map((industry) => ({ label: industry.name, href: `/tutoring?category=${encodeURIComponent(industry.name)}` }))}
            />
          ) : undefined
        }
        aside={
          <>
            {popularItems.length > 0 && <PopularPosts items={popularItems} heading="熱門輔導" />}
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
        <div className="search mb-md-5 mb-4">
          <SearchBar typeOptions={[]} typeLabel="產業別篩選" keywordPlaceholder="請輸入關鍵字" defaultKeyword={query} hiddenFields={activeName ? { category: activeName } : undefined} />
        </div>

        <div className="column_box">
          {!result.backendAvailable && <p>目前無法載入輔導資料，請稍後再試。</p>}
          {result.backendAvailable && items.length === 0 && <p>{query ? "沒有符合的輔導項目。" : "目前這個分類還沒有輔導項目。"}</p>}
          {items.map((item) => (
            <TutoringItemCard item={item} key={item.id} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(target) => buildListHref("/tutoring", { category: activeName, q: query, page: target })} />
      </InnerPageShell>
    </>
  );
}
