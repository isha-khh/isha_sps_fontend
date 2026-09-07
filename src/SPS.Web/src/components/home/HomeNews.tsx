import SectionTitle from "@/components/ui/SectionTitle";
import Tabs from "@/components/ui/Tabs";
import MoreLink from "@/components/ui/MoreLink";
import NewsItemCard, { type NewsItemCardData } from "@/components/news/NewsItemCard";

/**
 * 首頁「最新消息」，對應舊站 page/_uc/home/home_news.html。
 *
 * 是第一個把 Tier 0～2 積木（SectionTitle、Tabs、NewsItemCard、MoreLink）
 * 組在一起的完整區塊。假資料之後會換成真的 API／CMS 資料，欄位形狀
 * 先照 NewsItemCardData 定。
 */
const ALL_NEWS: NewsItemCardData[] = [
  {
    href: "/news/1",
    day: "15",
    yearMonth: "2026.04",
    category: "公告",
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "本計畫提供最高500萬元補助，協助企業導入AIoT、5G等智慧化技術，申請截止日期為7月31日。",
  },
  {
    href: "/news/2",
    day: "15",
    yearMonth: "2026.04",
    category: "活動",
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "本計畫提供最高500萬元補助，協助企業導入AIoT、5G等智慧化技術，申請截止日期為7月31日。",
  },
  {
    href: "/news/3",
    day: "15",
    yearMonth: "2026.04",
    category: "新知",
    title: "114年度石化產業智慧化補助計畫正式開放申請",
    description: "本計畫提供最高500萬元補助，協助企業導入AIoT、5G等智慧化技術，申請截止日期為7月31日。",
  },
];

// 「外部」分類目前的假資料沒有出現在「全部」分頁裡（跟舊站的 demo 資料
// 一致），只在「外部」分頁自己顯示。
const EXTERNAL_NEWS: NewsItemCardData = {
  href: "/news/4",
  day: "15",
  yearMonth: "2026.04",
  category: "外部",
  title: "114年度石化產業智慧化補助計畫正式開放申請",
  description: "本計畫提供最高500萬元補助，協助企業導入AIoT、5G等智慧化技術，申請截止日期為7月31日。",
};

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

export default function HomeNews() {
  const byCategory = (category: string) => ALL_NEWS.filter((item) => item.category === category);

  return (
    <div className="home_news">
      <SectionTitle eyebrow="Latest news">最新消息</SectionTitle>

      <Tabs
        id="pills-tab"
        ariaLabel="最新消息分類頁籤"
        items={[
          {
            id: "pills-home01",
            label: "全部",
            content: <NewsPanel items={ALL_NEWS} moreHref="/news" moreLabel="查看更多最新消息" />,
          },
          {
            id: "pills-home02",
            label: "活動",
            content: <NewsPanel items={byCategory("活動")} moreHref="/news?category=活動" moreLabel="查看更多活動消息" />,
          },
          {
            id: "pills-home03",
            label: "新知",
            content: <NewsPanel items={byCategory("新知")} moreHref="/news?category=新知" moreLabel="查看更多新知消息" />,
          },
          {
            id: "pills-home04",
            label: "外部",
            content: <NewsPanel items={[EXTERNAL_NEWS]} moreHref="/news?category=外部" moreLabel="查看更多外部消息" />,
          },
        ]}
      />

      <div className="round_2" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_2.png" alt="" />
      </div>
    </div>
  );
}
