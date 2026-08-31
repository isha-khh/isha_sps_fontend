import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";
import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";

interface VideoData {
  href: string;
  title: string;
  date: string;
  thumbnail: string;
}

const VIDEOS: VideoData[] = [
  { href: "#", title: "石化產業智慧轉型——從數據到決策", date: "2025-01-19", thumbnail: "/images/home/ser_bg2.jpg" },
  { href: "#", title: "ESG 永續發展實務：石化廠的碳盤查經驗分享", date: "2025-01-19", thumbnail: "/images/home/ser_bg2.jpg" },
  { href: "#", title: "AIoT 工安監控應用：降低職災風險的關鍵", date: "2025-01-19", thumbnail: "/images/home/ser_bg2.jpg" },
  { href: "#", title: "全方位人員定位追蹤應用", date: "2025-01-19", thumbnail: "/images/home/ser_bg2.jpg" },
];

const CAROUSEL_ID = "home-video";

/**
 * 首頁「影音專區」，對應舊站 page/_uc/home/home_video.html。
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
export default function HomeVideo() {
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
        slides={VIDEOS.map((video) => (
          <a href={video.href} className="video-card" title={`${video.title}（另開新視窗）`} target="_blank" rel="noopener noreferrer" key={video.title}>
            <div className="pic">
              <div className="ratio ratio-16x9">
                <img className="img-fluid d-block" src={video.thumbnail} alt={`${video.title} 影片封面`} />
              </div>
            </div>
            <div className="tit">
              <div className="date">{video.date}</div>
              <h3>{video.title}</h3>
            </div>
          </a>
        ))}
      />

      <CarouselControls carouselId={CAROUSEL_ID} prevLabel="上一則影片" nextLabel="下一則影片" />

      <MoreLink href="/serve/videos" label="查看更多" title="前往 查看更多影音專區" />
    </div>
  );
}
