export interface FeaturedVideoData {
  href: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  keywords?: string[];
}

/**
 * 積木元件：影音專區最上方的「精選影音」，對應舊站
 * page/promotion/video.html 的 `.sele_video`（跑馬燈標題跟麵包屑
 * 中間那塊滿版大卡片，只有一則，不是清單）。
 */
export default function FeaturedVideoCard({ data }: { data: FeaturedVideoData }) {
  return (
    <div className="sele_video">
      <div className="video-card">
        <a href={data.href} className="pic" title={`${data.title}（另開新視窗）`} target="_blank" rel="noopener noreferrer">
          <div className="ratio ratio-16x9">
            <img className="img-fluid d-block" src={data.thumbnail} alt={`${data.title} 影片封面`} />
          </div>
        </a>

        <div className="tit">
          <a href={data.href} title={`${data.title}（另開新視窗）`} target="_blank" rel="noopener noreferrer">
            <div className="tit_three d-flex mb-2">
              <div className="tag-wrap">
                <span className="badge-tag mb-0">精選影音</span>
              </div>
              <div className="date">{data.date}</div>
            </div>
            <h3>{data.title}</h3>
            <p>{data.description}</p>
          </a>

          <div className="vdo_Watch d-flex">
            {data.keywords && data.keywords.length > 0 && (
              <ul className="nav ul-key">
                {data.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <a href={data.href} title="立即觀看（另開新視窗）" className="more_x" target="_blank" rel="noopener noreferrer">
              <span>立即觀看</span>
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
