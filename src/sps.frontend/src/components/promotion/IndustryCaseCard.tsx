export interface IndustryCaseCardData {
  href: string;
  image: string;
  title: string;
  description: string;
  date: string;
  views: number;
  keywords?: string[];
}

/**
 * 積木元件：推廣專區「產業案例」列表的卡片，對應舊站
 * page/promotion/index.html 的 `.col-lg-4.item > .item_box`——三欄
 * 直式卡片（圖在上、文字在下），跟 news/serve 那種「圖左文右」橫式
 * 卡片（NewsListCard）版型不一樣，另外做一個元件。
 */
export default function IndustryCaseCard({ data }: { data: IndustryCaseCardData }) {
  return (
    <div className="col-lg-4 col-12 item mb-md-4 mb-4">
      <div className="item_box">
        <a href={data.href} className="pic" title={data.title}>
          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src={data.image} alt="" />
          </div>
        </a>

        <div className="tit mt-4">
          <a href={data.href} title={data.title}>
            <div className="tit_nsl">
              <div className="h3_solid">
                <h3>{data.title}</h3>
              </div>
              <p>{data.description}</p>
              <ul className="nav mb-4">
                <li>
                  <i className="bi bi-calendar4-week me-2" aria-hidden="true"></i>
                  <span>{data.date}</span>
                </li>
                <li>
                  <i className="bi bi-eye me-1" aria-hidden="true"></i>
                  <span>{data.views}</span>
                </li>
              </ul>
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
