import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";
import { withBasePath } from "@/lib/api-client";

interface PromoBannerSlide {
  href: string;
  title: string;
  image: string;
}

const SLIDES: PromoBannerSlide[] = [
  { href: "#", title: "石化產業智慧轉型——從數據到決策", image: withBasePath("/images/banner/b1.jpg") },
  { href: "#", title: "AI 智慧安全帽偵測系統導入石化廠", image: withBasePath("/images/banner/b1.jpg") },
  { href: "#", title: "ESG 永續發展實務：石化廠的碳盤查經驗分享", image: withBasePath("/images/banner/b1.jpg") },
];

/**
 * 積木元件：內頁頂端的輪播看板，對應舊站 `.banner_section` +
 * `.wid-banner-news`——原本只有 `/news`（`NewsBanner.tsx`）有這塊，
 * 2026-09-16 對照設計稿才發現 `page/_uc/banner.html`（`/talent`
 * 用）／`page/_uc/banner_support.html`（`/support` 用）內容跟
 * `/news` 的 `page/_uc/banner.html` 一模一樣（同一組假資料、同一段
 * slick 設定），從 `NewsBanner.tsx` 抽出來的共用版本，`NewsBanner`
 * 保留原本的匯入路徑當一層薄的包裝，不用改 `/news` 那邊的呼叫端。
 *
 * `id` 給 Carousel／CarouselControls 當 DOM id 用，同一頁如果之後有
 * 其他輪播要避免撞名——雖然目前每個用到這顆元件的頁面都只有一個
 * banner，不會真的撞到，但比照 `Carousel` 元件本來的介面設計還是
 * 讓呼叫端自己指定。
 */
export default function PromoBanner({ id }: { id: string }) {
  return (
    <div className="banner_section">
      <Carousel
        id={id}
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
          <a href={withBasePath(slide.href)} className="video-card" title={`${slide.title}（另開視窗）`} target="_blank" rel="noopener noreferrer" key={slide.title}>
            {/* 說明見原本 NewsBanner.tsx 同一段註解：寬高比先卡住，避免圖片載入前容器塌陷造成按鈕位置跳動 */}
            <div className="pic" style={{ aspectRatio: "1400 / 500" }}>
              <img className="img-fluid d-block" src={slide.image} alt={slide.title} />
            </div>
          </a>
        ))}
      />

      <CarouselControls carouselId={id} prevLabel="上一則" nextLabel="下一則" />

      <style>{`
        /* 說明見原本 NewsBanner.tsx 同一段註解：hover 位移、z-index、.slider margin 這三條都是共用的既有 bug fix，跟哪個頁面用這顆元件無關 */
        .banner_section .slick-play-pause-btn:focus,
        .banner_section .slick-play-pause-btn:hover {
          transform: translateY(-3px);
        }

        .banner_section .slick-play-pause-btn {
          z-index: 11;
        }

        .banner_section .slider {
          margin-bottom: 0;
        }
      `}</style>
    </div>
  );
}
