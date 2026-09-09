import SectionTitle from "@/components/ui/SectionTitle";
import Tabs from "@/components/ui/Tabs";
import MoreLink from "@/components/ui/MoreLink";
import NewsItemCard, { type NewsItemCardData } from "@/components/news/NewsItemCard";
import { fetchNews } from "@/lib/api.server";
import { NEWS_ARTICLES, deriveNewsCategories } from "@/lib/news-data";
import type { NewsItem } from "@/lib/types";

/**
 * 卡片左側「日 + 年.月」的圓角小方塊要拆成兩段文字，真後端沒有另外
 * 存這種格式——跟 `/news` 列表頁一樣用 `startDate` 當顯示日期（見
 * `news-data.ts` 的 `formatNewsDate`），這裡只是額外拆成 day/yearMonth
 * 兩段給 `NewsItemCard` 用。`startDate` 可能是 `null`（見
 * `news-data.ts` 開頭的說明），退回 `createdTime`（一定有值）。
 */
function toDayAndYearMonth(item: NewsItem): { day: string; yearMonth: string } {
  const iso = item.startDate ?? item.createdTime;
  const [year, month, day] = iso.slice(0, 10).split("-");
  if (!year || !month || !day) return { day: "--", yearMonth: "----.--" };
  return { day, yearMonth: `${year}.${month}` };
}

function toNewsItemCardData(item: NewsItem): NewsItemCardData {
  return {
    href: `/news/${item.id}`,
    ...toDayAndYearMonth(item),
    category: item.categoryName || "未分類",
    title: item.title,
    description: item.introduction,
  };
}

function NewsPanel({ items, moreHref, moreLabel }: { items: NewsItemCardData[]; moreHref: string; moreLabel: string }) {
  return (
    <>
      <div className="new_box">
        {items.map((item) => (
          <NewsItemCard key={item.href} data={item} />
        ))}
      </div>
      <MoreLink href={moreHref} label="查看更多" title={moreLabel} />
    </>
  );
}

/**
 * 分類頁籤：直接從 `items` 反推有哪些分類（跟 `/news` 列表頁的側欄
 * 用同一個 `deriveNewsCategories`），不用另外猜測後台實際會建哪些
 * 分類名稱。每個頁籤只挑最新 3 筆（用 `startDate` 排序，跟卡片上
 * 顯示的日期一致），「查看更多」帶的 `?category=` 是數字
 * `categoryId`，跟 `/news` 列表頁的分類篩選對得起來。
 *
 * 刻意不分「真資料版」跟「假資料版」兩套頁籤邏輯：`items` 不管是
 * 真後端回來的還是 `NEWS_ARTICLES` 假資料，跑同一段反推邏輯結果都
 * 會對得上（`NEWS_ARTICLES` 的 `categoryName` 本來就是照真後端會
 * 出現的分類取的「活動資訊／產業新知／外部消息」，見 news-data.ts）。
 * 一開始這裡另外寫了一套只在退回假資料時用的 `buildMockNewsTabs`，
 * 用的是舊版、跟真後端對不上的分類名稱（「公告／活動／新知／外部」）
 * ——後端連不到而退回假資料時，畫面就會看起來像「分類沒套用後端」，
 * 其實是兩份假資料/分類名稱各自維護、忘了同步的問題，不是真的沒接。
 */
function buildNewsTabs(items: NewsItem[]) {
  const byDateDesc = items
    .slice()
    .sort((a, b) => (a.startDate ?? a.createdTime) < (b.startDate ?? b.createdTime) ? 1 : -1);
  const categories = deriveNewsCategories(items);

  return [
    {
      id: "pills-home-all",
      label: "全部",
      content: (
        <NewsPanel
          items={byDateDesc.slice(0, 3).map(toNewsItemCardData)}
          moreHref="/news"
          moreLabel="查看更多最新消息"
        />
      ),
    },
    ...categories.map((category) => ({
      id: `pills-home-${category.id}`,
      label: category.name,
      content: (
        <NewsPanel
          items={byDateDesc
            .filter((item) => item.categoryId === category.id)
            .slice(0, 3)
            .map(toNewsItemCardData)}
          moreHref={`/news?category=${category.id}`}
          moreLabel={`查看更多${category.name}`}
        />
      ),
    })),
  ];
}

/**
 * 首頁「最新消息」，對應舊站 page/_uc/home/home_news.html。
 *
 * 對到真後端 `GET /api/News`（跟 `/news` 共用 `fetchNews`）。
 * `backendAvailable:false`（連不到後端）才退回 `NEWS_ARTICLES` 假
 * 資料（跟 `/news` 列表頁同一份、同一套退回邏輯），真後端回應但
 * 剛好 0 筆已發布公告時，「全部」頁籤照實顯示空清單（`MoreLink`
 * 還是照樣導去 `/news`），不套用假資料掩蓋。
 */
export default async function HomeNews() {
  const { items: backendItems, backendAvailable } = await fetchNews();
  const items = backendAvailable ? backendItems : NEWS_ARTICLES;
  const tabs = buildNewsTabs(items);

  return (
    <div className="home_news">
      <SectionTitle eyebrow="Latest news">最新消息</SectionTitle>

      <Tabs id="pills-tab" ariaLabel="最新消息分類頁籤" items={tabs} />

      <div className="round_2" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_2.png" alt="" />
      </div>
    </div>
  );
}
