import Link from "next/link";
import { withBasePath } from "@/lib/api-client";
import { fetchFooterLinks, fetchSiteVisitorCount } from "@/lib/api.server";

/**
 * 外部網址只放行 http／https。後端已經驗證過一次，這裡再擋一次：就算資料庫裡被塞進
 * `javascript:` 之類的值，也不會變成出現在每一頁的可點連結。
 */
function safeExternalUrl(url: string): string | undefined {
  return /^https?:\/\//i.test(url.trim()) ? url.trim() : undefined;
}

/**
 * 過渡期元件：內容照抄舊站的 page/_uc/footer.html，樣式繼續吃舊站 CSS。
 * 沒有自己的互動邏輯——「訂閱電子報」按鈕的捲動行為是掛在 Header 上
 * （原本就是 nav.html 的 script 在控制），這裡純粹是內容。
 *
 * 「公告事項」／「產業案例」／「會員中心」／「常見問題」／「關於
 * 我們」／「網站導覽」／「我要媒合」連到真的存在的路由，用 next/link
 * （ESLint 的 no-html-link-for-pages 規則對已存在的路由會直接噴錯）；
 * 2026-10-03：「功能專區」、社群（LINE／Facebook／Instagram／YouTube／Threads／Podcast）、
 * 頁尾標章的連結原本全是設計稿遺留的 `href="#"`（點了只會回到頁首）。改成吃後台「內容管理 → 頁尾連結」
 * 的設定（`fetchFooterLinks`，快取 5 分鐘）：**沒設定網址的項目整個不顯示**，不再出現假連結；
 * 標章圖片固定，只有點擊後的連結可設定，沒設連結就只顯示圖片。
 */
