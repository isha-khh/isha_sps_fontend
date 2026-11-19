import Link from "next/link";

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
 *
 * 卡片等高：`.equal_card` 的樣式在 `public/css/style.css`（標籤區固定保留兩行高度、「詳細資料」按鈕貼底），
 * 同一列的卡片不論標籤幾行、簡介多長，高度與按鈕位置都一致。
 */
export default function EnterpriseCard({ data }: { data: EnterpriseCardData }) {
  return (
    <div className="col-lg-3 col-md-4 col-12 item equal_card mb-md-4 mb-4">
      <div className="item_box">
        {/* 圖片連結、「詳細資料」都跟標題連結同一目的地：不進 Tab 順序、不給輔助科技念（HM1240402E） */}
        <Link href={data.href} className="pic" tabIndex={-1} aria-hidden="true">
          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src={data.image} alt="" />
          </div>
        </Link>

        <div className="tit mt-4">
          <Link href={data.href} title={data.title}>
            <div className="tit_nsl">
              <div className="h3_solid">
                <h3>{data.title}</h3>
              </div>
              <p>{data.description}</p>
            </div>
          </Link>

          {data.keywords.length > 0 && (
            <ul className="nav ul-key">
              {data.keywords.map((keyword) => (
                <li key={keyword}>
                  <span>
                    {keyword}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link href={data.href} className="det_more" tabIndex={-1} aria-hidden="true">
            詳細資料
          </Link>
        </div>
      </div>
    </div>
  );
}
