import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import ServeSubNav from "@/components/serve/ServeSubNav";
import SidebarBanner from "@/components/layout/SidebarBanner";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import ServeItemCard from "@/components/serve/ServeItemCard";
import { toServeCardItem } from "@/lib/serve-data";
import { redirect } from "next/navigation";
import { fetchBanners, fetchIndustryAiLink, fetchServeCategories, fetchServeItems } from "@/lib/api.server";
import { INDUSTRY_AI_CATEGORY } from "@/lib/industry-ai-link";

export const metadata: Metadata = {
  title: "服務專區",
};

const SERVE_PAGE_SIZE = 9;

/**
 * 服務專區列表，對應舊站 serve/index.html（三欄卡片）。2026-10-13 起資料來自後台「服務專區」維護的內容
 * （跟公告共用 News 資料表，見 `lib/serve-data.ts`），分類、關鍵字搜尋與分頁都交給後端；沒有內容就顯示「目前沒有資料」，
 * 不再有假資料。`?category=` 是分類名稱（前台主選單連來的是 `產業AI`、`技術文件`），對應後台「服務專區分類」同名的分類；
 * 後台還沒建立那個分類時，該分類顯示沒有項目。
 *
 * 側欄的「全部／分類1／分類2」是舊站原樣的裝飾性連結（舊站原始碼裡三個連結都指回同一個網址，不是真的篩選），
 * 照舊站原樣呈現，不要自己幫這層編出真的篩選邏輯。
 */
export default async function ServeIndexPage({ searchParams }: PageProps<"/serve">) {
  const sidebarBanners = await fetchBanners("sidebar-serve");
  const { category: rawCategory, q: rawQuery, page: rawPage } = await searchParams;
  const category = typeof rawCategory === "string" && rawCategory ? rawCategory : undefined;
  // 後台「頁面設定」開啟「產業AI」外部連結時，舊的內部網址（書籤、搜尋結果）也導向外部連結
  if (category === INDUSTRY_AI_CATEGORY) {
    const industryAi = await fetchIndustryAiLink();
    if (industryAi.enabled) redirect(industryAi.url);
  }
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.floor(requestedPage) : 1;

  const [categories, industryAiLink] = await Promise.all([fetchServeCategories(), fetchIndustryAiLink()]);
  const activeCategory = category ? categories.find((c) => c.name === category) : undefined;
  // 指定了分類名稱卻找不到（後台還沒建立）→ 不顯示任何項目，而不是退回「全部」誤導使用者
  const unknownCategory = category !== undefined && !activeCategory;

  const result = unknownCategory ? { items: [], totalCount: 0, backendAvailable: true } : await fetchServeItems({ search: query || undefined, categoryId: activeCategory?.id, page, pageSize: SERVE_PAGE_SIZE });
  const items = result.items.map(toServeCardItem);
  const totalPages = Math.max(1, Math.ceil(result.totalCount / SERVE_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const currentHref = category ? `/serve?category=${encodeURIComponent(category)}` : "/serve";
  // 沒帶 `?category=`（直接進 /serve）也要有子選單，設計稿 page/serve/index.html 的跑馬燈標題旁一直都有（issue #28）；這時沒有項目是 active
  const siblingCategories = categories.length > 1 ? categories.map((c) => c.name) : undefined;
  const getPageHref = (target: number) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (query) params.set("q", query);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/serve?${qs}` : "/serve";
  };

  return (
    <>
      <BodyClass className="serve" />

      <InnerPageShell
        title={category ?? "服務專區"}
        titleAside={siblingCategories ? <ServeSubNav categories={siblingCategories} activeCategory={category ?? ""} industryAiLink={industryAiLink} /> : undefined}
        breadcrumb={category ? [{ label: "服務專區", href: "/serve" }, { label: category }] : [{ label: "服務專區" }]}
        sidebar={
          <CategoryTabList
            activeHref={currentHref}
            items={[
              { label: "全部", href: currentHref },
              { label: "分類1", href: `${currentHref}#分類1` },
              { label: "分類2", href: `${currentHref}#分類2` },
            ]}
          />
        }
        aside={<SidebarBanner banners={sidebarBanners} />}
      >
        <div className="search2 mb-md-5 mb-4">
          <SearchBar keywordPlaceholder="請輸入關鍵字" defaultKeyword={query} hiddenFields={category ? { category } : undefined} />
        </div>
        <div className="row">
          {!result.backendAvailable && <p>目前無法載入服務專區的資料，請稍後再試。</p>}
          {result.backendAvailable && items.length === 0 && <p>{query ? "沒有符合的項目。" : category ? "目前沒有符合這個分類的項目。" : "目前沒有資料。"}</p>}
          {items.map((item) => (
            <ServeItemCard
              key={item.id}
              data={{
                href: `/serve/${item.id}`,
                image: item.image,
                category: item.category,
                date: item.date,
                title: item.title,
                description: item.description,
                keywords: item.keywords,
                hasAttachments: item.hasAttachments,
              }}
            />
          ))}
        </div>
        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={getPageHref} />
      </InnerPageShell>
    </>
  );
}
