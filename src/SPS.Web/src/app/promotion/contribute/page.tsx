import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import ShareBox from "@/components/ui/ShareBox";
import PromotionSubNav from "@/components/promotion/PromotionSubNav";
import PromotionContactInfo from "@/components/promotion/PromotionContactInfo";
import ContributeFormatDialog from "@/components/promotion/ContributeFormatDialog";
import PopularPosts from "@/components/layout/PopularPosts";
import SidebarBanner from "@/components/layout/SidebarBanner";
import { fetchContributePage, fetchPromotionCases, fetchBanners } from "@/lib/api.server";
import { formatIsoDate, sortByViewCount } from "@/lib/content-list-utils";
import { INDUSTRY_CASES, PROMOTION_FALLBACK_IMAGE } from "@/lib/promotion-data";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "我要投稿",
};

/**
 * 推廣專區「我要投稿」，對應舊站 page/promotion/contribute.html。
 *
 * 這頁其實是一篇說明文章（投稿辦法），不是真的投稿表單——內文下方
 * 兩顆按鈕（下載投稿格式／參考已發布的產業案例）都是連結，沒有
 * 上傳檔案這類互動，所以沒有做成表單元件。
 *
 * 2026-10-05：「下載投稿格式」原本是連到 `#` 的假連結，改成開對話框讓使用者選 ODF 或 PDF 格式；
 * 檔案、投稿聯絡人／電話／信箱都由後台「內容管理 → 頁面設定 → 我要投稿」維護，沒設定檔案時按鈕顯示
 * 「投稿格式準備中」，不再有失效連結。
 *
 * 左側 `.side1` 設計稿是 d-none（沒有分類篩選），所以不給 `sidebar`；右側 `.side2` 有「熱門產業案例」
 * 加廣告版位（跟產業案例詳情頁同一組），2026-10-05 照設計稿補上——之前漏掉，造成內文欄比設計稿寬、
 * 圖片也跟著變大。
 */
export default async function PromotionContributePage() {
  const [page, sidebarBanners, cases] = await Promise.all([
    fetchContributePage(),
    fetchBanners("sidebar-promotion"),
    fetchPromotionCases(),
  ]);
  const popularSource = cases.backendAvailable ? cases.items : INDUSTRY_CASES;
  const popularItems = sortByViewCount(popularSource)
    .slice(0, 5)
    .map((c) => ({
      href: `/promotion/${c.id}`,
      title: c.title,
      date: formatIsoDate(c.publishedDate),
      image: c.coverImageUrl || PROMOTION_FALLBACK_IMAGE,
    }));

  return (
    <>
      <BodyClass className="news show contribute" />
      <InnerPageShell
        title="我要投稿"
        titleAside={<PromotionSubNav activeHref="/promotion/contribute" />}
        breadcrumb={[{ label: "推廣專區" }, { label: "我要投稿" }]}
        aside={
          <>
            <PopularPosts items={popularItems} heading="熱門產業案例" />
            <SidebarBanner banners={sidebarBanners} />
          </>
        }
        decorations={
          <>
            <div className="s_round_6" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_6.png")} alt="" />
            </div>
            <div className="s_round_3" aria-hidden="true">
              <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
            </div>
          </>
        }
      >
        <div className="column_box">
          <div className="tit">
            <div className="tit_nsl">
              <h3>我要投稿</h3>
              <div className="tit_three d-flex mb-2">
                <div className="tit_three_left">
                  <div className="tag-wrap">
                    <Badge>案例徵稿</Badge>
                  </div>
                  <div className="part-line"></div>
                  <div className="date">2026-04-15</div>
                </div>
                <ShareBox />
              </div>
            </div>

            <ul className="nav ul-key">
              <li>
                <Link href="/serve?category=產業AI" title="前往產業AI" tabIndex={0}>
                  產業AI
                </Link>
              </li>
              <li>
                <Link href="/serve?category=技術文件" title="前往技術文件" tabIndex={0}>
                  技術文件
                </Link>
              </li>
            </ul>
          </div>

          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src={withBasePath("/images/all/new_logo.jpg")} alt="" />
          </div>

          <div className="Contributor">撰稿人 / 設計研發組研究員 郭憶璇、江宛庭</div>

          <div className="txt editor mb-md-5 mb-4">
            <p>
              歡迎業界夥伴投稿分享智慧化導入經驗、技術案例或創新應用，協助更多企業借鏡實務作法、加速智慧工安轉型。投稿內容經審核通過後，將刊登於「產業案例」專區，並視情況邀請於「影音專區」錄製分享影片。
            </p>
            <p>投稿前請先下載投稿格式，依格式填寫案例背景、導入內容與成效說明，並附上相關佐證圖片，寄至下方投稿信箱即可完成投稿。</p>
          </div>

          <div className="dk_conbo mb-md-5 mb-4">
            <PromotionContactInfo name={page.contactName} phone={page.contactPhone} email={page.contactEmail} />
          </div>

          <div className="contribute_box d-flex mb-md-5 mb-4">
            <ContributeFormatDialog formats={page.formats} />
            <Link href="/promotion" title="前往參考已發布的產業案例" className="contribute_more_2">
              <i className="bi bi-file-text me-1" aria-hidden="true"></i>
              <span>參考已發布的產業案例</span>
              <div className="con-arrow" aria-hidden="true">
                <img className="img-fluid d-block" src={withBasePath("/images/home/arrow.svg")} alt="" />
              </div>
            </Link>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
