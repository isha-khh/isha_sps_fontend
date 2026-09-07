import Link from "next/link";

/**
 * 過渡期元件：內容照抄舊站的 page/_uc/footer.html，樣式繼續吃舊站 CSS。
 * 沒有自己的互動邏輯——「訂閱電子報」按鈕的捲動行為是掛在 Header 上
 * （原本就是 nav.html 的 script 在控制），這裡純粹是內容。
 *
 * 「公告事項」／「產業案例」／「會員中心」／「常見問題」連到真的
 * 存在的路由，用 next/link（ESLint 的 no-html-link-for-pages 規則對
 * 已存在的路由會直接噴錯）；其餘（我要媒合、關於我們、網站導覽、
 * 功能專區）對應頁面還沒蓋出來，維持原本的 `<a href="#">`／舊站
 * 靜態頁字串，等頁面做出來再一起換。
 */
export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-top">
        <div className="d-flex">
          <div className="footer_left">
            <div className="pic">
              <img className="img-fluid d-block" src="/images/all/footer_bg2.png" alt="" />
            </div>
            <div className="tit">
              <div className="h3">訂閱電子報，掌握第一手動態</div>
              <p className="mb-0">每月為您彙整最新產業實績、技術趨勢與補助開放通知。</p>
            </div>
          </div>

          <div className="footer_right d-flex">
            <div className="form-group mb-md-0">
              <select className="form-select" aria-label="請選擇產業代碼">
                <option value="">請選擇產業代碼</option>
              </select>
            </div>

            <div className="input-group mt-2 mt-md-0">
              <input
                type="email"
                className="form-control"
                placeholder="你的電子郵件位置"
                aria-label="請輸入您的電子郵件信箱"
                autoComplete="email"
                required
              />
            </div>
            <button type="submit" className="btn_a" title="送出訂閱電子報">
              立即訂閱
            </button>
          </div>
        </div>

        <div className="footer_bg3" aria-hidden="true">
          <img className="img-fluid d-block" src="/images/all/footer_bg3.png" alt="" />
        </div>

        <div className="footer_bg4" aria-hidden="true">
          <img className="img-fluid d-block" src="/images/all/footer_bg4.png" alt="" />
        </div>
      </div>

      <div className="round_7" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_7.jpg" alt="" />
      </div>

      <div className="footer_content">
        <div className="container-fluid footer-container">
          <div className="footer-main">
            <div className="footer-col footer-brand">
              <div className="footer_log">
                <img className="img-fluid d-block" src="/images/all/logo.svg" alt="智慧工安技術 產業資訊暨媒合平台" />
              </div>
            </div>

            <div className="footer-col footer-links">
              <div className="footer-title">Links</div>
              <ul className="nav-links">
                <li>
                  <a href="/page/about/index.html" title="前往 關於我們">
                    關於我們
                  </a>
                </li>
                <li>
                  <Link href="/news" title="前往 公告事項">
                    公告事項
                  </Link>
                </li>
                <li>
                  <a href="#" title="前往 功能專區">
                    功能專區
                  </a>
                </li>
                <li>
                  <a href="#" title="前往 我要媒合">
                    我要媒合
                  </a>
                </li>
                <li>
                  <Link href="/promotion" title="前往 產業案例">
                    產業案例
                  </Link>
                </li>
                <li>
                  <Link href="/member/login" title="前往 會員中心">
                    會員中心
                  </Link>
                </li>
                <li>
                  <Link href="/faq" title="前往 常見問題">
                    常見問題
                  </Link>
                </li>
                <li>
                  <a href="#" title="前往 網站導覽">
                    網站導覽
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col footer-contact">
              <div className="footer-title">Contact Us</div>
              <ul className="contact-list">
                <li>
                  <span className="label">聯絡地址：</span>
                  <a
                    href="https://maps.app.goo.gl/iZ6rqmW5CcSKJgp17"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="開啟 Google 地圖查看公司地址（另開新視窗）"
                  >
                    813707 高雄市左營區博愛三路12號15樓
                  </a>
                </li>
                <li>
                  <span className="label">電話：</span>
                  <a href="tel:+886-7-550-3115" title="撥打電話至 +886-7-550-3115">
                    +886-7-550-3115
                  </a>
                </li>
                <li>
                  <span className="label">信箱：</span>
                  <a href="mailto:isha_khh@mail.isha.org.tw" title="寄信至 isha_khh@mail.isha.org.tw">
                    isha_khh@mail.isha.org.tw
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-mid">
            <ul className="social-list">
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" title="LINE 官方帳號(另開新視窗)">
                  <span className="bi_line" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/fot_line.svg" alt="LINE 官方帳號" />
                  </span>
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook 粉絲專頁(另開新視窗)">
                  <span className="bi_fb" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/fot_fb.svg" alt="Facebook 粉絲專頁" />
                  </span>
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram(另開新視窗)">
                  <span className="bi_ig" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/fot_ig.svg" alt="Instagram" />
                  </span>
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" title="YouTube(另開新視窗)">
                  <span className="bi_yt" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/fot_yt.svg" alt="YouTube" />
                  </span>
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Threads(另開新視窗)">
                  <span className="bi_ts" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/fot_th.svg" alt="Threads" />
                  </span>
                </a>
              </li>
              <li>
                <a href="#" target="_blank" rel="noopener noreferrer" title="Podcast(另開新視窗)">
                  <span className="bi_pod" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/fot_pod.svg" alt="Podcast" />
                  </span>
                </a>
              </li>
            </ul>

            <div className="counter-list">
              <span>
                瀏覽 <strong>10,781</strong>
              </span>
            </div>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <div className="badges-group">
              <a href="#" target="_blank" rel="noopener noreferrer" title="無障礙網頁標章2.0（另開新視窗）">
                <img className="img-fluid" src="/images/all/footer_1.jpg" alt="無障礙網頁標章2.0" />
              </a>
              <a href="https://www.ida.gov.tw/" target="_blank" rel="noopener noreferrer" title="經濟部產業發展署（另開新視窗）">
                <img className="img-fluid" src="/images/all/footer_2.svg" alt="經濟部產業發展署" />
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" title="工業安全衛生協會（另開新視窗）">
                <img className="img-fluid" src="/images/all/footer_3.svg" alt="工業安全衛生協會" />
              </a>
            </div>

            <div className="copyright-group">
              <p>為提供更為穩定的瀏覽品質與使用體驗，建議更新瀏覽器至以下版本：IE10(含)以上、最新版本Chrome、最新版本Firefox。</p>
              <p>中華民國工業安全衛生協會 著作權所有 Copyright ©ISHA. All Rights Reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
