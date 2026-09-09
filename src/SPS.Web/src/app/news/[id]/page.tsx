import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import MoreLink from "@/components/ui/MoreLink";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import { PuckRenderer } from "@/components/puck/PuckRenderer";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner from "@/components/layout/SidebarBanner";
import { fetchNews, fetchNewsDetail } from "@/lib/api.server";
import { NEWS_ARTICLES, NEWS_FALLBACK_IMAGE, getNewsArticle, formatNewsDate, sortNewsByViewCount } from "@/lib/news-data";

/**
 * 查一篇公告，後端沒有（或連不到）才退回假資料用 id 查找。
 *
 * 用 `cache()` 包起來，是因為 `generateMetadata` 跟頁面本身都要查同一
 * 筆資料——這裡走的是 axios（`apiClient`），不是 Next.js 特別處理過、
 * 同一個請求內會自動合併重複呼叫的那個全域 `fetch`，沒有 `cache()`
 * 包一層的話，一次頁面請求會變成打兩次後端 API。
 *
 * 之前（純假資料階段）這裡是用 `generateStaticParams` 在 build time
 * 窮舉所有合法 id、`dynamicParams = false` 讓其他 id 直接 404——真的
 * 接上後端後不能再這樣做：後端資料是動態的（目前有 98 筆，會持續
 * 增減），build time 窮舉的名單很快就跟資料庫對不上，會把後端新增的
 * 公告誤判成不存在。改成每次請求時真的查一次，查無資料才是真的 404。
 */
const getArticle = cache(async (id: string) => {
  const backendArticle = await fetchNewsDetail(id);
  if (backendArticle) return backendArticle;
  return getNewsArticle(id) ?? null;
});

export async function generateMetadata({ params }: PageProps<"/news/[id]">): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  // 查無這篇文章時，分頁標題也要跟著換成「找不到頁面」，不然瀏覽器
  // 分頁會顯示「最新消息」，但畫面其實已經是 not-found.tsx 那頁了。
  return { title: article?.title ?? "找不到頁面" };
}

/**
 * 新聞詳情頁，對應舊站 news/show.html。跟 `/news` 列表頁不同：
 * - 沒有跑馬燈標題（InnerPageShell 的 `title` 不給）
 * - 沒有左側分類選單（`sidebar` 不給，CategorySidebar 自動整塊隱藏）
 * - ShareBox 在這裡才真正接上，列表頁沒有分享按鈕
 * - 封面圖用 ZoomableImage，點了可以放大看（舊站的靜態切版沒有這個
 *   互動，是趁 fancybox 燈箱通用化時順手加的小加值，不是單純遷移）
 *
 * 內文改用 `PuckRenderer` 顯示真後端的 `content`（Puck 區塊 JSON，
 * 跟 FAQ 的 `Question.answer` 同一套格式），不再用原本
 * `EditableArticleBody` 那個 localStorage 存檔的 demo 編輯功能——
 * 真後端的 `News` entity 沒有「撰稿人／附件下載／相關連結」這幾個
 * 欄位（只有 Title/Introduction/Content/StartDate/EndDate/Category/
 * Tags/Picture），這幾塊照舊留著也接不到真資料，拿掉。封面圖用
 * `article.imageUrl`（2026-09-08 已請後端補上），沒設定圖片的公告
 * 才退回 `NEWS_FALLBACK_IMAGE` 佔位。
 *
 * 舊站這裡原本還有一段 TweenLite 視差滾動（讓 s_round_6／s_round_3
 * 兩張裝飾圖跟著捲動微微位移），跟首頁那幾個 round_* 裝飾圖是同一套
 * 效果，先跳過沒做，之後要做就是同一套邏輯，兩邊一起補。
 */
export default async function NewsShowPage({ params }: PageProps<"/news/[id]">) {
  const { id } = await params;
  const article = await getArticle(id);

  if (!article) {
    notFound();
  }

  const { items: backendItems, backendAvailable } = await fetchNews();
  const popularSource = backendAvailable ? backendItems : NEWS_ARTICLES;
  // 熱門文章照真的點閱率排序，不是隨便拿前 5 筆，見 news/page.tsx 的說明
  const popularPosts = sortNewsByViewCount(popularSource)
    .slice(0, 5)
    .map((item) => ({
    href: `/news/${item.id}`,
    title: item.title,
    date: formatNewsDate(item.startDate),
    image: item.imageUrl || NEWS_FALLBACK_IMAGE,
  }));

  const sidebarBanners = [
    { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
    { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
  ];

  return (
    <>
      <BodyClass className="news show" />
      <InnerPageShell
        breadcrumb={[
          { label: "公告事項", href: "/news" },
          { label: article.categoryName || "未分類", href: `/news?category=${article.categoryId}` },
          { label: article.title },
        ]}
        aside={
          <>
            <PopularPosts items={popularPosts} />
            <SidebarBanner items={sidebarBanners} />
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
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{article.title}</h3>

              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">
                    <Badge>{article.categoryName || "未分類"}</Badge>
                  </div>
                  <div className="part-line"></div>
                  <div className="date">{formatNewsDate(article.startDate)}</div>
                </div>

                <ShareBox />
              </div>
            </div>

            {article.tags && article.tags.length > 0 && (
              <ul className="nav ul-key">
                {article.tags.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ZoomableImage src={article.imageUrl || NEWS_FALLBACK_IMAGE} alt={article.title} caption={article.title} />

          <PuckRenderer content={article.content} />

          <MoreLink href="/news" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
