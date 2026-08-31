import Badge from "@/components/ui/Badge";

export interface NewsItemCardData {
  href: string;
  day: string;
  yearMonth: string;
  category: string;
  title: string;
  description: string;
}

/**
 * 積木元件：首頁「最新消息」卡片，對應舊站 `.news-item`
 * （page/_uc/home/home_news.html）。日期用「日 + 年.月」的圓角小方塊。
 *
 * 跟 NewsListCard（news 列表頁用的樣式）是不同版面，資料形狀類似但
 * 刻意分開成兩個元件，不用一個 prop 硬凹兩種畫面。
 */
export default function NewsItemCard({ data }: { data: NewsItemCardData }) {
  return (
    <a href={data.href} className="news-item" title={`前往閱讀：${data.title}`}>
      <div className="news-date">
        <span className="day">{data.day}</span>
        <span className="year-month">{data.yearMonth}</span>
      </div>

      <div className="news-content">
        <div className="tag-wrap">
          <Badge>{data.category}</Badge>
        </div>
        <h3 className="title">{data.title}</h3>
        <p className="desc">{data.description}</p>
      </div>

      <div className="news-arrow" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/arrow.svg" alt="" />
      </div>
    </a>
  );
}
