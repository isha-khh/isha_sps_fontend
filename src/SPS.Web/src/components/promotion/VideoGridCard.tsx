import { getYouTubeEmbedUrl } from "@/lib/content-list-utils";

export interface VideoGridCardData {
  href: string;
  thumbnail: string;
  title: string;
  date: string;
  keywords?: string[];
  /** 後台「網站內播放」開關，`false` 時整張卡片一律當一般外部連結，不掛 `data-fancybox`，見下面的說明 */
  playOnSite: boolean;
}

/**
 * 積木元件：影音專區清單卡片，對應舊站 page/promotion/video.html 的
 * `.col-lg-4.item.item_video > .item_box`——16:9 縮圖、日期在標題上方，
 * 跟 IndustryCaseCard（4:3 縮圖、沒有日期在標題上方、多說明文字跟
 * 瀏覽數）版型不一樣，另外做一個元件。
 *
 * 斷點（`col-lg-4 col-md-6 col-12`）同步舊站 2026-09-04 更新，理由見
 * IndustryCaseCard.tsx 同一段註解。
 *
 * 2026-09-10 客戶要求點下去在頁面內播放、不要整個跳出去開新分頁：
 * 加 `data-fancybox`，交給整站已經在跑的全域綁定
 * （`coreScript.js` 的 `Fancybox.bind('[data-fancybox]', {...})`，跟
 * `ZoomableImage.tsx` 點圖放大是同一套機制）。`href` 是 `"#"`（真的
 * 沒有任何可播放來源）時不要掛這個屬性，維持原本的無作用連結，避免
 * Fancybox 對著 `#` 開一個空的燈箱。
 *
 * YouTube 連結**不能**只靠 `data-fancybox` 讓 Fancybox 自己判斷——
 * 實測過這支專案用的 Fancybox 5.0.33 認不出 YouTube 分享按鈕產生的
 * `youtu.be/{id}?si=...` 這種網址（`si` 是這幾年才有的追蹤參數），
 * 燈箱殼開得起來但內容一直卡在讀取中。改成自己用
 * `getYouTubeEmbedUrl()` 算出正確的嵌入網址，透過 `data-type`／
 * `data-src` 明確告訴 Fancybox（見那支函式的說明）；不是 YouTube
 * 連結（例如直接上傳的 mp4 檔）才讓 Fancybox 照原本的方式自己判斷。
 *
 * `target="_blank"`／`rel` 保留當退路：Fancybox 綁定失敗或使用者
 * 停用 JS 時，至少還能照原本的行為開新分頁看影片，不會完全點不到。
 *
 * `group` 用來把同一頁面上的好幾支影片串成同一組燈箱（開著時可以
 * 用上一部/下一部切換），沒給的話用 `href` 自己當分組值，讓卡片彼此
 * 獨立（不會因為剛好都沒給 group，就被 Fancybox 誤判成同一組）。
 *
 * 【踩過的坑】`data-fancybox` 只能掛在**這張卡片裡的其中一個**
 * `<a>` 上（這裡固定掛縮圖），不能兩個都掛——Fancybox 是照「所有帶著
 * 同一個分組值的元素」組出燈箱清單的，不會自動去重複，同一支影片
 * 掛兩個 `data-fancybox` 就會在燈箱縮圖列表裡出現兩次，詳細說明見
 * FeaturedVideoCard.tsx 同一段註解（客戶實際回報「只上傳一支影片，
 * 縮圖清單卻有三個」，就是那邊＋這裡加起來重複算的）。
 *
 * 2026-09-10 加 `data.playOnSite`（對到後端 `Video.PlayOnSite`）：
 * 客戶顧慮正式環境的 CSP（`frame-src`）不一定放行每支影片來源的
 * 網域，與其接了才發現某支影片嵌入不出來，讓後台可以針對「這一支」
 * 影片個別關掉嵌入播放——關掉時整張卡片都當一般外部連結處理（不掛
 * `data-fancybox`，行為等同 `hasSource` 是 `false` 的情況），跟
 * YouTube 網址解析是兩個獨立的判斷，不要合併成同一個條件。
 */
export default function VideoGridCard({ data, group }: { data: VideoGridCardData; group?: string }) {
  const hasLink = data.href !== "#";
  const hasSource = hasLink && data.playOnSite;
  const embedUrl = getYouTubeEmbedUrl(data.href);
  const watchTitle = hasSource ? `播放：${data.title}` : hasLink ? `前往觀看：${data.title}（另開視窗）` : data.title;
  const fancyboxProps = hasSource
    ? embedUrl
      ? { "data-fancybox": group ?? data.href, "data-type": "iframe", "data-src": embedUrl }
      : { "data-fancybox": group ?? data.href }
    : {};

  return (
    <div className="col-lg-4 col-md-6 col-12 item item_video mb-md-4 mb-4">
      <div className="item_box">
        <a href={data.href} className="pic" title={watchTitle} target="_blank" rel="noopener noreferrer" {...fancyboxProps}>
          <div className="ratio ratio-16x9">
            <img className="img-fluid d-block" src={data.thumbnail} alt="" />
          </div>
        </a>

        <div className="tit mt-4">
          <a href={data.href} title={watchTitle} target="_blank" rel="noopener noreferrer">
            <div className="tit_nsl">
              <div className="date">{data.date}</div>
              <h3>{data.title}</h3>
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
