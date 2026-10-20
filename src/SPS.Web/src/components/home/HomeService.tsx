import SectionTitle from "@/components/ui/SectionTitle";
import Tabs from "@/components/ui/Tabs";
import MoreLink from "@/components/ui/MoreLink";
import Carousel from "@/components/ui/Carousel";
import CarouselControls from "@/components/ui/CarouselControls";
import { withBasePath } from "@/lib/api-client";
import { fetchIndustryAiLink, fetchSectionItems, NewsSections, type NewsSectionId } from "@/lib/api.server";
import { resolveServeCategoryLink, type IndustryAiLink } from "@/lib/industry-ai-link";

interface ServiceSlideData {
  href: string;
  /** 關鍵字連結：沒給就連到這張投影片所屬專區的列表頁 */
  keywordHrefs?: string[];
  /** 哪些關鍵字連到外部網址（後台「產業AI」外部連結開啟時），這些連結要另開新視窗 */
  externalKeywords?: Array<{ newTab: boolean } | null>;
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

const SERVICE_FALLBACK_IMAGE = withBasePath("/images/home/ser_bg.jpg");
const HOME_SERVE_COUNT = 5;
const DESCRIPTION_MAX_LENGTH = 90;

const TOOL_FALLBACK_SLIDE: ServiceSlideData = {
  href: "/serve",
  image: SERVICE_FALLBACK_IMAGE,
  title: "技術工具",
  keywords: ["產業AI", "技術文件"],
  keywordHrefs: ["/serve?category=" + encodeURIComponent("產業AI"), "/serve?category=" + encodeURIComponent("技術文件")],
  description: "提供產業適用的AI工具庫與技術規範文件，協助企業快速評估並導入智慧化解決方案。",
};

/**
 * 一個頁籤的投影片：取後台對應專區最新發布的項目；還沒有任何項目（或連不到後端）時，
 * 退回一張通用介紹，連到該專區的列表頁——不再連到寫死的 `/serve/<編號>`（那些編號不一定存在）。
 * `categoryPath` 有值時，項目的分類名稱會連到 `<categoryPath>?category=<分類名稱>`。
 */
async function loadSlides(section: NewsSectionId, detailBase: string, categoryPath: string | undefined, fallback: ServiceSlideData): Promise<ServiceSlideData[]> {
  const { items } = await fetchSectionItems(section, { pageSize: HOME_SERVE_COUNT });
  if (items.length === 0) return [fallback];
  return items.map((item) => {
    const intro = (item.introduction ?? "").trim();
    const category = item.categoryName?.trim();
    const keywords = categoryPath ? (category ? [category] : []) : (item.tags ?? []).slice(0, 3);
    return {
      href: `${detailBase}/${item.id}`,
      image: item.imageUrl || SERVICE_FALLBACK_IMAGE,
      title: item.title,
      keywords,
      keywordHrefs: categoryPath ? keywords.map((name) => `${categoryPath}?category=${encodeURIComponent(name)}`) : undefined,
      description: intro.length > DESCRIPTION_MAX_LENGTH ? `${intro.slice(0, DESCRIPTION_MAX_LENGTH)}…` : intro,
    };
  });
}

const TALENT_FALLBACK_SLIDE: ServiceSlideData = {
  href: "/talent",
  image: SERVICE_FALLBACK_IMAGE,
  title: "人才培育",
  keywords: ["培訓課程"],
  description: "提供專業人才培訓方案，協助提升產業競爭力與技術能量。",
};

const TUTORING_FALLBACK_SLIDE: ServiceSlideData = {
  href: "/tutoring",
  image: SERVICE_FALLBACK_IMAGE,
  title: "產業輔導",
  keywords: ["專家諮詢"],
  description: "安排跨領域專家團隊進場輔導，協助診斷升級瓶頸與提供解決策略。",
};

const SUPPORT_FALLBACK_SLIDE: ServiceSlideData = {
  href: "/support",
  image: SERVICE_FALLBACK_IMAGE,
  title: "補助資源",
  keywords: ["補助申請"],
  description: "整合中央與地方各項專案補助資源，減輕企業研發與數位轉型負擔。",
};

/** 後台「頁面設定」開啟「產業AI」外部連結時，技術工具投影片上的「產業AI」關鍵字改連外部網址（其他關鍵字不變） */
function applyIndustryAiLink(slides: ServiceSlideData[], link: IndustryAiLink): ServiceSlideData[] {
  if (!link.enabled) return slides;
  return slides.map((slide) => {
    const targets = slide.keywords.map((keyword) => resolveServeCategoryLink(keyword, link));
    if (!targets.some((target) => target.external)) return slide;
    return {
      ...slide,
      keywordHrefs: slide.keywords.map((_, index) => (targets[index].external ? targets[index].href : (slide.keywordHrefs?.[index] ?? slide.href))),
      externalKeywords: targets.map((target) => (target.external ? { newTab: target.newTab } : null)),
    };
  });
}

function buildCategories(slides: { tool: ServiceSlideData[]; talent: ServiceSlideData[]; tutoring: ServiceSlideData[]; support: ServiceSlideData[] }): ServiceCategory[] {
  return [
    { id: "ser-home-01", label: "技術工具", icon: withBasePath("/images/home/ser_icon01.svg"), englishLabel: "Services 01", slides: slides.tool },
    { id: "ser-home-02", label: "人才培育", icon: withBasePath("/images/home/ser_icon02.svg"), englishLabel: "Services 02", slides: slides.talent },
    { id: "ser-home-03", label: "產業輔導", icon: withBasePath("/images/home/ser_icon03.svg"), englishLabel: "Services 03", slides: slides.tutoring },
    { id: "ser-home-04", label: "補助資源", icon: withBasePath("/images/home/ser_icon04.svg"), englishLabel: "Services 04", slides: slides.support },
  ];
}

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
            <a href={withBasePath(slide.href)} className="pic" title={`查看更多${slide.title}內容`}>
              <div className="ratio ratio-4x3">
                <img className="img-fluid d-block" src={slide.image} alt={`查看更多${slide.title}內容`} />
              </div>
            </a>

