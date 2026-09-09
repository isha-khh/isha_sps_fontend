import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import PromotionSubNav from "@/components/promotion/PromotionSubNav";
import IndustryCaseCard from "@/components/promotion/IndustryCaseCard";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import { fetchPromotionCases } from "@/lib/api.server";
import { formatIsoDate, sortByViewCount } from "@/lib/content-list-utils";
import { INDUSTRY_CASES, PROMOTION_FALLBACK_IMAGE, derivePromotionIndustries } from "@/lib/promotion-data";

export const metadata: Metadata = {
  title: "產業案例",
};

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 每頁顯示幾筆——跟 `/news`（`NEWS_PAGE_SIZE`）同一套理由：後端
 * `SuccessCaseQueryParameters` 有支援真的伺服器端分頁，但這裡一次抓
 * 100 筆是為了讓 `derivePromotionIndustries()` 能反推出「全部分類」，
 * 分頁在這裡是前端這層自己切的，不是重新打一次 API。9 筆是使用者
 * 指定的數字（案例卡片是 3 欄網格，9 剛好排 3 整列）。
 */
const PROMOTION_PAGE_SIZE = 9;

/**
 * 推廣專區「產業案例」列表，對應舊站 page/promotion/index.html。
 *
 * 2026-09-08 對接真後端（比照 `/news`／`/faq` 的做法）：
 * - 案例改叫 `fetchPromotionCases()`，對到真後端 `SuccessCase`，後端
 *   沒資料/連不到才退回 `INDUSTRY_CASES` 假資料（見 lib/promotion-data.ts）。
 * - 分類篩選改叫 `industry`，不是 `category`——真後端 `SuccessCase`
 *   沒有掛 `Category` 表，`Industry` 本來就是自由文字（例如「石化
 *   產業」「傳統製造業」），不像 News/FAQ 的分類有數字 id，直接拿
 *   字串當 query string 值跟篩選條件用，不用另外處理 id↔name 對應。
 *   分類清單一樣是從抓回來的 `items` 反推（`derivePromotionIndustries`），
 *   理由跟 News/FAQ 相同：不管 `items` 是真資料還是假資料，側欄分類
 *   永遠跟看得到的案例對得上。
 * - 卡片圖優先用真後端 `coverImageUrl`，沒設定圖片的案例才退回
 *   `PROMOTION_FALLBACK_IMAGE` 佔位。
 * - 「熱門產業案例」側欄改用 `sortByViewCount()` 照真的點閱率排序，
 *   跟 `/news` 的熱門文章一樣跟主清單的搜尋條件脫勾（見 news/page.tsx
 *   對應的說明），固定顯示全站排名。
 * - 搜尋列接上真的關鍵字查詢，`?q=` 對到 `SuccessCaseQueryParameters.Search`
 *   （後端用 Title／CompanyName／Industry 做 contains 比對），跟
 *   `/news` 一樣需要用 `hiddenFields` 把目前選的產業分類保留住。
 * - `fetchPromotionCases()` 回傳 `backendAvailable`：`false` 才代表
 *   後端連不到／噴錯，這時才退回假資料；搜尋剛好 0 筆要照實顯示
 *   「查無資料」，理由跟 `fetchNews()` 完全一樣。
 * - `Pagination` 2026-09-09 之前也是寫死的佔位元件（`currentPage={1}
 *   totalPages={1}`，見 `/news` 同一天修的一樣的問題），改成照 `cases`
 *   實際筆數切頁（`PROMOTION_PAGE_SIZE`），換頁連結保留產業分類／
 *   搜尋條件，`page` 超出範圍時夾回最後一頁。
 */
export default async function PromotionIndexPage({ searchParams }: PageProps<"/promotion">) {
  const { industry: rawIndustry, q: rawQuery, page: rawPage } = await searchParams;
  const activeIndustry = typeof rawIndustry === "string" ? rawIndustry : undefined;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  const { items: backendItems, backendAvailable } = await fetchPromotionCases({ search: query || undefined });
  // 只有後端真的連不到/噴錯才退回假資料，理由同 /news/page.tsx
  const items = backendAvailable ? backendItems : INDUSTRY_CASES;
  const industries = derivePromotionIndustries(items);

  const activeHref = activeIndustry ? `/promotion?industry=${encodeURIComponent(activeIndustry)}` : "/promotion";
  const cases = activeIndustry ? items.filter((item) => item.industry === activeIndustry) : items;

  // 分頁：跟 `/news` 同一套邏輯（見 news/page.tsx 對應的說明）——照
  // `cases` 實際筆數切頁，`page` 超出範圍夾回最後一頁，換頁連結
  // （`getPageHref`）保留目前的產業分類／搜尋條件。
  const totalPages = Math.max(1, Math.ceil(cases.length / PROMOTION_PAGE_SIZE));
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const pagedCases = cases.slice((currentPage - 1) * PROMOTION_PAGE_SIZE, currentPage * PROMOTION_PAGE_SIZE);
  const getPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (activeIndustry) params.set("industry", activeIndustry);
    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/promotion?${qs}` : "/promotion";
  };

  // 熱門產業案例要看全站排名，不能被目前的搜尋字串限縮，理由同
  // /news/page.tsx 的熱門文章
  const popularSourceResult = query ? await fetchPromotionCases() : { items: backendItems, backendAvailable };
  const popularSource = popularSourceResult.backendAvailable ? popularSourceResult.items : INDUSTRY_CASES;
  const popularItems = sortByViewCount(popularSource)
    .slice(0, 5)
    .map((item) => ({
      href: `/promotion/${item.id}`,
      title: item.title,
      date: formatIsoDate(item.publishedDate),
      image: item.coverImageUrl || PROMOTION_FALLBACK_IMAGE,
    }));

  return (
    <>
      <BodyClass className="serve promotion" />
      <InnerPageShell
        title="產業案例"
        titleAside={<PromotionSubNav activeHref="/promotion" />}
        breadcrumb={
          activeIndustry
            ? [{ label: "推廣專區" }, { label: "產業案例", href: "/promotion" }, { label: activeIndustry }]
            : [{ label: "推廣專區" }, { label: "產業案例" }]
        }
        sidebar={
          <CategoryTabList
            activeHref={activeHref}
            items={[
              { label: "全部", href: "/promotion" },
              ...industries.map((industry) => ({
                label: industry,
                href: `/promotion?industry=${encodeURIComponent(industry)}`,
              })),
            ]}
          />
        }
        aside={
          <>
            <PopularPosts items={popularItems} heading="熱門產業案例" />
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
        <div className="search2 mb-md-5 mb-4">
          <SearchBar defaultKeyword={query} hiddenFields={activeIndustry ? { industry: activeIndustry } : undefined} />
        </div>

        <div className="row">
          {cases.length === 0 && (
            <p>{query ? `找不到符合「${query}」的產業案例。` : "目前這個分類還沒有產業案例。"}</p>
          )}
          {pagedCases.map((item) => (
            <IndustryCaseCard
              key={item.id}
              data={{
                href: `/promotion/${item.id}`,
                image: item.coverImageUrl || PROMOTION_FALLBACK_IMAGE,
                title: item.title,
                description: item.summary,
                date: formatIsoDate(item.publishedDate),
                views: item.viewCount,
                keywords: item.tags,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={getPageHref} />
      </InnerPageShell>
    </>
  );
}
