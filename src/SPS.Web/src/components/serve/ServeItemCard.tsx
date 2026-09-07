import Badge from "@/components/ui/Badge";

export interface ServeItemCardData {
  href: string;
  image: string;
  category: string;
  date: string;
  title: string;
  description: string;
  keywords?: string[];
}

/**
 * 積木元件：服務專區列表的卡片，對應舊站 serve/index.html 裡的
 * `.item_box`（`col-lg-4 col-md-6 col-12` 網格排版，圖片在標題上方）。
 *
 * 跟 NewsListCard（news 列表用的橫向卡片）版面完全不同，資料形狀也
 * 有些差異（沒有活動時間/地點那組 meta），所以是獨立元件，不用一個
 * NewsListCard 硬凹兩種畫面。
 *
 * 斷點原本是 `col-lg-4 col-6`（桌機3欄、手機以下全部固定2欄，手機
 * 版會擠成兩欄小卡片）——這是之前 RWD 盤點時「舊站本身沒做手機版」
 * 的其中一項，當時結論是不用自己補。舊站 2026-09-04 更新已經補上
 * `md` 斷點、手機版改成單欄（`col-12`），這裡同步過來，那項待辦
 * 可以關掉了。
 */
export default function ServeItemCard({ data }: { data: ServeItemCardData }) {
  return (
    <div className="col-lg-4 col-md-6 col-12 item mb-md-4 mb-4">
      <div className="item_box">
        <a href={data.href} className="pic" title={data.title}>
          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src={data.image} alt="" />
          </div>
        </a>

        <div className="tit mt-4">
          <a href={data.href} title={data.title}>
            <div className="tit_nsl">
              <div className="tit_three d-flex mb-2">
                <div className="tag-wrap">
                  <Badge>{data.category}</Badge>
                </div>
                <div className="date">{data.date}</div>
              </div>

              <div className="h3_solid">
                <h3>{data.title}</h3>
              </div>

              <p>{data.description}</p>

              <ul className="nav d-block mb-3">
                <li>
                  <i className="bi bi-file-earmark-arrow-down" aria-hidden="true"></i>
                  <span>下載文件</span>
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
