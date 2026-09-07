import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import MoreLink from "@/components/ui/MoreLink";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import CompanyIntroCarousel from "@/components/promotion/CompanyIntroCarousel";
import { INDUSTRY_CASES, getIndustryCase } from "@/lib/promotion-data";

export function generateStaticParams() {
  return INDUSTRY_CASES.map((item) => ({ id: item.id }));
}

// 跟 news/[id]、serve/[id] 是同一個理由：目前資料是固定假資料，
// generateStaticParams 已經窮舉所有合法 id，不在名單裡的一律當路由層級
// 的 404，見那兩支檔案裡更完整的說明。
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<"/promotion/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = getIndustryCase(id);
  return { title: item?.title ?? "找不到頁面" };
}

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

const COMPANY_INTRO_SLIDES = [
  {
    name: "智慧公安技術",
    logo: "/images/all/new_logo.jpg",
    description: "專注於提供企業數位轉型與智慧工安解決方案，協助客戶優化營運流程、降低風險並提升作業效率。我們整合物聯網與雲端技術，打造安全、穩定且可擴充的系統平台，協助企業落實智慧化管理。",
    website: "https://www.eztrust.com",
  },
];

/**
 * 產業案例詳情頁，對應舊站 page/promotion/show.html。
 *
 * 跟 news/[id] 結構幾乎一樣（標題/標籤/日期/分享 → 封面圖 → 撰稿人 →
 * 內文），差異只在內文下方那塊：news 是附件下載/相關連結/聯繫人資訊，
 * 這裡換成「公司簡介」輪播（CompanyIntroCarousel，對應 `.prom`）。
 * 目前沒有像 EditableArticleBody 那樣接 Puck 可編輯——那個目前只有
 * news 在測試，等確定要推廣到其他內容類型再一起加。
 */
export default async function PromotionShowPage({ params }: PageProps<"/promotion/[id]">) {
  const { id } = await params;
  const item = getIndustryCase(id);

  if (!item) {
    notFound();
  }

  const popularItems = INDUSTRY_CASES.filter((c) => c.id !== item.id).map((c) => ({
    href: `/promotion/${c.id}`,
    title: c.title,
    date: c.date,
    image: c.image,
  }));

  return (
    <>
      <BodyClass className="news serve promotion show" />
      <InnerPageShell
        breadcrumb={[{ label: "推廣專區" }, { label: "產業案例", href: "/promotion" }, { label: item.title }]}
        aside={
          <>
            <PopularPosts items={popularItems} moreHref="/promotion" heading="熱門產業案例" moreLabel="查看更多產業案例" />
            <SidebarBanner items={SIDEBAR_BANNERS} />
          </>
        }
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_6.png" alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
            </div>
          </>
        }
      >
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>{item.title}</h3>
              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="date">{item.date}</div>
                </div>
                <ShareBox />
              </div>
            </div>

            {item.keywords && item.keywords.length > 0 && (
              <ul className="nav ul-key">
                {item.keywords.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ZoomableImage src={item.image} alt={item.title} caption={item.title} />

          {item.contributor && <div className="Contributor">撰稿人 / {item.contributor}</div>}

          {/* CMS 編輯器產出的 HTML，由管理員撰寫，不是使用者輸入，這裡信任它 */}
          <div className="txt editor mb-md-5 mb-4" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />

          <div className="dk_conbo mb-md-5 mb-4">
            <CompanyIntroCarousel slides={COMPANY_INTRO_SLIDES} />
          </div>

          <MoreLink href="/promotion" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
