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
import { fetchNews } from "@/lib/api.server";
import {
  NEWS_ARTICLES,
  NEWS_FALLBACK_IMAGE,
  deriveNewsCategories,
  getNewsActivityStatus,
  formatNewsDate,
  sortNewsByViewCount,
} from "@/lib/news-data";

export const metadata: Metadata = {
  title: "最新消息",
};

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 每頁顯示幾筆——後端 `NewsQueryParameters` 其實支援真的伺服器端分頁
 * （`Page`／`PageSize`），但這裡 `fetchNews()` 一次抓 100 筆是為了讓
 * `deriveNewsCategories()` 能反推出「全部分類」，不只是當頁那幾筆
 * 剛好出現的分類，所以分頁在這裡是前端這層自己切的，不是重新打
 * 一次 API。5 筆是使用者覺得每頁 10 筆太長，改小的數字，沒有設計稿或
 * 後端數字可以照抄。
 */
const NEWS_PAGE_SIZE = 5;

/**
 * 最新消息列表：InnerPageShell 提供版型、上方輪播 banner（NewsBanner）、
 * 滿版分類頁籤（CategoryTabStrip）、SearchBar 做搜尋列、NewsListCard
 * 排列表、Pagination 分頁、右側欄用 PopularPosts＋SidebarBanner。
 *
 * 對接真後端後的改動（比照 `/faq` 的做法）：
 * - 文章改叫 `fetchNews()`，後端沒資料/連不到時才退回 `NEWS_ARTICLES`
 *   假資料（見 lib/news-data.ts）。
 * - 分類頁籤的 `?category=` 現在帶的是數字 `categoryId`，不是中文字串
 *   ——真後端 `News.categoryId` 是 `Category` 表的數字主鍵。分類清單
 *   也不是另外呼叫 `/api/Category`，而是從抓回來的 `items` 反推
 *   （`deriveNewsCategories`），理由跟 FAQ 那邊一樣：這樣不管 `items`
 *   是真資料還是假資料，側欄分類永遠跟看得到的文章對得上。
 * - 卡片圖優先用真後端 `NewsListItemResponse.imageUrl`（2026-09-08
 *   已請後端補上），沒有設定圖片的公告才退回 `NEWS_FALLBACK_IMAGE`
 *   佔位（見 news-data.ts 的說明）。
 * - 「活動進行中」這種狀態標籤是前台自己用 `startDate`／`endDate`
 *   算出來的（`getNewsActivityStatus`），不是後端存的欄位，也不是每篇
 *   公告都有——沒有 `endDate` 就代表不是「活動」類公告，不顯示標籤。
 * - 標題下方的關鍵字標籤用真後端 `NewsListItemResponse.tags`（原本只有
 *   詳情 API 有，已請後端一併加進列表 API）。
 * - 搜尋列（`SearchBar`）2026-09-08 接上真的關鍵字查詢：`?q=` 對到
 *   `NewsQueryParameters.Search`（後端做 Title／Introduction 的
 *   contains 比對），交給 `fetchNews({ search })` 送出去。因為分類
 *   篩選（`?category=`）是另一個獨立的 query string 參數，`SearchBar`
 *   送出的 GET 表單會整組覆蓋網址上的 query string，所以要把目前
 *   選的分類透過 `hiddenFields` 帶進表單裡，不然一按搜尋分類篩選就
 *   被沖掉。
 * - `fetchNews()` 現在回傳 `backendAvailable`：`false` 才代表後端連不
 *   到／噴錯，這時才退回假資料；如果後端有正常回應、只是這次搜尋
 *   剛好 0 筆，要照實顯示「查無資料」，不能誤退回假資料讓使用者以為
 *   假資料就是搜尋結果（見 api.server.ts 的 `fetchNews` 註解）。
 * - 「熱門文章」側欄改用 `sortNewsByViewCount()` 照真的點閱率排序，
 *   不是隨便拿清單前 5 筆。而且刻意跟主清單的搜尋條件脫勾——搜尋
 *   關鍵字只影響中間主清單／分類頁籤，熱門文章維持顯示全站排名，
 *   不會因為使用者正在搜尋某個字就只能從搜尋結果裡選熱門文章（這
 *   本來就是搜尋功能加進來之前的行為，`categories` 反推分類清單則是
 *   刻意跟著搜尋結果縮小，兩者語意不同，不要搞混）。
 * - `Pagination` 2026-09-09 之前是完全沒接的佔位元件（`currentPage={1}
 *   totalPages={5}` 寫死，下面清單也沒有照頁碼切過，點頁碼連結沒有
 *   任何效果）——改成照 `articles` 實際筆數切頁（`NEWS_PAGE_SIZE`），
 *   換頁的連結（`getPageHref`）會保留目前的分類／搜尋條件，`page`
 *   超出範圍時夾回最後一頁而不是顯示空白。
 *
 * `CategoryTabStrip` 的 `items` 裡刻意沒有「全部」這個頁籤——客戶
 * 設計稿沒有這顆按鈕，只保留真後端目前有資料的分類。但「沒有
 * `category` 就顯示全部文章」這段邏輯（`activeCategory`／`articles`
 * 那兩行）刻意保留，沒有跟著砍掉：拿掉「全部」頁籤不代表 `/news`
 * （沒帶 `?category=`）這個網址本身不該顯示全部文章。
 *
 * ShareBox（分享按鈕）沒有出現在這裡：對照舊站，Sharebox.html 是
 * news/show.html（文章內頁）在用的，不是列表頁。
 */
