import SectionTitle from "@/components/ui/SectionTitle";
import MoreLink from "@/components/ui/MoreLink";
import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";

interface IndustryCaseData {
  href: string;
  title: string;
  description: string;
  image: string;
}

const CASES: IndustryCaseData[] = [
  {
    href: "/serve/case-1",
    title: "AI 智慧安全帽偵測系統導入石化廠",
    description: "透過電腦視覺即時偵測人員安全裝備佩戴情況，顯著降低工安事故發生率，有效提升工地安全管理效率。",
    image: "/images/home/ser_bg.jpg",
  },
  {
    href: "/serve/case-2",
    title: "AI 智慧安全帽偵測系統導入石化廠",
    description: "透過電腦視覺即時偵測人員安全裝備佩戴情況，顯著降低工安事故發生率，有效提升工地安全管理效率。",
    image: "/images/home/ser_bg.jpg",
  },
];

const CAROUSEL_ID = "home-industry";

/**
 * 首頁「產業案例」，對應舊站 page/_uc/home/home_industry.html。
 *
 * 編號（01、02…）舊站是用 jQuery 在 `$(document).ready` 裡塞進
 * `.i_number` 的，這裡直接用陣列索引算，不用另外寫一段 DOM 操作。
 */
export default function HomeIndustry() {
  return (
    <div className="home_industry">
      <div className="home_industry_top">
        <SectionTitle eyebrow="Success Stories">產業案例</SectionTitle>
      </div>

      <div className="round_5" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_5.jpg" alt="" />
      </div>
      <div className="round_6" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_6.png" alt="" />
      </div>

      <div className="home_industry_box">
        <div className="ser_box">
          <Carousel
            id={CAROUSEL_ID}
            className="wid-ind"
            options={{
              autoplaySpeed: 3000,
              infinite: true,
              autoplay: true,
              slidesToShow: 1,
              slidesToScroll: 1,
              pauseOnHover: true,
              pauseOnFocus: true,
            }}
            slides={CASES.map((item, index) => (
              <div className="d-flex" key={item.href}>
                <div className="tit">
                  <div className="tit_1">
                    <a href={item.href} title="查看更多產業案例">
                      <div className="d-flex">
                        <h3>{item.title}</h3>
                        <div className="i_number">{String(index + 1).padStart(2, "0")}</div>
                      </div>
                      <p>{item.description}</p>
                    </a>
                  </div>

                  <div className="mo_pa_box">
                    <MoreLink href={item.href} label="查看更多" title="查看更多產業案例" />
                    <CarouselControls carouselId={CAROUSEL_ID} prevLabel="上一則服務" nextLabel="下一則服務" />
                  </div>
                </div>

                <a href={item.href} className="pic" title="查看更多產業案例內容">
                  <div className="ratio ratio-4x3">
                    <img className="img-fluid d-block" src={item.image} alt="" />
                  </div>
                </a>
              </div>
            ))}
          />
        </div>
      </div>
    </div>
  );
}
