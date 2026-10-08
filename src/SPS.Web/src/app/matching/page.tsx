import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MatchingSubNav from "@/components/matching/MatchingSubNav";
import MatchingSearchBar from "@/components/matching/MatchingSearchBar";
import NeedListItem from "@/components/matching/NeedListItem";
import PublishNeedModal from "@/components/matching/PublishNeedModal";
import PublishNeedButton from "@/components/matching/PublishNeedButton";
import Pagination from "@/components/ui/Pagination";
import SidebarBanner from "@/components/layout/SidebarBanner";
import { demandToNeed } from "@/lib/matching-need-data";
import { withBasePath } from "@/lib/api-client";
import { fetchBanners, fetchDemandsPage, fetchTagTaxonomy } from "@/lib/api.server";
import { parseTagIds } from "@/lib/company-tags";

export const metadata: Metadata = {
  title: "媒合對接",
};

const NEED_PAGE_SIZE = 8;

// 說明見 talent/page.tsx 同一份假資料的註解
/**
 * 「媒合對接」需求列表，對應設計稿 `page/matching/index.html`。跟已經
 * 做好的企業名錄列表（`/matching/enterprise`）是同一個模組底下的另一
 * 個子頁面，共用同一顆 `MatchingSubNav`／`MatchingSearchBar`，但列表
 * 項目版型完全不同（見 `NeedListItem.tsx` 的說明），另外開元件。
 *
 * 資料來自後台「需求張貼管理」已發布的需求（`fetchDemands`），2026-10-06 從假資料改接真後端；
 * 2026-10-08 媒合對接改版（見 `docs/媒合對接業務規格-2026-10-08.md`）：列表依上架時間排序，訪客與個人會員只看得到內容前 20 字（後端截斷），
 * 「我要刊登」依身分決定狀態（`PublishNeedButton`），原本的「訂閱解方」改為「追蹤」（`FollowButton`，限需求端企業會員）；
 * 關鍵字搜尋（`?q=`）交給後端比對，分頁照抄 `/matching/enterprise` 的前端分頁做法。
 *
 * `.searchma_tching` 搜尋列放在 `topBar`，不是 `children`——對照設計稿
 * 原始 HTML，這塊跟 `.side1`／`.content`／`.side2` 是同一層的手足
 * （在側欄/內容分兩欄的 `.row` 裡自己佔滿一整行，把下面的內容/側欄
 * 擠到下一行），不是塞在 `.content` 欄位「裡面」。放進 `children`
 * 會被 `.content` 的欄寬限制住，跟旁邊 `aside`（我要刊登按鈕）擠成
 * 同一行、還會變窄到裡面的篩選按鈕擠不下換行。
 */
export default async function MatchingPage({ searchParams }: PageProps<"/matching">) {
  const sidebarBanners = await fetchBanners("sidebar-matching");
  const { page: rawPage, q: rawQuery, tags: rawTags } = await searchParams;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";
  const tagIds = parseTagIds(rawTags);
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const page = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.floor(requestedPage) : 1;

  const [taxonomy, result] = await Promise.all([
    fetchTagTaxonomy(),
    fetchDemandsPage({ page, pageSize: NEED_PAGE_SIZE, search: query, tagIds }),
  ]);
  const totalPages = Math.max(1, Math.ceil(result.totalCount / NEED_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedNeeds = result.items.map(demandToNeed);
  const hasFilter = Boolean(query) || tagIds.length > 0;

  return (
    <>
      <BodyClass className="matching index" />
      <PublishNeedModal id="staticmembership2" taxonomy={taxonomy} />

      <InnerPageShell
        title="媒合對接"
        titleAside={<MatchingSubNav activeHref="/matching" />}
        breadcrumb={[{ label: "媒合對接" }]}
        topBar={
          <div className="searchma_tching mb-5">
            <MatchingSearchBar defaultKeyword={query} taxonomy={taxonomy} selectedTagIds={tagIds} />
          </div>
        }
        aside={
          <>
            <PublishNeedButton modalId="staticmembership2" />

            <SidebarBanner banners={sidebarBanners} />
          </>
        }
        decorations={
          <>
            <div className="publish_banner mt-md-5 mt-4 mb-4">
              <a href="#" className="video-card" title="石化產業智慧轉型——從數據到決策（另開視窗）" target="_blank" rel="noopener noreferrer">
                <div className="pic">
                  <img className="img-fluid d-block" src={withBasePath("/images/banner/b1.jpg")} alt="石化產業智慧轉型——從數據到決策" />
                </div>
              </a>
            </div>

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
          {pagedNeeds.length === 0 && <p>{hasFilter ? "沒有符合的需求。" : "目前沒有刊登中的需求。"}</p>}
          {pagedNeeds.map((need) => (
            <NeedListItem key={need.id} need={need} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(page) => {
            const params = new URLSearchParams();
            if (query) params.set("q", query);
            if (tagIds.length > 0) params.set("tags", tagIds.join(","));
            if (page > 1) params.set("page", String(page));
            const qs = params.toString();
            return qs ? `/matching?${qs}` : "/matching";
          }}
        />
      </InnerPageShell>
    </>
  );
}
