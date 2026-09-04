import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";

export interface CompanyIntroSlide {
  name: string;
  logo: string;
  description: string;
  website: string;
}

const CAROUSEL_ID = "promotion-company-intro";

/**
 * 積木元件：產業案例詳情頁的「公司簡介」輪播，對應舊站
 * page/promotion/_uc/prom.html（`.cont` > `.prom_section` > `.wid-prom`）。
 * 跟 NewsBanner／HomeVideo 一樣複用現成的 Carousel／CarouselControls，
 * 只是這裡投影片內容是圖+公司介紹文字，不是影片卡片。
 */
export default function CompanyIntroCarousel({ slides }: { slides: CompanyIntroSlide[] }) {
  return (
    <div className="cont">
      <div className="dow-name">
        <i className="bi bi-buildings me-1" aria-hidden="true"></i>
        <span>公司簡介</span>
      </div>

      <div className="prom_section">
        <Carousel
          id={CAROUSEL_ID}
          className="wid-prom"
          options={{
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 3000,
          }}
          slides={slides.map((slide) => (
            <div className="indu_box d-flex" key={slide.name}>
              <div className="pic">
                <div className="ratio ratio-4x3">
                  <img className="img-fluid d-block" src={slide.logo} alt={`${slide.name} 公司標誌`} />
                </div>
              </div>

              <div className="tit_ind">
                <div className="tit_nsl">
                  <div className="h3_solid">
                    <div className="me_sod_bu">{slide.name}</div>
                  </div>

                  <div className="txt editor">{slide.description}</div>

                  <a href={slide.website} title={`${slide.website}（另開視窗）`} target="_blank" rel="noopener noreferrer" className="blue">
                    <i className="bi bi-globe me-1" aria-hidden="true"></i>
                    <span>{slide.website}</span>
                  </a>
                </div>
              </div>
            </div>
          ))}
        />
      </div>

      <CarouselControls carouselId={CAROUSEL_ID} prevLabel="上一則" nextLabel="下一則" />
    </div>
  );
}
