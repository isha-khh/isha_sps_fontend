import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";
import { withBasePath } from "@/lib/api-client";
import type { MatchingNeed } from "@/lib/matching-need-data";

/**
 * 積木元件：需求詳情頁「相關需求」輪播，對應設計稿
 * `page/matching/_uc/public_need.html` 的 `.cont`——一次顯示 3 則需求
 * 卡片（`slidesToShow: 3`，響應式收到 2／1），跟 `PromoBanner`（單張
 * 大圖輪播）版型不一樣，這裡是「一組卡片」的輪播，所以另開元件，
 * 共用底層的 `Carousel`／`CarouselControls`。
 */
export default function RelatedNeeds({ id, needs }: { id: string; needs: MatchingNeed[] }) {
  if (needs.length === 0) return null;

  return (
    <div className="cont">
      <div className="dow-name">
        <i className="bi bi-gear me-1" aria-hidden="true" />
        <span>相關需求</span>
      </div>

      <div className="prom_section">
        <Carousel
          id={id}
          className="wid-pub"
          options={{
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            autoplay: true,
            autoplaySpeed: 3000,
            arrows: false,
            responsive: [
              { breakpoint: 992, settings: { slidesToShow: 2 } },
              { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
          }}
          slides={needs.map((need) => (
            <a href={withBasePath(`/matching/${need.id}`)} title={need.title} className="tit" key={need.id}>
              <div className="tit_nsl">
                <div className="tit_three d-flex">
                  <div className="tag-wrap">
                    <span className="badge-tag mb-0">{need.statusLabel}</span>
                  </div>
                </div>

                <div className="h3_solid">
                  <h3>{need.title}</h3>
                </div>

                <ul className="nav d-block">
                  <li className="mb-2">
                    <i className="bi bi-geo-alt me-1" />
                    <span>
                      <b>地點 : </b>
                      {need.location}
                    </span>
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-calendar4-week me-1" />
                    <span>
                      <b>發布日期 : </b>
                      {need.publishedDate}
                    </span>
                  </li>
                </ul>
              </div>
            </a>
          ))}
        />
      </div>

      <CarouselControls carouselId={id} prevLabel="上一則" nextLabel="下一則" />
    </div>
  );
}
