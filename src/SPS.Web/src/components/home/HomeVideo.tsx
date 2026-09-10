import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";
import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";
import { fetchVideos } from "@/lib/api.server";
import { PROMOTION_VIDEOS, sortVideosByOrdinal } from "@/lib/promotion-data";
import { formatIsoDate, getYouTubeThumbnail, getYouTubeEmbedUrl } from "@/lib/content-list-utils";

const CAROUSEL_ID = "home-video";
const VIDEO_FALLBACK_THUMBNAIL = "/images/home/ser_bg2.jpg";
const HOME_VIDEO_COUNT = 4;

/**
 * 首頁「影音專區」，對應舊站 page/_uc/home/home_video.html。
 *
 * 2026-09-10 對接真後端 `GET /api/Video`（跟 `/promotion/video` 共用
 * `fetchVideos`／`PROMOTION_VIDEOS` 假資料，不用另外維護一份），取
 * `ordinal` 排序後最前面 4 支——`Video` entity 沒有點閱數欄位，沒辦法
 * 像 News/Promotion 那樣照熱門度排序，理由見 `promotion-data.ts` 的
 * 說明。`backendAvailable:false`（連不到後端）才退回假資料。
 *
 * 順便修正一個既有連結錯誤：「查看更多」原本連到 `/serve/videos`
 * （這個路由不存在），改成真的影音專區頁面 `/promotion/video`。
 *
 * 卡片的連結／縮圖用同一套 `linkUrl || uri` / `thumbnailUri ||
 * getYouTubeThumbnail(uri)` 退回邏輯，跟 `/promotion/video` 共用
 * 同一個理由——見 `content-list-utils.ts` 的 `getYouTubeThumbnail`
 * 說明：後台塞資料時很自然會把 YouTube 網址直接填在「影片檔案」
 * （`uri`）欄位、不填「連結網址」或縮圖，這裡要能撐住這種填法。
 *
 * 點下去在頁面內播放（`data-fancybox`）也跟 `/promotion/video` 一樣，
 * 理由見 VideoGridCard.tsx 的說明。這裡額外要確認的是「slick
 * `infinite:true` 會複製投影片 DOM」這件事會不會讓複製出來的按鈕
 * 點了沒反應（`CarouselControls.tsx` 開頭那段說明的同一個問題）——
 * 答案是不會：那個問題出在 React 的 `onClick` 只認得 React 自己
 * render 出來的節點，複製出來的 clone 不算數；`Fancybox.bind()` 走的
 * 是原生事件代理（跟 jQuery `.on(event, selector, handler)` 同一種
 * 機制，掛在 document 上、點擊當下才比對選擇器），不管節點是不是
 * slick clone 出來的，只要有 `data-fancybox` 屬性、比對得到選擇器
 * 就會生效，這裡不用像 CarouselControls 那樣改用 data 屬性 + 外部
 * 事件代理繞過去。
 *
 * 跟服務專區／產業案例不同：這裡的上一則/下一則/暫停播放按鈕舊站是放
 * 在輪播*外面*、只有一份（不是每張投影片各塞一份），所以不會遇到
 * Carousel／CarouselControls 文件裡提到的「slick clone 出來的按鈕點了
 * 沒反應」問題——但還是照樣用同一套 data-carousel-id 機制，行為一致、
 * 之後維護起來不用記兩套規則。
 *
 * 舊站另外還有一段「Tab 鍵聚焦卡片時自動把輪播切過去」的加強，
 * slick 預設的 `accessibility: true`（見 options）已經會處理複製投影片
 * 的 tabindex／aria-hidden，這裡先不额外實作那段鍵盤增強，之後有需要
 * 再補。
 */
export default async function HomeVideo() {
  const { items, backendAvailable } = await fetchVideos();
  const source = backendAvailable ? items : PROMOTION_VIDEOS;
  const videos = sortVideosByOrdinal(source).slice(0, HOME_VIDEO_COUNT);

  return (
    <div className="home_video_section">
      <SectionTitle eyebrow="Media Zone">影音專區</SectionTitle>

      <Carousel
        id={CAROUSEL_ID}
        className="wid-video"
        options={{
          centerMode: true,
          centerPadding: "120px",
          slidesToShow: 3,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 3000,
          infinite: true,
          accessibility: true,
          pauseOnHover: true,
          pauseOnFocus: true,
          responsive: [
            { breakpoint: 992, settings: { slidesToShow: 2, centerPadding: "60px" } },
            { breakpoint: 768, settings: { slidesToShow: 1, centerPadding: "30px" } },
          ],
        }}
        slides={videos.map((video) => {
          const href = video.linkUrl || video.uri || "#";
          const hasLink = href !== "#";
          // `playOnSite`：後台可以針對這支影片個別關掉站內嵌入播放
          // （CSP 顧慮），說明見 VideoGridCard.tsx 同一段註解。
          const hasSource = hasLink && video.playOnSite;
          const embedUrl = getYouTubeEmbedUrl(href);
          const fancyboxProps = hasSource
            ? embedUrl
              ? { "data-fancybox": "home-video", "data-type": "iframe", "data-src": embedUrl }
              : { "data-fancybox": "home-video" }
            : {};
          const watchTitle = hasSource ? `播放：${video.name}` : hasLink ? `前往觀看：${video.name}（另開視窗）` : video.name;

          return (
          <a
            href={href}
            className="video-card"
            title={watchTitle}
            target="_blank"
            rel="noopener noreferrer"
            key={video.id}
            {...fancyboxProps}
          >
            <div className="pic">
              <div className="ratio ratio-16x9">
                <img
                  className="img-fluid d-block"
                  src={video.thumbnailUri || getYouTubeThumbnail(video.uri) || VIDEO_FALLBACK_THUMBNAIL}
                  alt={`${video.name} 影片封面`}
                />
              </div>
            </div>
            <div className="tit">
              <div className="date">{formatIsoDate(video.createdTime)}</div>
              <h3>{video.name}</h3>
            </div>
          </a>
          );
        })}
      />

      <CarouselControls carouselId={CAROUSEL_ID} prevLabel="上一則影片" nextLabel="下一則影片" />

      <MoreLink href="/promotion/video" label="查看更多" title="前往 查看更多影音專區" />
    </div>
  );
}
