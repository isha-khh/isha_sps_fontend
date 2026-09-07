import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";

interface NewsBannerSlide {
  href: string;
  title: string;
  image: string;
}

const SLIDES: NewsBannerSlide[] = [
  { href: "#", title: "石化產業智慧轉型——從數據到決策", image: "/images/banner/b1.jpg" },
  { href: "#", title: "AI 智慧安全帽偵測系統導入石化廠", image: "/images/banner/b1.jpg" },
  { href: "#", title: "ESG 永續發展實務：石化廠的碳盤查經驗分享", image: "/images/banner/b1.jpg" },
];

const CAROUSEL_ID = "news-banner";

/**
 * 積木元件：公告事項列表頁最上方那條輪播看板，對應舊站
 * page/_uc/banner.html（`.banner_section` + `.wid-banner-news`）——
 * 只有 `/news` 列表頁有這塊，`/serve` 沒有（那邊的 `.banner` 沒被
 * 用到，側欄廣告是另一支 `.side2_banner`，見 SidebarBanner.tsx）。
 *
 * 跟首頁 HomeVideo 用的是同一組 Carousel／CarouselControls 積木，
 * 只是 `centerPadding`／`slidesToShow` 這些選項照舊站這裡的設定
 * （單張置中、大留白），不是複製 HomeVideo 的三張並排設定。
 */
export default function NewsBanner() {
  return (
    <div className="banner_section">
      <Carousel
        id={CAROUSEL_ID}
        className="wid-banner-news"
        options={{
          centerMode: true,
          centerPadding: "180px",
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: true,
          autoplaySpeed: 3000,
          infinite: true,
          dots: true,
          accessibility: true,
          pauseOnHover: true,
          pauseOnFocus: true,
          responsive: [
            { breakpoint: 992, settings: { centerPadding: "60px" } },
            { breakpoint: 768, settings: { centerPadding: "0" } },
          ],
        }}
        slides={SLIDES.map((slide) => (
          <a href={slide.href} className="video-card" title={`${slide.title}（另開視窗）`} target="_blank" rel="noopener noreferrer" key={slide.title}>
            <div className="pic">
              <img className="img-fluid d-block" src={slide.image} alt={slide.title} />
            </div>
          </a>
        ))}
      />

      <CarouselControls carouselId={CAROUSEL_ID} prevLabel="上一則" nextLabel="下一則" />
    </div>
  );
}
