import { Fragment } from "react";
import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import { withBasePath } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "XR",
};

const TRADITIONAL_PAIN_POINTS = [
  { icon: "bi-book", text: "課堂講授為主，互動性不足" },
  { icon: "bi-box", text: "缺乏真實空間感與臨場體驗" },
  { icon: "bi-exclamation-triangle", text: "難模擬異常事故與緊急狀況" },
  { icon: "bi-currency-dollar", text: "實習資源受限，訓練成本高" },
];

const XR_ADVANTAGES = [
  { icon: "bi-headset-vr", text: "沉浸互動體驗，提升學習投入" },
  { icon: "bi-box", text: "高度真場景演練，擬真度高" },
  { icon: "bi-arrow-repeat", text: "可重複操作試錯，強化學習成效" },
  { icon: "bi-shield-fill-exclamation", text: "強化危害辨識與應變能力" },
];

const TRAINING_SCENARIOS = [
  { icon: "/images/xr/xr_list2_icon1.svg", label: "作案許可與管線隔離" },
  { icon: "/images/xr/xr_list2_icon2.svg", label: "危害辨識" },
  { icon: "/images/xr/xr_list2_icon3.svg", label: "切割前設備確認" },
  { icon: "/images/xr/xr_list2_icon4.svg", label: "氣體偵測" },
  { icon: "/images/xr/xr_list2_icon5.svg", label: "管線切割" },
  { icon: "/images/xr/xr_list2_icon6.svg", label: "焊接作業" },
  { icon: "/images/xr/xr_list2_icon7.svg", label: "完工確認" },
];

const TRAINING_STEPS = [
  { icon: "/images/xr/xr_list2_icon1.svg", title: "作業許可與管線隔離", desc: "申請作業許可並執行管線隔離，確認作業範圍與相關安全措施。" },
  { icon: "/images/xr/xr_list2_icon9.svg", title: "作業前現場辨識", desc: "辨識現場環境、潛在危害與逃生動線，確認個人防護具與作業條件。" },
  { icon: "/images/xr/xr_list2_icon3.svg", title: "切割前設備確認", desc: "確認氣源、設備與閥位狀態，確保設備安全並可執行作業。" },
  { icon: "/images/xr/xr_list2_icon5.svg", title: "管線切割", desc: "依程序執行管線切割，確保火花控制並防止可燃氣體引燃。" },
  { icon: "/images/xr/xr_list2_icon6.svg", title: "焊接前確認、防火毯設置與焊接", desc: "檢查焊接環境與防火設置，執行焊接並監控焊接品質與火花飛散。" },
  { icon: "/images/xr/xr_list2_icon8.svg", title: "完工後殘火確認與成效紀錄", desc: "進行殘火確認與環境複檢，記錄訓練成效與改善建議。" },
];

const TRAINING_OUTCOMES = [
  { icon: "/images/xr/xr_list2_icon10.svg", title: "操作行為紀錄", desc: "系統紀錄操作過程與關鍵行為，提供行為分析與學習回饋。" },
  { icon: "/images/xr/xr_list2_icon11.svg", title: "風險趨勢分析", desc: "自動彙整風險事件與錯誤類型，掌握風險趨勢與改善重點。" },
  { icon: "/images/xr/xr_list2_icon12.svg", title: "訓練結果量化", desc: "量化評估學習成果與技能表現，建立個人與團隊成效指標。" },
  { icon: "/images/xr/xr_list2_icon13.svg", title: "持續改善依據", desc: "依據數據分析結果，優化教材與作業流程，持續提升安全績效。" },
];

/**
 * XR 訓練介紹頁，對應設計稿 page/talent/xr.html——純行銷/說明用的
 * 靜態頁，沒有列表也沒有後端資料，跟 talent 列表頁是同一組（人才培育）
 * 底下的兩個平行頁面，不是 talent 的詳情頁。
 */
