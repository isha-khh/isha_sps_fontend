/**
 * 積木元件：「我要投稿」頁的聯繫人資訊，對應舊站
 * page/promotion/_uc/cont.html——跟 news 的
 * [ArticleContactInfo](../news/ArticleContactInfo.tsx) 是不同資料
 * （多一個「聯絡人」姓名欄位、信箱標籤是「投稿信箱」），沒有共用。
 * 一樣是協會固定資料，不是每篇文章各自不同。
 *
 * 2026-10-05：聯絡人／電話／信箱原本寫死（聯絡人還是示範用的「王小名」），改成吃後台
 * 「頁面設定 → 我要投稿」的設定；空的欄位整列不顯示。
 */
export default function PromotionContactInfo({
  name,
  phone,
  email,
}: {
  name: string;
  phone: string;
  email: string;
}) {
  const phoneDial = phone ? phone.split("#")[0].replace(/[^0-9+]/g, "") : "";
  if (!name && !phone && !email) return null;

  return (
    <div className="dow_t">
      <div className="dow-name">
        <i className="bi bi-person-vcard me-2" aria-hidden="true"></i>
        <span>聯絡資訊</span>
      </div>

      <div className="dow_box">
        <ul className="nav d-block">
          {name && (
            <li>
              <span className="label">
                <i className="bi bi-person" aria-hidden="true"></i>聯絡人：
              </span>
              <p className="mb-0">{name}</p>
            </li>
          )}
          {phone && (
            <li>
              <span className="label">
                <i className="bi bi-telephone me-1" aria-hidden="true"></i>電話：
              </span>
              <a href={`tel:${phoneDial}`} title={`撥打電話至 ${phone}`}>
                {phone}
              </a>
            </li>
          )}
          {email && (
            <li>
              <span className="label">
                <i className="bi bi-envelope me-1" aria-hidden="true"></i>投稿信箱：
              </span>
              <a href={`mailto:${email}`} title={`投稿寄信至 ${email}`}>
                {email}
              </a>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
