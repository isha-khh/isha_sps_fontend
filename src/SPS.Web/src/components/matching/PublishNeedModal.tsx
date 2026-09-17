"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import TechAttributeSelector from "@/components/matching/TechAttributeSelector";
import { APPLICATION_SCENARIOS, APPLICATION_SCOPES, TECH_ATTRIBUTE_GROUPS } from "@/lib/matching-data";

/**
 * 積木元件：「媒合對接」列表頁「我要刊登」彈窗，對應設計稿
 * `page/matching/index.html` 的 `#staticmembership2`——需求標題／需求
 * 內容兩個文字欄位，加上 `page/matching/_uc/publish_s.html`（應用情境／
 * 應用範疇／智慧技術，可多選）。
 *
 * 這三組多選標籤跟企業名錄篩選面板、`MatchingSearchBar` 是同一份分類
 * 資料（`matching-data.ts`），故意共用而不是照 `member-registration-data.ts`
 * 那份會員註冊表單的版本另外接——雖然選項文字剛好大致對得上，但這裡
 * 是「媒合對接」模組自己的資料來源，跟企業/會員註冊資料模型無關，混用
 * 兩邊會讓之後其中一邊改分類時忘記同步更新另一邊。
 *
 * 這三組 checkbox 外面包一層 `.publish_s`：CSS 裡
 * `.matching .publish_s .project_fx .form-check` 專門把每個選項
 * 恢復成單純「checkbox+文字」（`background-color:unset; border-radius:0;
 * padding:0`），沒有這層外殼，`.form-check` 會吃到別處預設的卡片/格線
 * 樣式（背景色、邊框、3 欄網格），跟設計稿 `publish_s.html` 原本的
 * 平鋪版面對不起來。
 */
export default function PublishNeedModal({ id }: { id: string }) {
  const [checkedScenarios, setCheckedScenarios] = useState<Record<string, boolean>>({});
  const [checkedScopes, setCheckedScopes] = useState<Record<string, boolean>>({});
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function toggle(setter: typeof setCheckedScenarios, value: string) {
    setter((prev) => ({ ...prev, [value]: !prev[value] }));
  }

  return (
    <Modal id={id} title="我要刊登">
      <div className="form-group">
        <label className="mb-2">需求標題</label>
        <input type="text" className="form-control" title="請輸入需求標題" placeholder="請輸入需求標題" required aria-required="true" />
      </div>

      <div className="form-group">
        <label className="mb-2">需求內容</label>
        <textarea className="form-control" rows={5} />
      </div>

      <div className="publish_s">
        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>應用情境(可多選)
          </label>
          <div className="project_fx project_three d-flex flex-wrap">
            {APPLICATION_SCENARIOS.map((scenario) => {
              const checkboxId = `${id}-scenario-${scenario}`;
              return (
                <div className="form-check" key={scenario}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={checkboxId}
                    checked={Boolean(checkedScenarios[scenario])}
                    onChange={() => toggle(setCheckedScenarios, scenario)}
                  />
                  <label className="form-check-label" htmlFor={checkboxId}>
                    {scenario}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>應用範疇(可多選)
          </label>
          <div className="project_fx d-flex flex-wrap">
            {APPLICATION_SCOPES.map((scope) => {
              const checkboxId = `${id}-scope-${scope}`;
              return (
                <div className="form-check" key={scope}>
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={checkboxId}
                    checked={Boolean(checkedScopes[scope])}
                    onChange={() => toggle(setCheckedScopes, scope)}
                  />
                  <label className="form-check-label" htmlFor={checkboxId}>
                    {scope}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        <div className="menb_inp_tit form-group w-100">
          <label className="mb-2">
            <span className="red me-1">*</span>智慧技術(可多選)
          </label>
          <TechAttributeSelector groups={TECH_ATTRIBUTE_GROUPS} name={`${id}-tech`} variant="checkboxes" />
        </div>
      </div>

      <div className="Disclaimer">
        <h5>免責聲明：</h5>
        <p>
          本人／本單位於「智慧工安技術產業資訊暨媒合平台」（以下簡稱本平台）刊登需求文章前，已詳閱並同意：本平台僅提供需求資訊刊載、交流及媒合機會，不參與使用者與任何第三人間之洽談、報價、簽約、付款、交付、驗收、保固或其他合作事項，亦非任何一方之代理人、保證人或契約當事人。刊登者應確保所提供之資料真實、完整、合法，且未侵害他人權益，並對刊登內容自行負責；本平台不保證刊登資訊、媒合對象、技術、產品或服務之正確性、品質、安全性、適用性、履約能力或媒合成果，使用者於進行合作前，應自行查證、評估風險並議定相關契約。因使用者間後續接洽、交易、合作、履約或爭議所生之損害、費用及法律責任，應由相關當事人自行處理及負擔。本平台如發現刊登內容涉及違法、不實、侵權、違反平台規範或其他不宜公開之情形，得要求刊登者修正，或暫停、拒絕刊登及刪除相關內容。
        </p>
      </div>

      <div className="peer d-flex mb-3 mt-4">
        <label className="relative">
          <input
            type="checkbox"
            title="同意免責聲明及相關解方將同步信件及通知予使用者"
            className="form-check-input peer me-1"
            checked={agreed}
            onChange={() => setAgreed((prev) => !prev)}
          />
          <span>同意免責聲明及相關解方將同步信件及通知予使用者</span>
        </label>
      </div>

      {submitted && <p className="text-success mb-3">已收到您的刊登需求，將於審核後上架。</p>}

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <button type="button" className="btn-theme mat_Send" onClick={() => setSubmitted(true)}>
          刊登
        </button>
      </div>
    </Modal>
  );
}
