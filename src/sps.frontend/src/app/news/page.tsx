import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CategoryTabList from "@/components/layout/CategoryTabList";
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
 * 最新消息列表：InnerPageShell 提供版型、CategoryTabList 當左側分類、
 * SearchBar 做搜尋列、NewsListCard 排列表、Pagination 分頁、右側欄用
 * PopularPosts＋SidebarBanner。
 *
 * `?category=` 這個 query string 是真的會篩選文章、也會反映在側欄
 * active 狀態上的——之前這裡雖然畫了分類按鈕，但頁面沒有讀
 * `searchParams`，點了只是換網址、畫面完全沒變化，是一個沒接起來的
 * 假動作，這次一起補上。
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
        sidebar={
          <CategoryTabList
            activeHref={activeHref}
            items={[
              { label: "全部", href: "/news" },
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
              }}
            />
          ))}
        </div>

        <Pagination currentPage={1} totalPages={5} getHref={(page) => `/news?page=${page}`} />
      </InnerPageShell>
    </>
  );
}
