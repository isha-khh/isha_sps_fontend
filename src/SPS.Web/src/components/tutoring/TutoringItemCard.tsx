import type { TutoringItem } from "@/lib/tutoring-data";
import Link from "next/link";

/**
 * 積木元件：產業輔導列表卡片，對應設計稿 page/tutoring/index.html 的
 * `.item`——圖左文右橫式卡片，跟 NewsListCard 版型類似，但 meta 欄位
 * 是「適用對象／輔助單位／聯絡窗口」，底下是「了解詳情」按鈕（簡章等附件在詳情頁內文的下載區塊），
 * 資料形狀不一樣所以獨立元件。後台沒填的欄位整列不顯示。
 */
export default function TutoringItemCard({ item }: { item: TutoringItem }) {
  const href = `/tutoring/${item.id}`;

  return (
    <div className="item">
      <div className="d-flex">
        {item.image && (
          <Link href={href} className="pic" title={item.title}>
            <div className="ratio ratio-4x3">
              <img className="img-fluid d-block" src={item.image} alt={item.title} />
            </div>
          </Link>
        )}

        <div className="tit">
          <div>
            <div className="tit_nsl">
              <ul className="nav ul-key">
                {item.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="h3_solid">
                <h3>
                  <Link href={href} title={item.title}>
                    {item.title}
                  </Link>
                </h3>
              </div>
              <p>{item.description}</p>
              <ul className="nav d-block mb-4">
                {item.applicant && (
                  <li className="mb-2">
                    <i className="bi bi-person" />
                    <span>
                      <b>適用對象 : </b>
                      {item.applicant}
                    </span>
                  </li>
                )}
                {item.organizer && (
                  <li className="mb-2">
                    <i className="bi bi-briefcase" />
                    <span>
                      <b>輔助單位 : </b>
                      {item.organizer}
                    </span>
                  </li>
                )}
                {item.contactPhone && (
                  <li className="mb-2">
                    <i className="bi bi-headset" />
                    <span>
                      <b>聯絡窗口 : </b>
                      <a href={`tel:${item.contactPhone}`} title={`撥打電話至 ${item.contactPhone}`} className="d-inline-block">
                        {item.contactPhone}
                      </a>
                    </span>
                  </li>
                )}
              </ul>

              <Link href={href} title={`了解詳情：${item.title}`} className="more_x more_x_gu">
                <span>了解詳情</span>
                <i className="bi bi-arrow-right" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
