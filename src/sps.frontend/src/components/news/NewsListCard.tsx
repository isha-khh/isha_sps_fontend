import Badge from "@/components/ui/Badge";

export interface NewsListCardMeta {
  icon: "calendar" | "geo";
  text: string;
}

export interface NewsListCardData {
  href: string;
  image: string;
  category: string;
  date: string;
  /** 例如「活動進行中」，沒有就不顯示那顆時間狀態小標籤 */
  status?: string;
  title: string;
  description: string;
  /** 活動時間／地點這類條列資訊，沒有就不顯示 */
  meta?: NewsListCardMeta[];
}

const META_ICON_CLASS: Record<NewsListCardMeta["icon"], string> = {
  calendar: "bi bi-calendar4-week me-2",
  geo: "bi bi-geo-alt me-1",
};

/**
 * 積木元件：新聞列表頁（page/news）用的卡片，對應舊站 news/index.html
 * 裡的 `.item`（縮圖 + 標籤/日期/狀態 + 標題 + 說明 + 活動資訊條列）。
 */
export default function NewsListCard({ data }: { data: NewsListCardData }) {
  return (
    <div className="item">
      <div className="d-flex">
        <a href={data.href} className="pic" title={data.title}>
          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src={data.image} alt="" />
          </div>
        </a>

        <div className="tit">
          <a href={data.href} title={data.title}>
            <div className="tit_nsl">
              <div className="tit_three d-flex mb-2">
                <div className="tag-wrap">
                  <Badge>{data.category}</Badge>
                </div>
                <div className="date">{data.date}</div>
                {data.status && (
                  <div className="time">
                    <i className="bi bi-clock me-1" aria-hidden="true"></i>
                    <span>{data.status}</span>
                  </div>
                )}
              </div>

              <div className="h3_solid">
                <h3>{data.title}</h3>
              </div>

              <p>{data.description}</p>

              {data.meta && data.meta.length > 0 && (
                <ul className="nav d-block mb-4">
                  {data.meta.map((item, index) => (
                    <li className={index === 0 ? "mb-2" : undefined} key={`${item.icon}-${index}`}>
                      <i className={META_ICON_CLASS[item.icon]} aria-hidden="true"></i>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
