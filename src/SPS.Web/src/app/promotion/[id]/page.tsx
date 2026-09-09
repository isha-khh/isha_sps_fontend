import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import ShareBox from "@/components/ui/ShareBox";
import ZoomableImage from "@/components/ui/ZoomableImage";
import MoreLink from "@/components/ui/MoreLink";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner, { type SidebarBannerItem } from "@/components/layout/SidebarBanner";
import { PuckRenderer } from "@/components/puck/PuckRenderer";
import { fetchPromotionCases, fetchPromotionCaseDetail } from "@/lib/api.server";
import { formatIsoDate, sortByViewCount } from "@/lib/content-list-utils";
import { INDUSTRY_CASES, PROMOTION_FALLBACK_IMAGE, getIndustryCase } from "@/lib/promotion-data";

/**
 * 查一筆產業案例，後端沒有（或連不到）才退回假資料用 id 查找。
 * `cache()` 包起來的理由跟 news/[id]/page.tsx 一樣——`generateMetadata`
 * 跟頁面本身都要查同一筆資料，這裡走 axios，沒特別處理過的重複呼叫
 * 不會自動合併。
 *
 * 沒有 `generateStaticParams`／`dynamicParams = false`——真後端資料
 * 是動態的（目前 26 筆，會持續增減），不能在 build time 窮舉所有
 * 合法 id，理由跟 news/[id]/page.tsx 完全一樣。
 */
const getCase = cache(async (id: string) => {
  const backendCase = await fetchPromotionCaseDetail(id);
  if (backendCase) return backendCase;
  return getIndustryCase(id) ?? null;
});

export async function generateMetadata({ params }: PageProps<"/promotion/[id]">): Promise<Metadata> {
  const { id } = await params;
  const item = await getCase(id);
  return { title: item?.title ?? "找不到頁面" };
}

const SIDEBAR_BANNERS: SidebarBannerItem[] = [
  { href: "#", image: "/images/all/new_logo.jpg", title: "114年度石化產業智慧化補助計畫正式開放申請" },
];

/**
 * 產業案例詳情頁，對應舊站 page/promotion/show.html。
 *
 * 2026-09-08 對接真後端後的改動：
 * - 內文改用 `PuckRenderer` 顯示真後端的 `content`（Puck 區塊 JSON，
 *   跟 News/FAQ 同一套格式），不再用 `dangerouslySetInnerHTML` 直接
 *   塞假資料的 `bodyHtml`。
 * - 拿掉「撰稿人」跟「公司簡介輪播」（`CompanyIntroCarousel`）這兩塊：
 *   真後端 `SuccessCase` 沒有撰稿人欄位；「公司簡介」原本想顯示
 *   logo／介紹／網址，但 `SuccessCase.CompanyName` 只是一段自由
 *   文字，沒有連到真正的 `Company` 資料表（那邊才有這些欄位），沒有
 *   可靠的方式拼出真資料，2026-09-08 跟使用者確認後整個拿掉，記錄在
 *   docs/改版規劃.md，`CompanyIntroCarousel.tsx` 也一併刪除（拿掉這裡
 *   之後就沒有其他地方在用了）。
 * - 封面圖優先用 `item.coverImageUrl`，沒設定圖片的案例才退回
 *   `PROMOTION_FALLBACK_IMAGE` 佔位。
 * - 「熱門產業案例」側欄一樣改用 `sortByViewCount()` 照點閱率排序。
 */
export default async function PromotionShowPage({ params }: PageProps<"/promotion/[id]">) {
  const { id } = await params;
  const item = await getCase(id);

  if (!item) {
    notFound();
  }

  const { items: backendItems, backendAvailable } = await fetchPromotionCases();
  const popularSource = backendAvailable ? backendItems : INDUSTRY_CASES;
  const popularItems = sortByViewCount(popularSource)
    .filter((c) => c.id !== item.id)
    .slice(0, 5)
    .map((c) => ({
      href: `/promotion/${c.id}`,
      title: c.title,
      date: formatIsoDate(c.publishedDate),
      image: c.coverImageUrl || PROMOTION_FALLBACK_IMAGE,
    }));

  return (
    <>
      <BodyClass className="news serve promotion show" />
      <InnerPageShell
        breadcrumb={[
          { label: "推廣專區" },
          { label: "產業案例", href: "/promotion" },
          ...(item.industry ? [{ label: item.industry, href: `/promotion?industry=${encodeURIComponent(item.industry)}` }] : []),
          { label: item.title },
        ]}
        aside={
          <>
            <PopularPosts items={popularItems} heading="熱門產業案例" />
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
                  <div className="date">{formatIsoDate(item.publishedDate)}</div>
                </div>
                <ShareBox />
              </div>
            </div>

            {item.tags && item.tags.length > 0 && (
              <ul className="nav ul-key">
                {item.tags.map((keyword) => (
                  <li key={keyword}>
                    <a href="#" title={`前往${keyword}`} tabIndex={0}>
                      {keyword}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ZoomableImage src={item.coverImageUrl || PROMOTION_FALLBACK_IMAGE} alt={item.title} caption={item.title} />

          <PuckRenderer content={item.content} />

          <MoreLink href="/promotion" label="返回" title="返回" />
        </div>
      </InnerPageShell>
    </>
  );
}
