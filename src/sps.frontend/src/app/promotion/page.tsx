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
import { INDUSTRY_CASES } from "@/lib/promotion-data";

export const metadata: Metadata = {
  title: "產業案例",
};

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 推廣專區「產業案例」列表，對應舊站 page/promotion/index.html。
 *
 * 跟 news/serve 結構很像（三欄：分類側欄 + 內容 + 熱門/廣告右欄），
 * 差異在標題旁邊多一組 `PromotionSubNav`（產業案例／影音專區／
 * 我要投稿 三個子頁面互相切換），對應舊站的 `.s_meu_lk`。
 *
 * 分類（`?category=`）目前是「全部／分類1／分類2」——舊站
 * side1_industry.html 本來就寫死這幾個字當預留分類名稱，不是我們
 * 遷移時漏填，所以照抄，之後客戶確定分類名稱再換掉字串即可，篩選
 * 邏輯不用動。
 */
export default async function PromotionIndexPage({ searchParams }: PageProps<"/promotion">) {
  const { category: rawCategory } = await searchParams;
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  const activeHref = category ? `/promotion?category=${category}` : "/promotion";
  const cases = category ? INDUSTRY_CASES.filter((item) => item.category === category) : INDUSTRY_CASES;

  return (
    <>
      <BodyClass className="serve promotion" />
      <InnerPageShell
        title="產業案例"
        titleAside={<PromotionSubNav activeHref="/promotion" />}
        breadcrumb={category ? [{ label: "推廣專區" }, { label: "產業案例", href: "/promotion" }, { label: category }] : [{ label: "推廣專區" }, { label: "產業案例" }]}
        sidebar={
          <CategoryTabList
            activeHref={activeHref}
            items={[
              { label: "全部", href: "/promotion" },
              { label: "分類1", href: "/promotion?category=分類1" },
              { label: "分類2", href: "/promotion?category=分類2" },
            ]}
          />
        }
        aside={
          <>
            <PopularPosts
              items={INDUSTRY_CASES.map((item) => ({ href: `/promotion/${item.id}`, title: item.title, date: item.date, image: item.image }))}
              moreHref="/promotion"
              heading="熱門產業案例"
              moreLabel="查看更多產業案例"
            />
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
          <SearchBar />
        </div>

        <div className="row">
          {cases.length === 0 && <p>目前這個分類還沒有產業案例。</p>}
          {cases.map((item) => (
            <IndustryCaseCard
              key={item.id}
              data={{
                href: `/promotion/${item.id}`,
                image: item.image,
                title: item.title,
                description: item.description,
                date: item.date,
                views: item.views,
                keywords: item.keywords,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={1} getHref={(page) => `/promotion?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
