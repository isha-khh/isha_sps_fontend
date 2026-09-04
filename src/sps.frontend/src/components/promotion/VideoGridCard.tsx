export interface VideoGridCardData {
  href: string;
  thumbnail: string;
  title: string;
  date: string;
  keywords?: string[];
}

/**
 * 積木元件：影音專區清單卡片，對應舊站 page/promotion/video.html 的
 * `.col-lg-4.item.item_video > .item_box`——16:9 縮圖、日期在標題上方，
 * 跟 IndustryCaseCard（4:3 縮圖、沒有日期在標題上方、多說明文字跟
 * 瀏覽數）版型不一樣，另外做一個元件。
 */
export default function VideoGridCard({ data }: { data: VideoGridCardData }) {
  return (
    <div className="col-lg-4 col-12 item item_video mb-md-4 mb-4">
      <div className="item_box">
        <a href={data.href} className="pic" title={`${data.title}（另開視窗）`} target="_blank" rel="noopener noreferrer">
          <div className="ratio ratio-16x9">
            <img className="img-fluid d-block" src={data.thumbnail} alt="" />
          </div>
        </a>

        <div className="tit mt-4">
          <a href={data.href} title={`${data.title}（另開視窗）`} target="_blank" rel="noopener noreferrer">
            <div className="tit_nsl">
              <div className="date">{data.date}</div>
              <h3>{data.title}</h3>
            </div>
          </a>

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
        </div>
      </div>
    </div>
  );
}
