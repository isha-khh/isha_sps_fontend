import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
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
 * 設計稿的「計畫歷程」時間軸（`#bigYear` 隨捲動變化、`.axis-line`／
 * `.indicator-pointer`）沒有附帶對應的 JS（`coreScript.js` 裡沒有
 * 任何 milestone/bigYear 相關邏輯），先照原始 HTML 預設狀態（第一項
 * 2024 是 active）呈現靜態版面，捲動互動之後如果客戶真的要，需要
 * 另外請設計端補這段行為的規格再做。
 *
 * 「願景」區塊的台灣地圖是一張很大的內嵌 SVG（超過 500 行路徑資料），
 * 抽成 public/images/about/taiwan-map.svg 用 <img> 引入，不塞進這支
 * 元件檔——`data-aos="animate-svg"` 這個值目前也沒有對應的 CSS/JS
 * （只有標準的 fade-up 這類 AOS 內建動畫有效），先原樣保留屬性，
 * 之後真的要做進場動畫再補。
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

        <div className="ab_list2 milestone-section" id="milestoneSection">
          <div className="title-wrap title-wrap_md d-lg-none d-block">
            <div className="h3_tit">計畫歷程</div>
          </div>

          <div className="axis-line" />
          <div className="indicator-pointer" />
          <div className="elevator-box">
            <img className="img-fluid d-block" src={withBasePath("/images/all/ab_logo.svg")} aria-hidden="true" alt="" />
          </div>

          <div className="fixed-left">
            <div className="title-wrap">
              <div className="h3_tit">計畫歷程</div>
            </div>

            <div className="year-fixed-display" id="bigYear">
              {MILESTONES[0].year}s
            </div>
          </div>

          <div className="right-viewport">
            <div className="history-list" id="historyList">
              {MILESTONES.map((milestone, index) => (
                <div className={`history-item${index === 0 ? " active" : ""}`} data-year={milestone.year} key={milestone.year}>
                  <h3 className="card-title">
                    {milestone.year} - <span>{milestone.title}</span>
                  </h3>
                  <ul className="card-list">
                    {milestone.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="s_round_6" aria-hidden="true">
            <img className="img-fluid d-block" src={withBasePath("/images/home/round_6.png")} alt="" />
          </div>
          <div className="s_round_3" aria-hidden="true">
            <img className="img-fluid d-block" src={withBasePath("/images/home/round_3.jpg")} alt="" />
          </div>
        </div>

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

          <div className="pic" data-aos="animate-svg">
            <img className="img-fluid" src={withBasePath("/images/about/taiwan-map.svg")} alt="台灣地圖" />
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
