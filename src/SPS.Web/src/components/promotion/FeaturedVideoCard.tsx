import { getYouTubeEmbedUrl } from "@/lib/content-list-utils";

export interface FeaturedVideoData {
  href: string;
  title: string;
  /** 真後端 `Video` entity 沒有簡介欄位，接真資料時會是 undefined，見 promotion-data.ts 的說明 */
  description?: string;
  thumbnail: string;
  date: string;
  keywords?: string[];
  /** 後台「網站內播放」開關，`false` 時整張卡片一律當一般外部連結，不掛 `data-fancybox`，見 VideoGridCard.tsx 的說明 */
  playOnSite: boolean;
}

/**
 * 積木元件：影音專區最上方的「精選影音」，對應舊站
 * page/promotion/video.html 的 `.sele_video`（跑馬燈標題跟麵包屑
 * 中間那塊滿版大卡片，只有一則，不是清單）。
 *
 * 點下去在頁面內播放的機制（`data-fancybox`／YouTube 的
 * `data-type`／`data-src`／`group`）說明見 VideoGridCard.tsx 同一段
 * 註解，這裡是同一套做法。
 *
 * 【踩過的坑】一開始把 `data-fancybox` 同時掛在這張卡片裡的三個
 * `<a>`（縮圖、標題區塊、「立即觀看」）上——Fancybox 是照「所有帶著
 * 同一個 `data-fancybox` 分組值的元素」去組出燈箱清單的，不會自動
 * 判斷「這三個其實是同一支影片、該去重複」，結果同一支影片在燈箱
 * 縮圖列表裡出現了三次（客戶回報「明明只上傳一支影片，縮圖清單卻有
 * 三個」，查到就是這個原因）。修法：**一張卡片只能有一個元素掛
 * `data-fancybox`**，這裡固定掛在縮圖（`.pic`）上；標題區塊跟「立即
 * 觀看」維持一般連結（`target="_blank"`），點了還是能看到影片，只是
 * 沒有內嵌播放，避免同一支影片被 Fancybox 算成好幾個燈箱項目。
 *
 * 2026-09-10 加 `data.playOnSite`（對到後端 `Video.PlayOnSite`）：
 * 客戶顧慮正式環境的 CSP（`frame-src`）不一定放行每支影片來源的
 * 網域，讓後台可以針對「這一支」影片個別關掉嵌入播放，說明見
 * VideoGridCard.tsx 同一段註解。
 */
export default function FeaturedVideoCard({ data, group }: { data: FeaturedVideoData; group?: string }) {
  const hasLink = data.href !== "#";
  const hasSource = hasLink && data.playOnSite;
  const embedUrl = getYouTubeEmbedUrl(data.href);
  const fancyboxProps = hasSource
    ? embedUrl
      ? { "data-fancybox": group ?? data.href, "data-type": "iframe", "data-src": embedUrl }
      : { "data-fancybox": group ?? data.href }
    : {};
  const watchTitle = hasSource ? `播放：${data.title}` : hasLink ? `前往觀看：${data.title}（另開視窗）` : data.title;

  return (
    <div className="sele_video">
      <div className="video-card">
        <a href={data.href} className="pic" title={watchTitle} target="_blank" rel="noopener noreferrer" {...fancyboxProps}>
          <div className="ratio ratio-16x9">
            <img className="img-fluid d-block" src={data.thumbnail} alt={`${data.title} 影片封面`} />
          </div>
        </a>

        <div className="tit">
          <a href={data.href} title={watchTitle} target="_blank" rel="noopener noreferrer">
            <div className="tit_three d-flex mb-2">
              <div className="tag-wrap">
                <span className="badge-tag mb-0">精選影音</span>
              </div>
              <div className="date">{data.date}</div>
            </div>
            <h3>{data.title}</h3>
            {data.description && <p>{data.description}</p>}
          </a>

          <div className="vdo_Watch d-flex">
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

            <a href={data.href} title={watchTitle} className="more_x" target="_blank" rel="noopener noreferrer">
              <span>立即觀看</span>
              <i className="bi bi-arrow-right" aria-hidden="true"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
