/**
 * 文章詳情頁的「聯繫人資訊」，對應舊站 page/news/_uc/cont.html。
 *
 * 內容其實是協會的固定聯絡資訊（跟 Footer.tsx 裡的是同一組資料），
 * 不是每篇文章各自不同的欄位，所以沒有做成 props 可傳入——真的要
 * 支援「每篇文章各自的聯絡人」的話，再回頭把這裡改成資料驅動即可。
 */
export default function ArticleContactInfo() {
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
              <i className="bi bi-telephone me-1" aria-hidden="true"></i>電話：
            </span>
            <a href="tel:+886-7-550-3115" title="撥打電話至 +886-7-550-3115">
              +886-7-550-3115
            </a>
          </li>
          <li>
            <span className="label">
              <i className="bi bi-envelope me-1" aria-hidden="true"></i>信箱：
            </span>
            <a href="mailto:isha_khh@mail.isha.org.tw" title="寄信至 isha_khh@mail.isha.org.tw">
              isha_khh@mail.isha.org.tw
            </a>
          </li>
          <li>
            <span className="label">
              <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>地址：
            </span>
            <a
              href="https://maps.app.goo.gl/iZ6rqmW5CcSKJgp17"
              target="_blank"
              rel="noopener noreferrer"
              title="開啟 Google 地圖查看公司地址（另開新視窗）"
            >
              813707 高雄市左營區博愛三路12號15樓
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