            <div className="tit">
              <div className="tit_1">
                <div className="d-flex">
                  <h3>{slide.title}</h3>
                  <ul className="nav ul-key">
                    {slide.keywords.map((keyword, index) => (
                      <li key={keyword}>
                        <a
                          href={withBasePath(slide.keywordHrefs?.[index] ?? slide.href)}
                          title={`前往${keyword}`}
                          {...(slide.externalKeywords?.[index]?.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        >
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
 *
 * 2026-10-13：四個頁籤都改讀後台對應專區的最新項目（技術工具＝服務專區、人才培育＝課程、產業輔導、
 * 補助資源＝補助公告）；還沒有內容時各自退回一張通用介紹、連到專區列表頁。
 */
export default async function HomeService() {
  const [tool, talent, tutoring, support, industryAiLink] = await Promise.all([
    loadSlides(NewsSections.Serve, "/serve", "/serve", TOOL_FALLBACK_SLIDE),
    loadSlides(NewsSections.Talent, "/talent", undefined, TALENT_FALLBACK_SLIDE),
    loadSlides(NewsSections.Tutoring, "/tutoring", "/tutoring", TUTORING_FALLBACK_SLIDE),
    loadSlides(NewsSections.Support, "/support", undefined, SUPPORT_FALLBACK_SLIDE),
    fetchIndustryAiLink(),
  ]);
  const CATEGORIES = buildCategories({ tool: applyIndustryAiLink(tool, industryAiLink), talent, tutoring, support });
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
        <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
      </div>
      <div className="round_3_2" aria-hidden="true">
        <img className="img-fluid d-block" src={withBasePath("/images/home/round_2.png")} alt="" />
      </div>
    </div>
  );
}
