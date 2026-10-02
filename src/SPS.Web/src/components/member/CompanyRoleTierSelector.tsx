"use client";

import { useState } from "react";
import MemberTypeCard from "@/components/member/MemberTypeCard";
import { COMPANY_ROLE_OPTIONS, SUPPLIER_TIER_QUESTIONS, SUPPLIER_TIER_RESULT_OPTIONS } from "@/lib/member-registration-data";

export type CompanyRole = "demand" | "supply";
export type SupplierTier = "excellent" | "emerging";

export interface CompanyRoleTierSelection {
  role: CompanyRole;
  /** 只有 `role === "supply"` 才有值 */
  tier: SupplierTier | null;
}

/**
 * 積木元件：「選需求端或供給端」＋（選供給端時）3 題問答導向卓越/
 * 新興，從 `MemberTypeSelector.tsx`（註冊 Step2）抽出來的共用邏輯。
 *
 * 2026-10-02 抽出來的原因：會員中心「權益升級」面板（`UpgradePanel.tsx`）
 * 需要一模一樣的「需求/供給 + 3 題問答」流程——個人會員升級成企業
 * 會員時，依官方《會員申請須知》走的是跟全新註冊同一套審查分支
 * （見 `docs/改版規劃.md`），不是另外設計一套，兩邊共用同一份邏輯
 * 才不會日後各自修出不一致的判斷規則。
 *
 * 透過單一 `onChange` 回報目前「已經確定」的選擇：選了需求端，或
 * 供給端 3 題問答送出後，才會呼叫一次 `onChange`；在那之前（還沒選
 * 需求/供給、供給端問答還沒送出）呼叫 `onChange(null)`，呼叫端用這個
 * 當作「這個區塊還沒填完」的訊號（例如拿來擋住下一步按鈕）。
 */
export default function CompanyRoleTierSelector({
  onChange,
}: {
  onChange: (selection: CompanyRoleTierSelection | null) => void;
}) {
  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null);
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>({});
  const [submitted, setSubmitted] = useState(false);

  const isSupplier = companyRole === "supply";
  const allAnswered = SUPPLIER_TIER_QUESTIONS.every((q) => answers[q.id] !== undefined);
  const tier: SupplierTier | null = isSupplier && submitted ? (Object.values(answers).some(Boolean) ? "excellent" : "emerging") : null;

  function handleCompanyRoleChange(value: string) {
    const role = value as CompanyRole;
    setCompanyRole(role);
    setAnswers({});
    setSubmitted(false);
    if (role === "demand") {
      onChange({ role: "demand", tier: null });
    } else {
      onChange(null);
    }
  }

  function answerQuestion(id: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
    onChange(null);
  }

  function handleTierSubmit() {
    setSubmitted(true);
    const resolvedTier: SupplierTier = Object.values(answers).some(Boolean) ? "excellent" : "emerging";
    onChange({ role: "supply", tier: resolvedTier });
  }

  function handleTierReset() {
    setSubmitted(false);
    onChange(null);
  }

  return (
    <>
      <h3 className="mb-4 me_sho mt-4">請選擇需求端或供給端</h3>
      <fieldset className="menb_type_fieldset border-0 p-0 m-0">
        <div className="d-flex flex-wrap menb_type gap-3">
          {COMPANY_ROLE_OPTIONS.map((option) => (
            <MemberTypeCard key={option.id} option={option} checked={companyRole === option.value} onChange={handleCompanyRoleChange} name="company_role" />
          ))}
        </div>
      </fieldset>

      {isSupplier && !submitted && (
        <>
          <h3 className="mb-4 me_sho mt-4">請確認以下資格</h3>
          <div className="tier-question-panel">
            {SUPPLIER_TIER_QUESTIONS.map((question, index) => {
              const answer = answers[question.id];
              return (
                <div className="d-flex justify-content-between align-items-center mb-3" key={question.id}>
                  <div>
                    <div>{question.label}</div>
                    <a href={question.noteUrl} target="_blank" rel="noopener noreferrer" className="small" title={`前往${question.noteLabel}（另開視窗）`}>
                      註{index + 1}：{question.noteLabel}
                      <i className="bi bi-box-arrow-up-right ms-1" aria-hidden="true"></i>
                    </a>
                  </div>
                  <div className="d-flex gap-2 flex-shrink-0 ms-3">
                    <button
                      type="button"
                      className={answer === true ? "tier-answer-btn active" : "tier-answer-btn"}
                      aria-pressed={answer === true}
                      onClick={() => answerQuestion(question.id, true)}
                    >
                      <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
                      <span>是</span>
                    </button>
                    <button
                      type="button"
                      className={answer === false ? "tier-answer-btn active" : "tier-answer-btn"}
                      aria-pressed={answer === false}
                      onClick={() => answerQuestion(question.id, false)}
                    >
                      <i className="bi bi-x-circle-fill me-1" aria-hidden="true"></i>
                      <span>否</span>
                    </button>
                  </div>
                </div>
              );
            })}
            <div className="d-flex justify-content-end mt-5">
              <button type="button" className="tier-submit-btn" disabled={!allAnswered} onClick={handleTierSubmit}>
                <span>送出</span>
                <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {tier && (
        <>
          <div className="d-flex flex-wrap menb_type gap-3 mt-4">
            <MemberTypeCard option={SUPPLIER_TIER_RESULT_OPTIONS[tier]} checked readOnly />
          </div>
          <button type="button" className="tier-reset-btn mt-3" onClick={handleTierReset}>
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
            重新確認資格
          </button>
        </>
      )}
    </>
  );
}
