import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import ServeItemCard from "@/components/serve/ServeItemCard";
import { SERVE_ITEMS } from "@/lib/serve-data";

export const metadata: Metadata = {
  title: "服務專區",
};

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 服務專區列表，對應舊站 serve/index.html。跟 `/news` 同一套組裝方式，
 * 差別在卡片版面（ServeItemCard 是網格排版，不是橫向卡片）、搜尋列
 * 用沒有年份下拉的 search2 變體、右側欄沒有熱門文章（舊站這裡沒載
 * side2_new，只有 side2_banner）。
 *
 * `?category=` 會真的篩選項目、也會反映在側欄 active 狀態上（跟
 * `/news` 是同一套修法：之前只換網址、畫面沒反應，這次一起接上
 * `searchParams`）。
 *
 * 舊站這頁的跑馬燈標題旁邊還有一組「產業AI／技術文件」子分類切換
 * （`.s_meu_lk`，InnerPageShell 的 `titleAside` 插槽就是為了這個加的），
 * 但那是「已經點進某個技術工具子分類」時才出現的狀態，這裡是分類
 * 總覽頁，先不顯示；等真的要做子分類頁時再用上這個插槽。
 */
export default async function ServeIndexPage({ searchParams }: PageProps<"/serve">) {
  const { category: rawCategory } = await searchParams;
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  const activeHref = category ? `/serve?category=${category}` : "/serve";
  const items = category ? SERVE_ITEMS.filter((item) => item.category === category) : SERVE_ITEMS;

  return (
    <>
      <BodyClass className="serve" />
      <InnerPageShell
        title="服務專區"
        breadcrumb={category ? [{ label: "服務專區", href: "/serve" }, { label: category }] : [{ label: "服務專區" }]}
        sidebar={
          <CategoryTabList
            activeHref={activeHref}
            items={[
              { label: "全部", href: "/serve" },
              { label: "技術工具", href: "/serve?category=技術工具" },
              { label: "人才培育", href: "/serve?category=人才培育" },
              { label: "產業輔導", href: "/serve?category=產業輔導" },
              { label: "輔助資源", href: "/serve?category=輔助資源" },
            ]}
          />
        }
        aside={<SidebarBanner items={SIDEBAR_BANNERS} />}
      >
        <div className="search2 mb-md-5 mb-4">
          <SearchBar keywordPlaceholder="請輸入關鍵字" />
        </div>

        <div className="row">
          {items.length === 0 && <p>目前沒有符合這個分類的項目。</p>}

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
              }}
            />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={5} getHref={(page) => `/serve?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
