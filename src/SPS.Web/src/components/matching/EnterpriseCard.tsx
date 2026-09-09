export interface EnterpriseCardData {
  href: string;
  image: string;
  title: string;
  description: string;
  keywords: string[];
}

/**
 * 積木元件：企業名錄列表卡片，對應設計稿 `page/matching/enterprise.html`
 * 的 `.item_box`（4 欄網格：`col-lg-3 col-md-4 col-12`，比 Promotion 的
 * 3 欄再窄一格）。
 */
export default function EnterpriseCard({ data }: { data: EnterpriseCardData }) {
  return (
    <div className="col-lg-3 col-md-4 col-12 item mb-md-4 mb-4">
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
            </div>
          </a>

          {data.keywords.length > 0 && (
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

          <a href={data.href} title="詳細資料" className="det_more">
            詳細資料
          </a>
        </div>
      </div>
    </div>
  );
}
