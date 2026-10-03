import Link from "next/link";
import BannerImpressions from "@/components/ui/BannerImpressions";
import HeroImage from "@/components/ui/HeroImage";
import TrackedLink from "@/components/ui/TrackedLink";
import { withBasePath } from "@/lib/api-client";
import type { BannerItem } from "@/lib/types";

/** 後台沒設定首頁主視覺（或後端連不到）時顯示的內建內容，照抄舊站 banner_home.html */
const DEFAULT_HERO = {
  title: "數位賦能 轉型落地",
  subtitle: "打造產業工安新標竿",
  description: "集結跨產業亮點技術與年度資源，提供企業精準的對接引導，\n讓智慧化職安防護不再是門檻，而是永續競爭力。",
  buttonText: "申請會員",
  buttonUrl: "/member/register",
  secondaryButtonText: "我要媒合",
  secondaryButtonUrl: "/matching",
};

/**
 * 過渡期元件：內容照抄舊站的 page/_uc/banner_home.html。
 *
 * 主視覺圖（下面的 HeroImage）會登記一項 loading 任務，PageLoader
 * 要等它真的載入完成才會收起載入畫面，見 lib/loading-store.ts。
 *
 * 「申請會員」／「我要媒合」設計稿原本連去 `/isha/page/member/
 * register.html`／`/isha/page/matching/index.html`，對應真頁面
 * （`/member/register`、`/matching`）都已經做出來了，改成真的路由。
 *
 * 2026-10-02：改成讀後台「橫幅管理」設定在「首頁主視覺」版位（`home-hero`）的 Banner——
 * 只取排序第一筆上架中的；標題／副標／說明／兩顆按鈕文字與連結、主視覺圖都可以在後台改。
 * 沒有設定（或後端連不到）就退回 `DEFAULT_HERO` 內建內容，首頁不會因此開天窗。
 * 各欄位沒填也各自退回內建值（例如只想換圖，不用重填一遍文案）。
 */
export default function Banner({ banner }: { banner?: BannerItem }) {
  const title = banner?.title || DEFAULT_HERO.title;
  const subtitle = banner?.subtitle || DEFAULT_HERO.subtitle;
  const [firstLine, ...restLines] = (banner?.description || DEFAULT_HERO.description).split(/\r?\n/).filter(Boolean);
  const buttonText = banner?.buttonText || DEFAULT_HERO.buttonText;
  const buttonUrl = banner?.linkUrl || DEFAULT_HERO.buttonUrl;
  const secondaryButtonText = banner?.secondaryButtonText || DEFAULT_HERO.secondaryButtonText;
  const secondaryButtonUrl = banner?.secondaryLinkUrl || DEFAULT_HERO.secondaryButtonUrl;
  const heroImage = banner?.uri || withBasePath("/images/banner/banner_bg.jpg");

  // 有 Banner 資料才記錄點擊；內建內容沒有對應的 Banner id，用一般連結
  const renderButton = (href: string, label: string) =>
    banner ? (
      <TrackedLink bannerId={banner.id} href={href} target={banner.linkTarget} title={`前往${label}`}>
        <span>{label}</span>
        <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </TrackedLink>
    ) : (
      <Link href={href} title={`前往${label}`}>
        <span>{label}</span>
        <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </Link>
    );

  return (
    <div className="banner_home" aria-label="輪播廣告看板">
      {banner && <BannerImpressions ids={[banner.id]} />}
      <div className="container-fluid p-0">
        <div>
          <div className="item">
            <div data-aos="fade-up">
              <h2 data-text={title} aria-label={title}>
                {title}
              </h2>
              <h3>{subtitle}</h3>
              <p>
                {firstLine}
                {restLines.length > 0 && <span>{restLines.join("")}</span>}
              </p>

              <ul className="nav" role="list" aria-label="行動按鈕選單">
                <li className="b1">{renderButton(buttonUrl, buttonText)}</li>
                <li className="b2">{renderButton(secondaryButtonUrl, secondaryButtonText)}</li>
              </ul>
            </div>
          </div>

          <div className="pic">
            <div className="pic_box">
              <div className="Light_1" aria-hidden="true">
                <img className="img-fluid d-block" src={withBasePath("/images/banner/banner_Light.png")} alt="" />
              </div>
              <div className="Light_2" aria-hidden="true">
                <img className="img-fluid d-block" src={withBasePath("/images/banner/banner_Light.png")} alt="" />
              </div>
              <div className="Light_3" aria-hidden="true">
                <img className="img-fluid d-block" src={withBasePath("/images/banner/banner_Light.png")} alt="" />
              </div>

              <HeroImage
                className="img-fluid d-block"
                src={heroImage}
                alt={banner?.name || "智慧化職安防護與產業數位轉型主視覺"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
