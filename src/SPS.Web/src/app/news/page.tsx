import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabStrip from "@/components/news/CategoryTabStrip";
import NewsBanner from "@/components/news/NewsBanner";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import SearchBar from "@/components/ui/SearchBar";
import Pagination from "@/components/ui/Pagination";
import NewsListCard from "@/components/news/NewsListCard";
import { NEWS_ARTICLES } from "@/lib/news-data";

export const metadata: Metadata = {
  title: "最新消息",
};

const POPULAR_POSTS = NEWS_ARTICLES.map((article) => ({
  href: `/news/${article.id}`,
  title: article.title,
  date: article.date,
  image: article.image,
}));

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 最新消息列表：InnerPageShell 提供版型、上方輪播 banner（NewsBanner）、
 * 滿版分類頁籤（CategoryTabStrip）、SearchBar 做搜尋列、NewsListCard
 * 排列表、Pagination 分頁、右側欄用 PopularPosts＋SidebarBanner。
 *
 * 客戶後來要求公告事項改版：分類選單從原本側欄的圓角膠囊按鈕
 * （`CategoryTabList`，`/serve` 還在用這個樣式）換成滿版的方框頁籤
 * （`CategoryTabStrip`），版面也跟著從「側欄+內容+右欄」三欄變成
 * 「內容+右欄」兩欄——分類頁籤改放進 `InnerPageShell` 的 `topBar`
 * 插槽，橫跨整個內容寬度，不再佔用一欄。另外補了最上面那條輪播
 * banner（`NewsBanner`，對應舊站 page/_uc/banner.html，`/serve` 沒有
 * 這塊，不用一起加）。
 *
 * `?category=` 這個 query string 是真的會篩選文章、也會反映在頁籤
 * active 狀態上的——之前這裡雖然畫了分類按鈕，但頁面沒有讀
 * `searchParams`，點了只是換網址、畫面完全沒變化，是一個沒接起來的
 * 假動作，之前已經補上，這次改版沿用同一套邏輯。
 *
 * `CategoryTabStrip` 的 `items` 裡刻意沒有「全部」這個頁籤——客戶
 * 設計稿沒有這顆按鈕，只保留「活動資訊／產業新知／外部消息」三個。
 * 但下面「沒有 `category` 就顯示全部文章」這段邏輯（`activeHref`／
 * `articles` 那兩行三元運算式）刻意保留，沒有跟著砍掉：一來拿掉
 * 「全部」頁籤不代表 `/news`（沒帶 `?category=`）這個網址本身不該
 * 顯示全部文章，二來怕客戶之後改主意要把「全部」按鈕加回來，到時候
 * 只要在 `items` 陣列補一行 `{ label: "全部", href: "/news" }` 就好，
 * 不用重新兜篩選邏輯。
 *
 * 文章資料（含這裡用不到的內文/附件等欄位）統一從 `@/lib/news-data`
 * 讀，`/news/[id]` 詳情頁也是讀同一份，不要各自维护一份假資料。
 *
 * ShareBox（分享按鈕）沒有出現在這裡：對照舊站，Sharebox.html 是
 * news/show.html（文章內頁）在用的，不是列表頁。
 */
export default async function NewsIndexPage({ searchParams }: PageProps<"/news">) {
  const { category: rawCategory } = await searchParams;
  const category = typeof rawCategory === "string" ? rawCategory : undefined;
  const activeHref = category ? `/news?category=${category}` : "/news";
  const articles = category ? NEWS_ARTICLES.filter((article) => article.category === category) : NEWS_ARTICLES;

  return (
    <>
      <BodyClass className="news" />
      <InnerPageShell
        title="最新消息"
        breadcrumb={category ? [{ label: "公告事項", href: "/news" }, { label: category }] : [{ label: "公告事項" }]}
        banner={<NewsBanner />}
        topBar={
          <CategoryTabStrip
            activeHref={activeHref}
            items={[
              { label: "活動資訊", href: "/news?category=活動資訊" },
              { label: "產業新知", href: "/news?category=產業新知" },
              { label: "外部消息", href: "/news?category=外部消息" },
            ]}
          />
        }
        aside={
          <>
            <PopularPosts items={POPULAR_POSTS} moreHref="/news" />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
      >
        <div className="search mb-md-5 mb-4">
          <SearchBar years={[]} />
        </div>

        <div className="column_box">
          {articles.length === 0 && <p>目前沒有符合這個分類的消息。</p>}

          {articles.map((article) => (
            <NewsListCard
              key={article.id}
              data={{
                href: `/news/${article.id}`,
                image: article.image,
                category: article.category,
                date: article.date,
                status: article.status,
                title: article.title,
                description: article.description,
                meta: article.meta,
                keywords: article.keywords,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={5} getHref={(page) => `/news?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
