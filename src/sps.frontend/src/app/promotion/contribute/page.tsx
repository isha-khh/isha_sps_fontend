import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import Badge from "@/components/ui/Badge";
import ShareBox from "@/components/ui/ShareBox";
import PromotionSubNav from "@/components/promotion/PromotionSubNav";
import PromotionContactInfo from "@/components/promotion/PromotionContactInfo";

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
 * 沒有側欄/右欄（舊站這頁 `.side1`／`.side2` 都是單純的 d-none／固定
 * 內容，不是真的分類篩選），所以 `InnerPageShell` 不給 `sidebar`／
 * `aside`，讓 `.content` 自動撐滿。
 */
export default function PromotionContributePage() {
  return (
    <>
      <BodyClass className="news show contribute" />
      <InnerPageShell
        title="我要投稿"
        titleAside={<PromotionSubNav activeHref="/promotion/contribute" />}
        breadcrumb={[{ label: "推廣專區" }, { label: "我要投稿" }]}
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
                <a href="#" title="前往產業AI" tabIndex={0}>
                  產業AI
                </a>
              </li>
              <li>
                <a href="#" title="前往技術文件" tabIndex={0}>
                  技術文件
                </a>
              </li>
            </ul>
          </div>

          <div className="ratio ratio-4x3">
            <img className="img-fluid d-block" src="/images/all/new_logo.jpg" alt="" />
          </div>

          <div className="Contributor">撰稿人 / 設計研發組研究員 郭憶璇、江宛庭</div>

          <div className="txt editor mb-md-5 mb-4">
            <p>
              歡迎業界夥伴投稿分享智慧化導入經驗、技術案例或創新應用，協助更多企業借鏡實務作法、加速智慧工安轉型。投稿內容經審核通過後，將刊登於「產業案例」專區，並視情況邀請於「影音專區」錄製分享影片。
            </p>
            <p>投稿前請先下載投稿格式，依格式填寫案例背景、導入內容與成效說明，並附上相關佐證圖片，寄至下方投稿信箱即可完成投稿。</p>
          </div>

          <div className="dk_conbo mb-md-5 mb-4">
            <PromotionContactInfo />
          </div>

          <div className="contribute_box d-flex mb-md-5 mb-4">
            <a href="#" title="下載投稿格式（另開視窗）" className="contribute_more_1">
              <i className="bi bi-file-earmark-arrow-down me-1" aria-hidden="true"></i>
              <span>下載投稿格式</span>
              <div className="con-arrow" aria-hidden="true">
                <img className="img-fluid d-block" src="/images/home/arrow.svg" alt="" />
              </div>
            </a>
            <Link href="/promotion" title="前往參考已發布的產業案例" className="contribute_more_2">
              <i className="bi bi-file-text me-1" aria-hidden="true"></i>
              <span>參考已發布的產業案例</span>
              <div className="con-arrow" aria-hidden="true">
                <img className="img-fluid d-block" src="/images/home/arrow.svg" alt="" />
              </div>
            </Link>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