export default async function NewsIndexPage({ searchParams }: PageProps<"/news">) {
  const { category: rawCategory, q: rawQuery, page: rawPage } = await searchParams;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  const { items: backendItems, backendAvailable } = await fetchNews({ search: query || undefined });
  // 只有後端真的連不到/噴錯才退回假資料——搜尋剛好 0 筆是正常結果，
  // 不能也退回假資料（見上面的說明跟 fetchNews 的註解）
  const items = backendAvailable ? backendItems : NEWS_ARTICLES;
  const categories = deriveNewsCategories(items);

  const requestedId = rawCategory ? Number(rawCategory) : NaN;
  const activeCategory = categories.find((c) => c.id === requestedId);
  const activeHref = activeCategory ? `/news?category=${activeCategory.id}` : "/news";
  const articles = activeCategory ? items.filter((item) => item.categoryId === activeCategory.id) : items;

  // 分頁：`totalPages`／`currentPage` 之前是寫死的佔位數字（`1`／`5`），
  // 不管實際文章筆數是多少都顯示同樣的「5 頁」、而且下面的清單完全
  // 沒有依頁碼切過，等於分頁器點了也沒用——這裡改成真的照 `articles`
  // 的實際筆數切頁。`page` 超出範圍（例如篩選後文章變少、原本的頁碼
  // 卡在後面）夾回最後一頁，而不是顯示空白頁。
  const totalPages = Math.max(1, Math.ceil(articles.length / NEWS_PAGE_SIZE));
  const requestedPage = typeof rawPage === "string" ? Number(rawPage) : 1;
  const currentPage = Number.isFinite(requestedPage) && requestedPage >= 1 ? Math.min(requestedPage, totalPages) : 1;
  const pagedArticles = articles.slice((currentPage - 1) * NEWS_PAGE_SIZE, currentPage * NEWS_PAGE_SIZE);
  // 換頁要保留目前的分類／搜尋條件，不然點第 2 頁篩選就被沖掉了
  // （跟 `SearchBar` 用 `hiddenFields` 保留分類是同一個理由）。
  const getPageHref = (page: number) => {
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", String(activeCategory.id));
    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/news?${qs}` : "/news";
  };

  // 熱門文章要看全站排名，不能被目前的搜尋字串限縮——有搜尋字串時
  // 才需要額外抓一次不帶搜尋條件的清單；沒有搜尋字串時 `items` 本來
  // 就是全站清單，直接重用，不用多打一次 API。
  const popularSourceResult = query ? await fetchNews() : { items: backendItems, backendAvailable };
  const popularSource = popularSourceResult.backendAvailable ? popularSourceResult.items : NEWS_ARTICLES;
  const popularPosts = sortNewsByViewCount(popularSource)
    .slice(0, 5)
    .map((item) => ({
      href: `/news/${item.id}`,
      title: item.title,
      date: formatNewsDate(item.startDate),
      image: item.imageUrl || NEWS_FALLBACK_IMAGE,
    }));

  return (
    <>
      <BodyClass className="news" />
      <InnerPageShell
        title="最新消息"
        breadcrumb={activeCategory ? [{ label: "公告事項", href: "/news" }, { label: activeCategory.name }] : [{ label: "公告事項" }]}
        banner={<NewsBanner />}
        topBar={
          <CategoryTabStrip
            activeHref={activeHref}
            items={categories.map((c) => ({ label: c.name, href: `/news?category=${c.id}` }))}
          />
        }
        aside={
          <>
            <PopularPosts items={popularPosts} />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
      >
        <div className="search mb-md-5 mb-4">
          <SearchBar
            years={[]}
            defaultKeyword={query}
            hiddenFields={activeCategory ? { category: String(activeCategory.id) } : undefined}
          />
        </div>

        <div className="column_box">
          {articles.length === 0 && (
            <p>{query ? `找不到符合「${query}」的公告。` : "目前沒有符合這個分類的消息。"}</p>
          )}

          {pagedArticles.map((article) => (
            <NewsListCard
              key={article.id}
              data={{
                href: `/news/${article.id}`,
                image: article.imageUrl || NEWS_FALLBACK_IMAGE,
                category: article.categoryName || "未分類",
                date: formatNewsDate(article.startDate),
                status: getNewsActivityStatus(article.startDate, article.endDate),
                title: article.title,
                description: article.introduction,
                keywords: article.tags,
              }}
            />
          ))}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} getHref={getPageHref} />
      </InnerPageShell>
    </>
  );
}
