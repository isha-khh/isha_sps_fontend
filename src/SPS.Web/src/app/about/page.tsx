import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MilestoneTimeline from "@/components/about/MilestoneTimeline";
import VisionMap from "@/components/about/VisionMap";
import { withBasePath } from "@/lib/api-client";
import { fetchAboutPage } from "@/lib/api.server";

export const metadata: Metadata = {
  title: "關於我們",
};

/**
 * 關於我們，對應設計稿 page/about/index.html。後端的 `About` entity 欄位只有單一標題+內容，撐不起這頁
 * 「計畫歷程時間軸」＋「願景台灣地圖」這種結構化版面，所以文字內容（計畫名稱與簡介、歷程、願景標語）改放在
 * 後台「內容管理 → 頁面設定 → 關於我們」（2026-10-13），圖形（背景圖、台灣地圖）仍由前台程式控制；
 * 後端沒設定過或連不到時用預設內容（見 `DEFAULT_ABOUT_PAGE`）。
 *
 * 「計畫歷程」時間軸的捲動互動抽成 `MilestoneTimeline.tsx`（用
 * `motion` 讀取捲動進度，取代設計稿原本 GSAP ScrollTrigger 攔截滑鼠
 * 滾輪的做法，說明見該檔案開頭註解）。
 *
 * 「願景」區塊的台灣地圖抽成 `VisionMap.tsx`——地標掉落進場、箭頭
 * 往外擴散的動畫（`data-aos="animate-svg"` 原本沒有對應的 CSS/JS，
 * 只有標準 fade-up 這類 AOS 內建動畫有效），說明見該檔案開頭註解。
 */
export default async function AboutPage() {
  const about = await fetchAboutPage();
  return (
    <>
      <BodyClass className="about" />
      <InnerPageShell title="關於我們" breadcrumb={[{ label: "關於我們" }]}>
        <div className="ab_list1">
          <div className="tit">
            {/* 設計稿的標題沒有 AOS 動畫，只有下面的介紹文字有淡入上移（issue #44 對照 demo 後拿掉標題的動畫） */}
            <div className="h3_tit mb-3">{about.title}</div>
            {about.intro && <p data-aos="fade-up">{about.intro}</p>}
          </div>

          <div className="pic">
            <img className="img-fluid d-md-block d-none" src={withBasePath("/images/all/ab_list1_bg.jpg")} aria-hidden="true" alt="" />
            <img className="img-fluid d-md-none d-block" src={withBasePath("/images/all/ab_list1_bg_s.jpg")} aria-hidden="true" alt="" />
          </div>
        </div>

        {about.milestones.length > 0 && <MilestoneTimeline milestones={about.milestones} />}

        <div className="ab_list3">
          <div className="tit">
            <div className="h3_tit" data-aos="fade-up">
              {about.visionTitle}
            </div>
            <p data-aos="fade-up">
              {about.visionLine}
              {about.visionHighlight && <span>{about.visionHighlight}</span>}
            </p>
          </div>

          <VisionMap />
        </div>
      </InnerPageShell>
    </>
  );
}
