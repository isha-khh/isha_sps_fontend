import SectionTitle from "@/components/ui/SectionTitle";
import Tabs from "@/components/ui/Tabs";
import MoreLink from "@/components/ui/MoreLink";
import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";

interface ServiceSlideData {
  href: string;
  image: string;
  title: string;
  keywords: string[];
  description: string;
}

interface ServiceCategory {
  id: string;
  label: string;
  icon: string;
  englishLabel: string;
  slides: ServiceSlideData[];
}

const CATEGORIES: ServiceCategory[] = [
  {
    id: "ser-home-01",
    label: "技術工具",
    icon: "/images/home/ser_icon01.svg",
    englishLabel: "Services 01",
    slides: [
      {
        href: "/serve/1",
        image: "/images/home/ser_bg.jpg",
        title: "技術工具",
        keywords: ["產業AI", "技術文件"],
        description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
      },
      {
        href: "/serve/2",
        image: "/images/home/ser_bg.jpg",
        title: "技術工具",
        keywords: ["產業AI", "技術文件"],
        description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
      },
    ],
  },
  {
    id: "ser-home-02",
    label: "人才培育",
    icon: "/images/home/ser_icon02.svg",
    englishLabel: "Services 02",
    slides: [
      {
        href: "/serve/3",
        image: "/images/home/ser_bg.jpg",
        title: "人才培育",
        keywords: ["培訓課程"],
        description: "提供專業人才培訓方案，協助提升產業競爭力與技術能量。",
      },
    ],
  },
  {
    id: "ser-home-03",
    label: "產業輔導",
    icon: "/images/home/ser_icon03.svg",
    englishLabel: "Services 03",
    slides: [
      {
        href: "/serve/4",
        image: "/images/home/ser_bg.jpg",
        title: "產業輔導",
        keywords: ["專家諮詢"],
        description: "安排跨領域專家團隊進場輔導，協助診斷升級瓶頸與提供解決策略。",
      },
    ],
  },
  {
    id: "ser-home-04",
    label: "補助資源",
    icon: "/images/home/ser_icon04.svg",
    englishLabel: "Services 04",
    slides: [
      {
        href: "/serve/5",
        image: "/images/home/ser_bg.jpg",
        title: "補助資源",
        keywords: ["補助申請"],
        description: "整合中央與地方各項專案補助資源，減輕企業研發與數位轉型負擔。",
      },
    ],
  },
];

/**
 * 一個分類頁籤裡的輪播：對應舊站 `.ser_box`。
 *
 * 「查看更多」＋上一則/下一則/暫停播放按鈕（`.mo_pa_box`）舊站是放在
 * *每一張投影片裡面*（因為整張卡片，含圖片跟文字，是同一個滑動單位），
 * 這裡照原樣保留，用 `category.id` 當作 carouselId 把 Carousel 跟每份
 * CarouselControls 兜起來（見 Carousel／CarouselControls 元件內的說明：
 * 這兩個一定要用 data 屬性配對，不能用 ref／onClick，不然 slick 複製
 * 出來的投影片按鈕會點了沒反應）。
 */
function ServicePanel({ category }: { category: ServiceCategory }) {
  return (
    <div className="ser_box">
      <Carousel
        id={category.id}
        className="wid-ser"
        options={{
          autoplaySpeed: 3000,
          infinite: true,
          autoplay: true,
          slidesToShow: 1,
          slidesToScroll: 1,
          adaptiveHeight: false,
          pauseOnHover: true,
          pauseOnFocus: true,
        }}
        slides={category.slides.map((slide) => (
          <div className="d-flex" key={slide.href}>
            <a href={slide.href} className="pic" title={`查看更多${slide.title}內容`}>
              <div className="ratio ratio-4x3">
                <img className="img-fluid d-block" src={slide.image} alt="" />
              </div>
            </a>

            <div className="tit">
              <div className="tit_1">
                <div className="d-flex">
                  <h3>{slide.title}</h3>
                  <ul className="nav ul-key">
                    {slide.keywords.map((keyword) => (
                      <li key={keyword}>
                        <a href="#" title={`前往${keyword}`}>
                          {keyword}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                <p>{slide.description}</p>
              </div>

              <div className="mo_pa_box">
                <MoreLink href={slide.href} label="查看更多" title={`查看更多${slide.title}`} />
                <CarouselControls carouselId={category.id} prevLabel="上一則服務" nextLabel="下一則服務" />
              </div>
            </div>
          </div>
        ))}
      />
    </div>
  );
}

/**
 * 首頁「服務專區」，對應舊站 page/_uc/home/home_service.html。
 * 是 Carousel／CarouselControls 這組積木第一次真的接上真實內容驗證。
 */
export default function HomeService() {
  return (
    <div className="home_service">
      <SectionTitle eyebrow="Services" description="提供企業全方位的智慧化升級服務，從工具導入到人才培育，一站式滿足產業需求。">
        服務專區
      </SectionTitle>

      <Tabs
        id="ser-pills-tab"
        ariaLabel="服務專區分類頁籤"
        items={CATEGORIES.map((category) => ({
          id: category.id,
          ariaLabel: category.label,
          label: (
            <div className="d-flex align-items-center">
              <i aria-hidden="true">
                <img className="img-fluid d-block" src={category.icon} alt="" />
              </i>
              <span>
                {category.label}
                <small className="d-block" aria-hidden="true">
                  {category.englishLabel}
                </small>
              </span>
            </div>
          ),
          content: <ServicePanel category={category} />,
        }))}
      />

      <div className="round_3" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
      </div>
      <div className="round_3_2" aria-hidden="true">
        <img className="img-fluid d-block" src="/images/home/round_2.png" alt="" />
      </div>
    </div>
  );
}
