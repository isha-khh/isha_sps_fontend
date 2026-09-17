import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MilestoneTimeline from "@/components/about/MilestoneTimeline";
import VisionMap from "@/components/about/VisionMap";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "關於我們",
};

const MILESTONES = [
  { year: "2024", title: "盤點產業需求", items: ["深入石化場域，盤點製程、設備、巡檢及安全管理痛點，建立石化產業智慧安全需求與技術應用方向。"] },
  { year: "2025", title: "孵化技術缺口", items: ["推動AI影像辨識、智慧巡檢、設備監測等技術進入石化場域，透過輔導及補助降低產業導入門檻。"] },
  { year: "2026", title: "擴大推動對象", items: ["聚焦高雄石化相關上下游產業實際需求，媒合國內智慧科技業者，推動AI與智慧安全技術PoC驗證，強化火災、洩漏、設備異常等風險之即時辨識與預警能力。"] },
  { year: "2027", title: "形成產業服務生態鏈", items: ["彙整場域實證成果，建立可複製的石化智慧安全應用模式，促進不同廠區、製程及高風險場域導入應用。"] },
];

/**
 * 關於我們，對應設計稿 page/about/index.html。目前後端雖然有
 * `About` entity（AboutController），但欄位只有單一標題+內容
 * （MultilingualText），撐不起這頁「計畫歷程時間軸」＋「願景台灣
 * 地圖」這種結構化版面，先照畫面做成固定內容，後端缺口記在
 * 改版規劃.md。
 *
 * 「計畫歷程」時間軸的捲動互動抽成 `MilestoneTimeline.tsx`（用
 * `motion` 讀取捲動進度，取代設計稿原本 GSAP ScrollTrigger 攔截滑鼠
 * 滾輪的做法，說明見該檔案開頭註解）。
 *
 * 「願景」區塊的台灣地圖抽成 `VisionMap.tsx`——地標掉落進場、箭頭
 * 往外擴散的動畫（`data-aos="animate-svg"` 原本沒有對應的 CSS/JS，
 * 只有標準 fade-up 這類 AOS 內建動畫有效），說明見該檔案開頭註解。
 */
export default function AboutPage() {
  return (
    <>
      <BodyClass className="about" />
      <InnerPageShell title="關於我們" breadcrumb={[{ label: "關於我們" }]}>
        <div className="ab_list1">
          <div className="tit">
            <div className="h3_tit mb-3" data-aos="fade-up">
              智慧石化永續發展計畫
            </div>
            <p data-aos="fade-up">
              以高雄石化產業聚落為核心，導入智慧科技與創新應用，強化製程安全、環境永續與營運韌性，促進產業升級轉型，打造安全、智慧、永續的石化產業生態。
            </p>
          </div>

          <div className="pic">
            <img className="img-fluid d-md-block d-none" src={withBasePath("/images/all/ab_list1_bg.jpg")} aria-hidden="true" alt="" />
            <img className="img-fluid d-md-none d-block" src={withBasePath("/images/all/ab_list1_bg_s.jpg")} aria-hidden="true" alt="" />
          </div>
        </div>

        <MilestoneTimeline milestones={MILESTONES} />

        <div className="ab_list3">
          <div className="tit">
            <div className="h3_tit" data-aos="fade-up">
              願景
            </div>
            <p data-aos="fade-up">
              立足高雄
              <span>放眼全台</span>
            </p>
          </div>

          <VisionMap />
        </div>
      </InnerPageShell>
    </>
  );
}
