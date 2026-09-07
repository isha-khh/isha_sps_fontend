import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
import ServeSubNav from "@/components/serve/ServeSubNav";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import ServeItemCard from "@/components/serve/ServeItemCard";
import { SERVE_ITEMS, getServeSiblingCategories } from "@/lib/serve-data";

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
 * 服務專區的分類其實是兩層，之前誤把它做成單層（用側欄切四個分組），
 * 使用者拿舊站截圖對過才發現的——完整說明見 [serve-data.ts](../../lib/serve-data.ts)
 * 開頭的註解：
 *
 * 1. `?category=` 帶的是「葉節點」名稱（例如「技術文件」），不是分組
 *    名稱（技術工具）——分組本身在 Headers.tsx 裡是 disabled、點不了的
 *    純分組標籤。有帶分類時，標題／麵包屑改成該葉節點名稱（對照舊站
 *    `page/serve/index.html` 的 marquee 標題就是「技術文件」，不是
 *    「服務專區」），並顯示 `titleAside`（`ServeSubNav`，對應舊站
 *    `.s_meu_lk`）讓使用者在同一組的兄弟節點間切換（產業AI／技術文件）。
 *    沒帶分類（`/serve` 本身）維持「服務專區」總覽，不顯示 titleAside。
 * 2. 側欄 `CategoryTabList` 對應舊站 `side1_serve.html`（`.wid-cont`）
 *    的「全部／分類1／分類2」——這層在舊站原始碼裡三個連結全部指回
 *    同一個 `index.html`，是純裝飾、不是真的篩選，這裡照舊站原樣呈現
 *    （不自己編一套真的篩選邏輯），所以每個連結都連回目前這個網址，
 *    「全部」固定顯示 active。
 */
export default async function ServeIndexPage({ searchParams }: PageProps<"/serve">) {
  const { category: rawCategory } = await searchParams;
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  const siblingCategories = category ? getServeSiblingCategories(category) : undefined;
  const items = category ? SERVE_ITEMS.filter((item) => item.category === category) : SERVE_ITEMS;
  const currentHref = category ? `/serve?category=${category}` : "/serve";

  return (
    <>
      <BodyClass className="serve" />
      <InnerPageShell
        title={category ?? "服務專區"}
        titleAside={siblingCategories && siblingCategories.length > 1 ? <ServeSubNav categories={siblingCategories} activeCategory={category!} /> : undefined}
        breadcrumb={category ? [{ label: "服務專區", href: "/serve" }, { label: category }] : [{ label: "服務專區" }]}
        sidebar={
          // 「全部／分類1／分類2」是舊站原樣的裝飾性連結，三個連結在
          // 舊站原始碼裡都指回同一個網址，不是真的篩選（見上面說明）。
          // 分類1／分類2 故意接一個不會被用到的錨點後綴，讓它們的 href
          // 跟「全部」不同——不然三個都等於 activeHref，會變成三個同時
          // 顯示 active，跟舊站「只有全部是 active」的樣子對不上。
          <CategoryTabList
            activeHref={currentHref}
            items={[
              { label: "全部", href: currentHref },
              { label: "分類1", href: `${currentHref}#分類1` },
              { label: "分類2", href: `${currentHref}#分類2` },
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
