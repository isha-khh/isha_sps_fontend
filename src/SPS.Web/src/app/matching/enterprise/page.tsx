import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MatchingSubNav from "@/components/matching/MatchingSubNav";
import MatchingSearchBar from "@/components/matching/MatchingSearchBar";
import EnterpriseCard from "@/components/matching/EnterpriseCard";
import Pagination from "@/components/ui/Pagination";
import { ENTERPRISE_LISTINGS } from "@/lib/matching-data";

export const metadata: Metadata = {
  title: "企業名錄",
};

const ENTERPRISE_PAGE_SIZE = 8;

/**
 * 「我要媒合」企業名錄列表，對應 2026-09-08 客戶新上傳的設計稿
 * `page/matching/enterprise.html`。目前純畫面（假資料），對接真後端
 * 是下一步——先確認畫面/互動跟設計稿一致再接資料，見
 * docs/改版規劃.md 的「企業名錄」章節。
 *
 * 跟已經串接的 News／Promotion／Serve 列表頁比，這頁少兩塊：
 * - 沒有側欄分類（`side1`）、沒有右欄廣告（`side2`）——設計稿這兩塊
 *   都是 `d-none`（`side1_serve` 的載入呼叫也直接註解掉了），不像
 *   `/serve` 那樣「保留裝飾性側欄但都連回同一頁」，這裡是真的整塊
 *   不顯示，所以 `InnerPageShell` 沒給 `sidebar`／`aside`，讓
 *   `.content` 自動撐滿（跟 `/promotion/contribute` 同樣的處理）。
 * - 搜尋列不是共用的 `SearchBar`，是這頁專屬的 `MatchingSearchBar`
 *   （關鍵字＋應用情境／應用範疇／智慧技術三個可多選的浮動篩選面板），
 *   跟其他頁面「關鍵字＋年份」的搜尋列外觀差太多，沒有勉強共用。
 *
 * 分頁目前是純前端假分頁（`ENTERPRISE_PAGE_SIZE`），`page` 這個
 * query string 現在就有讀、也有真的照筆數切頁，只是資料來源還是
 * 假資料——等接上真後端 `GET /api/Company` 之後，這段邏輯（連同
 * `/news`、`/promotion` 已經有的「換頁保留篩選條件」寫法）可以直接
 * 沿用。
 */
export default async function MatchingEnterprisePage({ searchParams }: PageProps<"/matching/enterprise">) {
  const { page: rawPage } = await searchParams;

  const totalPages = Math.max(1, Math.ceil(ENTERPRISE_LISTINGS.length / ENTERPRISE_PAGE_SIZE));
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const pagedListings = ENTERPRISE_LISTINGS.slice((currentPage - 1) * ENTERPRISE_PAGE_SIZE, currentPage * ENTERPRISE_PAGE_SIZE);

  return (
    <>
      <BodyClass className="matching enterprise" />
      <InnerPageShell
        title="企業名錄"
        titleAside={<MatchingSubNav activeHref="/matching/enterprise" />}
        breadcrumb={[{ label: "企業名錄" }]}
      >
        <div className="searchma_tching mb-md-5 mb-4">
          <MatchingSearchBar />
        </div>

        <div className="row">
          {pagedListings.length === 0 && <p>目前沒有符合的企業。</p>}

          {pagedListings.map((company) => (
            <EnterpriseCard
              key={company.id}
              data={{
                href: `/matching/enterprise/${company.id}`,
                image: company.photo || "/images/all/new_logo.jpg",
                title: company.name,
                description: company.introduction ?? "",
                keywords: company.tagNames,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={(page) => (page > 1 ? `/matching/enterprise?page=${page}` : "/matching/enterprise")} />
      </InnerPageShell>
    </>
  );
}
