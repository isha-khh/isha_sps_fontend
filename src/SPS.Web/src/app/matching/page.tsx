import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MatchingSubNav from "@/components/matching/MatchingSubNav";
import MatchingSearchBar from "@/components/matching/MatchingSearchBar";
import NeedListItem from "@/components/matching/NeedListItem";
import PublishNeedModal from "@/components/matching/PublishNeedModal";
import SubscribeSolutionModal from "@/components/matching/SubscribeSolutionModal";
import Pagination from "@/components/ui/Pagination";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import { MATCHING_NEEDS } from "@/lib/matching-need-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "媒合對接",
};

const NEED_PAGE_SIZE = 8;

// 說明見 talent/page.tsx 同一份假資料的註解
const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 「媒合對接」需求列表，對應設計稿 `page/matching/index.html`。跟已經
 * 做好的企業名錄列表（`/matching/enterprise`）是同一個模組底下的另一
 * 個子頁面，共用同一顆 `MatchingSubNav`／`MatchingSearchBar`，但列表
 * 項目版型完全不同（見 `NeedListItem.tsx` 的說明），另外開元件。
 *
 * 目前純畫面（假資料），分頁邏輯照抄 `/matching/enterprise` 的純前端
 * 假分頁做法，等接上真後端再一起處理。
 *
 * `.searchma_tching` 搜尋列放在 `topBar`，不是 `children`——對照設計稿
 * 原始 HTML，這塊跟 `.side1`／`.content`／`.side2` 是同一層的手足
 * （在側欄/內容分兩欄的 `.row` 裡自己佔滿一整行，把下面的內容/側欄
 * 擠到下一行），不是塞在 `.content` 欄位「裡面」。放進 `children`
 * 會被 `.content` 的欄寬限制住，跟旁邊 `aside`（我要刊登按鈕）擠成
 * 同一行、還會變窄到裡面的篩選按鈕擠不下換行。
 */
export default async function MatchingPage({ searchParams }: PageProps<"/matching">) {
  const { page: rawPage } = await searchParams;

  const totalPages = Math.max(1, Math.ceil(MATCHING_NEEDS.length / NEED_PAGE_SIZE));
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const pagedNeeds = MATCHING_NEEDS.slice((currentPage - 1) * NEED_PAGE_SIZE, currentPage * NEED_PAGE_SIZE);

  return (
    <>
      <BodyClass className="matching index" />
      <PublishNeedModal id="staticmembership2" />
      <SubscribeSolutionModal id="staticmembership" />

      <InnerPageShell
        title="媒合對接"
        titleAside={<MatchingSubNav activeHref="/matching" />}
        breadcrumb={[{ label: "媒合對接" }]}
        topBar={
          <div className="searchma_tching mb-5">
            <MatchingSearchBar />
          </div>
        }
        aside={
          <>
            <a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#staticmembership2" className="me_Publish more_x">
              <span>我要刊登</span>
              <i className="bi bi-pencil-square" aria-hidden="true" />
            </a>

            <SidebarBanner items={SIDEBAR_BANNERS} />
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
          {pagedNeeds.length === 0 && <p>目前沒有符合的需求。</p>}
          {pagedNeeds.map((need) => (
            <NeedListItem key={need.id} need={need} />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(page) => (page > 1 ? `/matching?page=${page}` : "/matching")} />
      </InnerPageShell>
    </>
  );
}