export default async function Footer() {
  const [links, visitorCount] = await Promise.all([fetchFooterLinks(), fetchSiteVisitorCount()]);

  const address = links.contactAddress.trim();
  const mapUrl = safeExternalUrl(links.contactMapUrl);
  const phone = links.contactPhone.trim();
  // tel: 只留數字與開頭的 +；「#」之後是分機，不能接在號碼後面一起撥（會變成另一支號碼），所以先截掉
  const phoneHref = phone ? `tel:${phone.split("#")[0].replace(/[^0-9+]/g, "")}` : undefined;
  const email = links.contactEmail.trim();

  const functionZone = links.functionZoneUrl.trim();
  const functionZoneInternal = functionZone.startsWith("/") && !functionZone.startsWith("//") ? functionZone : undefined;
  const functionZoneExternal = safeExternalUrl(functionZone);

  const socials = [
    { url: safeExternalUrl(links.lineUrl), cls: "bi_line", img: "fot_line.svg", label: "LINE 官方帳號", title: "LINE 官方帳號" },
    { url: safeExternalUrl(links.facebookUrl), cls: "bi_fb", img: "fot_fb.svg", label: "Facebook 粉絲專頁", title: "Facebook 粉絲專頁" },
    { url: safeExternalUrl(links.instagramUrl), cls: "bi_ig", img: "fot_ig.svg", label: "Instagram", title: "Instagram" },
    { url: safeExternalUrl(links.youTubeUrl), cls: "bi_yt", img: "fot_yt.svg", label: "YouTube", title: "YouTube" },
    { url: safeExternalUrl(links.threadsUrl), cls: "bi_ts", img: "fot_th.svg", label: "Threads", title: "Threads" },
    { url: safeExternalUrl(links.podcastUrl), cls: "bi_pod", img: "fot_pod.svg", label: "Podcast", title: "Podcast" },
  ].filter((item) => item.url);

  const badges = [
    { url: safeExternalUrl(links.accessibilityBadgeUrl), img: "footer_1.jpg", alt: "無障礙網頁標章2.0", title: "無障礙網頁標章2.0" },
    { url: safeExternalUrl(links.idaUrl), img: "footer_2.svg", alt: "經濟部產業發展署", title: "經濟部產業發展署" },
    { url: safeExternalUrl(links.ishaUrl), img: "footer_3.svg", alt: "工業安全衛生協會", title: "工業安全衛生協會" },
  ];

  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-top">
        <div className="d-flex">
          <div className="footer_left">
            <div className="pic">
              <img className="img-fluid d-block" src={withBasePath("/images/all/footer_bg2.png")} alt="" />
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
          <img className="img-fluid d-block" src={withBasePath("/images/all/footer_bg3.png")} alt="" />
        </div>

        <div className="footer_bg4" aria-hidden="true">
          <img className="img-fluid d-block" src={withBasePath("/images/all/footer_bg4.png")} alt="" />
        </div>
      </div>

      <div className="round_7" aria-hidden="true">
        <img className="img-fluid d-block" src={withBasePath("/images/home/round_7.jpg")} alt="" />
      </div>

      <div className="footer_content">
        <div className="container-fluid footer-container">
          <div className="footer-main">
            <div className="footer-col footer-brand">
              <div className="footer_log">
                <img className="img-fluid d-block" src={withBasePath("/images/all/logo.svg")} alt="智慧工安技術 產業資訊暨媒合平台" />
              </div>
            </div>

            <div className="footer-col footer-links">
              <div className="footer-title">Links</div>
              <ul className="nav-links">
                <li>
                  <Link href="/about" title="前往 關於我們">
                    關於我們
                  </Link>
                </li>
                <li>
                  <Link href="/news" title="前往 公告事項">
                    公告事項
                  </Link>
                </li>
                {functionZoneInternal ? (
                  <li>
                    <Link href={functionZoneInternal} title="前往 功能專區">
                      功能專區
                    </Link>
                  </li>
                ) : functionZoneExternal ? (
                  <li>
                    <a href={functionZoneExternal} target="_blank" rel="noopener noreferrer" title="前往 功能專區(另開新視窗)">
                      功能專區
                    </a>
                  </li>
                ) : null}
                <li>
                  <Link href="/matching/enterprise" title="前往 我要媒合">
                    我要媒合
                  </Link>
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
                  <Link href="/sitemap" title="前往 網站導覽">
                    網站導覽
                  </Link>
                </li>
              </ul>
            </div>

            <div className="footer-col footer-contact">
              <div className="footer-title">Contact Us</div>
              <ul className="contact-list">
                {address && (
                  <li>
                    <span className="label">聯絡地址：</span>
                    {mapUrl ? (
                      <a href={mapUrl} target="_blank" rel="noopener noreferrer" title="開啟地圖查看地址（另開新視窗）">
                        {address}
                      </a>
                    ) : (
                      <span>{address}</span>
                    )}
                  </li>
                )}
                {phone && (
                  <li>
                    <span className="label">電話：</span>
                    <a href={phoneHref} title={`撥打電話至 ${phone}`}>
                      {phone}
                    </a>
                  </li>
                )}
                {email && (
                  <li>
                    <span className="label">信箱：</span>
                    <a href={`mailto:${email}`} title={`寄信至 ${email}`}>
                      {email}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="footer-mid">
            {socials.length > 0 && (
              <ul className="social-list">
                {socials.map((item) => (
                  <li key={item.cls}>
                    <a href={item.url} target="_blank" rel="noopener noreferrer" title={`${item.title}(另開新視窗)`}>
                      <span className={item.cls} aria-hidden="true">
                        <img className="img-fluid d-block" src={withBasePath(`/images/all/${item.img}`)} alt={item.label} />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}

            {visitorCount !== null && (
              <div className="counter-list">
                <span>
                  瀏覽 <strong>{visitorCount.toLocaleString("en-US")}</strong>
                </span>
              </div>
            )}
          </div>

          <div className="footer-divider"></div>

          <div className="footer-bottom">
            <div className="badges-group">
              {badges.map((badge) => {
                const image = <img className="img-fluid" src={withBasePath(`/images/all/${badge.img}`)} alt={badge.alt} />;
                return badge.url ? (
                  <a href={badge.url} target="_blank" rel="noopener noreferrer" title={`${badge.title}（另開新視窗）`} key={badge.img}>
                    {image}
                  </a>
                ) : (
                  <span key={badge.img}>{image}</span>
                );
              })}
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
