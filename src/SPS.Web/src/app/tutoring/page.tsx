import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import TutoringItemCard from "@/components/tutoring/TutoringItemCard";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import CategoryTabList from "@/components/layout/CategoryTabList";
import { TUTORING_ITEMS, TUTORING_INDUSTRIES } from "@/lib/tutoring-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "產業輔導",
};

// 對應設計稿 page/_uc/side2_banner.html
const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: withBasePath("/images/all/new_logo.jpg"), title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 產業輔導列表，對應設計稿 page/tutoring/index.html。目前後端沒有
 * 對應的內容類型，先用 tutoring-data.ts 的假資料，分頁跟 /serve
 * 一樣先用寫死的佔位（currentPage/totalPages），之後接真後端時再
 * 照實際筆數切頁。
 */
export default async function TutoringIndexPage({ searchParams }: PageProps<"/tutoring">) {
  const { category: rawCategory } = await searchParams;
  // 對應設計稿 page/_uc/side/side1_tutoring.html——「石化業」是設計稿
  // 裡寫死 class="active" 的預設分類，沒帶 ?category= 時比照辦理。
  const activeIndustry = typeof rawCategory === "string" && TUTORING_INDUSTRIES.includes(rawCategory) ? rawCategory : TUTORING_INDUSTRIES[0];
  const filteredItems = TUTORING_ITEMS.filter((item) => item.industry === activeIndustry);

  // 對應設計稿 page/_uc/side2_industry.html——原始檔案標題寫
  // 「熱門產業案例」、連去 /promotion，明顯是共用範本複製時忘記改，
  // 這裡照這頁實際的內容類型換成「熱門輔導」，卡片版型（排名＋縮圖＋
  // 標題＋日期）沿用同一顆通用的 PopularPosts。
  const popularItems = TUTORING_ITEMS.map((item) => ({
    href: `/tutoring/${item.id}`,
    title: item.title,
    date: item.date,
    image: item.image,
  }));

  return (
    <>
      <BodyClass className="tutoring" />
      <InnerPageShell
        title="輔導"
        breadcrumb={[{ label: "產業輔導" }, { label: "輔導" }]}
        sidebar={
          <CategoryTabList
            activeHref={`/tutoring?category=${encodeURIComponent(activeIndustry)}`}
            items={TUTORING_INDUSTRIES.map((industry) => ({ label: industry, href: `/tutoring?category=${encodeURIComponent(industry)}` }))}
          />
        }
        aside={
          <>
            <PopularPosts items={popularItems} heading="熱門輔導" />
            <SidebarBanner items={SIDEBAR_BANNERS} />
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
          <SearchBar typeOptions={[]} typeLabel="產業別篩選" keywordPlaceholder="請輸入關鍵字" hiddenFields={{ category: activeIndustry }} />
        </div>

        <div className="column_box">
          {filteredItems.length === 0 && <p>目前這個分類還沒有輔導項目。</p>}
          {filteredItems.map((item) => (
            <TutoringItemCard item={item} key={item.id} />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={5} getHref={(page) => `/tutoring?category=${encodeURIComponent(activeIndustry)}&page=${page}`} />
      </InnerPageShell>
    </>
  );
}