export default function TalentXrPage() {
  return (
    <>
      <BodyClass className="talent xr" />
      <InnerPageShell
        title="XR"
        breadcrumb={[{ label: "人才培訓", href: "/talent" }, { label: "XR" }]}
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
        <h3 className="xr_h">
          <span>為什麼需要XR</span>
        </h3>
        <div className="xr_list1 mb-md-5 mb-4">
          <div className="d-flex">
            <div className="xr_le">
              <h4>傳統訓練痛點</h4>
              <ul className="nav d-block">
                {TRADITIONAL_PAIN_POINTS.map((item) => (
                  <li key={item.text}>
                    <i className={`bi ${item.icon}`} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="xr_tri">
              <img className="img-fluid d-block" src={withBasePath("/images/all/xr_tri.svg")} aria-hidden="true" alt="" />
            </div>
            <div className="xr_ri">
              <h4>XR訓練優勢</h4>
              <ul className="nav d-block">
                {XR_ADVANTAGES.map((item) => (
                  <li key={item.text}>
                    <i className={`bi ${item.icon}`} />
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <h3 className="xr_h">
          <span>XR訓練情境</span>
        </h3>
        <div className="xr_list2 mb-md-5 mb-4">
          <ul className="nav">
            {TRAINING_SCENARIOS.map((item, index) => (
              <Fragment key={item.label}>
                <li>
                  <img className="img-fluid d-block img-small mx-auto" src={withBasePath(item.icon)} aria-hidden="true" alt="" />
                  <span>{item.label}</span>
                </li>
                {index < TRAINING_SCENARIOS.length - 1 && (
                  <li className="xr_tri">
                    <img className="img-fluid d-block" src={withBasePath("/images/all/xr_tri.svg")} aria-hidden="true" alt="" />
                  </li>
                )}
              </Fragment>
            ))}
          </ul>
        </div>

        <h3 className="xr_h">
          <span>六階段沉浸式訓練流程</span>
        </h3>
        <div className="xr_list3 mb-md-5 mb-4">
          <ul className="nav">
            {TRAINING_STEPS.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div className="pic">
                  <img className="img-fluid d-block img-small mx-auto" src={withBasePath(step.icon)} aria-hidden="true" alt="" />
                </div>
                <div className="tit">
                  <h4>{step.title}</h4>
                  <p className="mb-0">{step.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="xr_h">
          <span>訓練成效與智慧管理</span>
        </h3>
        <div className="xr_list4 mb-md-5 mb-4">
          <ul className="nav">
            {TRAINING_OUTCOMES.map((item) => (
              <li key={item.title}>
                <div className="pic mb-3">
                  <img className="img-fluid d-block img-small mx-auto" src={withBasePath(item.icon)} aria-hidden="true" alt="" />
                </div>
                <div className="tit">
                  <h4 className="blue">{item.title}</h4>
                  <p className="mb-0">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <h3 className="xr_h">
          <span>使用須知與下載</span>
        </h3>
        <div className="xr_list1 xr_list5 mb-md-5 mb-4">
          <div className="d-flex">
            <div className="xr_le">
              <h4>使用須知</h4>
              <ul className="nav d-block">
                <li>
                  <i className="bi bi-laptop" />
                  <span>建議使用具備 NVIDIA GeForce RTX 3060 或以上之電腦</span>
                </li>
                <li>
                  <i className="bi bi-headset-vr" />
                  <span>建議搭配 VR 頭盔使用，以獲得最佳沉浸式訓練體驗</span>
                </li>
                <li>
                  <i className="bi bi-wifi" />
                  <span>確保網路穩定，建議於安靜環境中進行訓練</span>
                </li>
              </ul>
            </div>
            <div className="xr_ri">
              <h4>下載區</h4>
              <div className="xr_cloud">
                <i className="bi bi-cloud-arrow-down" />
              </div>
              <ul className="nav d-block">
                <li>
                  <span>
                    <b>下載 XR 訓練模組</b>安裝後即可開始體驗訓練內容
                  </span>
                </li>
                <li>
                  <a href="#" title="立即下載(另開視窗)" className="more_x" target="_blank" rel="noopener noreferrer">
                    <span>立即下載</span> <i className="bi bi-arrow-right" aria-hidden="true" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
