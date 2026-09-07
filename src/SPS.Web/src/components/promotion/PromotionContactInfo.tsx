/**
 * 積木元件：「我要投稿」頁的聯繫人資訊，對應舊站
 * page/promotion/_uc/cont.html——跟 news 的
 * [ArticleContactInfo](../news/ArticleContactInfo.tsx) 是不同資料
 * （多一個「聯絡人」姓名欄位、信箱標籤是「投稿信箱」），沒有共用。
 * 一樣是協會固定資料，不是每篇文章各自不同，所以沒有做成 props。
 */
export default function PromotionContactInfo() {
  return (
    <div className="dow_t">
      <div className="dow-name">
        <i className="bi bi-person-vcard me-2" aria-hidden="true"></i>
        <span>聯繫人資訊</span>
      </div>

      <div className="dow_box">
        <ul className="nav d-block">
          <li>
            <span className="label">
              <i className="bi bi-person" aria-hidden="true"></i>聯絡人：
            </span>
            <p className="mb-0">王小名</p>
          </li>
          <li>
            <span className="label">
              <i className="bi bi-telephone me-1" aria-hidden="true"></i>電話：
            </span>
            <a href="tel:+886-7-550-3115" title="撥打電話至 +886-7-550-3115">
              +886-7-550-3115
            </a>
          </li>
          <li>
            <span className="label">
              <i className="bi bi-envelope me-1" aria-hidden="true"></i>投稿信箱：
            </span>
            <a href="mailto:isha_khh@mail.isha.org.tw" title="投稿寄信至 isha_khh@mail.isha.org.tw">
              isha_khh@mail.isha.org.tw
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
