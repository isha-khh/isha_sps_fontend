"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

const SCOPE_OPTIONS = ["感測端點", "系統部署", "通訊方式", "作業輔助", "模擬決策", "未指定"];

/**
 * 積木元件：企業名錄詳情頁「取得聯繫窗口」彈窗，對應設計稿
 * `page/matching/show.html` 的 `#staticmembership`——勾選想了解的
 * 智慧技術範疇（可複選）後按「送出」，展開顯示聯絡人資訊。
 *
 * 對話框開關沿用 `Modal.tsx`（bootstrap `data-bs-toggle="modal"`，
 * 見那支檔案的說明）；「送出後展開聯絡資訊」這段設計稿原本另外寫了
 * 一小段 jQuery slideDown，這裡改成 React state 控制顯示/隱藏——跟
 * `TechAttributeSelector`／`MatchingSearchBar` 同樣的理由，全新元件
 * 沒有舊頁面依賴這段 jQuery，直接用這個專案新元件慣用的寫法。
 *
 * 目前「送出」只是顯示畫面上寫死的聯絡人資訊，沒有真的送出勾選結果
 * 到任何地方——這頁本來就還在「先把畫面做出來」的階段，之後接資料時
 * 才需要決定這裡要送去哪支 API。
 */
export default function EnterpriseContactModal({ id, contactName, contactPhone }: { id: string; contactName: string; contactPhone: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({ 感測端點: true });
  const [revealed, setRevealed] = useState(false);

  function toggle(option: string) {
    setChecked((prev) => ({ ...prev, [option]: !prev[option] }));
  }

  return (
    <Modal id={id} title="取得聯繫窗口">
      <p>為了提供您更精準的服務，請勾選您想了解的智慧技術 (可複選)</p>

      <div className="project_fx d-flex">
        {SCOPE_OPTIONS.map((option) => {
          const checkboxId = `${id}-scope-${option}`;
          return (
            <div className="form-check" key={option}>
              <input
                className="form-check-input"
                type="checkbox"
                id={checkboxId}
                checked={Boolean(checked[option])}
                onChange={() => toggle(option)}
              />
              <label className="form-check-label" htmlFor={checkboxId}>
                {option}
              </label>
            </div>
          );
        })}
      </div>

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <button
          type="button"
          className="btn-theme mat_Send"
          aria-expanded={revealed}
          aria-controls={`${id}-contact-info`}
          onClick={() => setRevealed(true)}
        >
          送出
        </button>
      </div>

      <div className="co_m_botom" id={`${id}-contact-info`} style={revealed ? undefined : { display: "none" }}>
        <h4>連系窗口資訊</h4>
        <ul className="nav">
          <li>
            <span className="label">
              <i className="bi bi-person"></i>聯絡人：
            </span>
            <p className="mb-0">{contactName}</p>
          </li>
          <li>
            <span className="label">
              <i className="bi bi-telephone me-1"></i>電話：
            </span>
            <a href={`tel:${contactPhone}`} title={`撥打電話至 ${contactPhone}`}>
              {contactPhone}
            </a>
          </li>
        </ul>
      </div>
    </Modal>
  );
}
