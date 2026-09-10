"use client";

import { useState } from "react";
import Link from "next/link";
import MemberTypeCard from "@/components/member/MemberTypeCard";
import CompareTable from "@/components/member/CompareTable";
import { APPLICANT_TYPE_OPTIONS, COMPANY_ROLE_OPTIONS, SUPPLIER_TIER_QUESTIONS, SUPPLIER_TIER_RESULT_OPTIONS } from "@/lib/member-registration-data";

type ApplicantType = "individual" | "company";
type CompanyRole = "demand" | "supply";

/**
 * 積木元件：會員註冊 Step2「請選擇會員類型」，對應舊站 p01.html——
 * 2026-09-10 對照官方《會員申請須知》重新設計，說明見
 * `member-registration-data.ts` 開頭那段註解。
 *
 * 改成 client component 是因為這是一個會依選擇動態展開的分支流程
 * （選企業會員才出現需求/供給選項；選供給端才出現 3 題問答），原本
 * 純 CSS 單選卡（`:has(:checked)`）做不到「選了才顯示下一組選項」
 * 這件事，一定要有 JS state。
 *
 * 「下一步」連結的網址帶上這裡選擇的結果（`applicantType`／`role`／
 * `tier`），Step3（`/member/register/info`）靠這個 query string 決定
 * 要顯示哪些欄位/上傳項目——沒有用 sessionStorage 或跨頁 Context，
 * 是因為現有的四步驟本來就是各自獨立的路由（可以重新整理、可以
 * 直接分享網址），query string 是最不用改動這個既有架構的做法。
 */
export default function MemberTypeSelector() {
  const [applicantType, setApplicantType] = useState<ApplicantType | null>(null);
  const [companyRole, setCompanyRole] = useState<CompanyRole | null>(null);
  // `undefined` = 這題還沒回答；`是否...？` 這種問法需要明確的是/否
  // 回答，不能用「沒勾＝否」這種隱含預設值去矇混過去。
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>({});
  // 2026-09-10 使用者要求 3 題問答要有明確的「送出」動作，不要每點
  // 一下問卷就立刻改判定結果——`submitted` 代表已經按過送出，之後
  // 才顯示卓越/新興的結果卡；答案在送出後又被改動的話要重新送出
  // （見 `answerQuestion`），避免顯示跟目前選擇狀態對不起來的舊結果。
  const [submitted, setSubmitted] = useState(false);

  const isSupplier = applicantType === "company" && companyRole === "supply";
  const allAnswered = SUPPLIER_TIER_QUESTIONS.every((q) => answers[q.id] !== undefined);
  const tier = isSupplier && submitted ? (Object.values(answers).some(Boolean) ? "excellent" : "emerging") : null;
  const isValid = applicantType === "individual" || (applicantType === "company" && companyRole === "demand") || (isSupplier && submitted);

  const nextHref = (() => {
    const params = new URLSearchParams();
    if (applicantType) params.set("applicantType", applicantType);
    if (applicantType === "company" && companyRole) params.set("role", companyRole);
    if (tier) params.set("tier", tier);
    const qs = params.toString();
    return qs ? `/member/register/info?${qs}` : "/member/register/info";
  })();

  function handleApplicantTypeChange(value: string) {
    setApplicantType(value as ApplicantType);
    setCompanyRole(null);
    setAnswers({});
    setSubmitted(false);
  }

  function handleCompanyRoleChange(value: string) {
    setCompanyRole(value as CompanyRole);
    setAnswers({});
    setSubmitted(false);
  }

  function answerQuestion(id: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  }

  return (
    <>
      <h3 className="mb-4 me_sho">請選擇會員類型</h3>
      <fieldset className="menb_type_fieldset border-0 p-0 m-0">
        <div className="d-flex flex-wrap menb_type gap-3">
          {APPLICANT_TYPE_OPTIONS.map((option) => (
            <MemberTypeCard
              key={option.id}
              option={option}
              checked={applicantType === option.value}
              onChange={handleApplicantTypeChange}
              name="applicant_type"
            />
          ))}
        </div>
      </fieldset>

      {applicantType === "company" && (
        <>
          <h3 className="mb-4 me_sho mt-4">請選擇需求端或供給端</h3>
          <fieldset className="menb_type_fieldset border-0 p-0 m-0">
            <div className="d-flex flex-wrap menb_type gap-3">
              {COMPANY_ROLE_OPTIONS.map((option) => (
                <MemberTypeCard
                  key={option.id}
                  option={option}
                  checked={companyRole === option.value}
                  onChange={handleCompanyRoleChange}
                  name="company_role"
                />
              ))}
            </div>
          </fieldset>
        </>
      )}

      {isSupplier && !submitted && (
        <>
          <h3 className="mb-4 me_sho mt-4">請確認以下資格（符合任一項即可）</h3>
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
            {/* 2026-09-10 使用者要求送出按鈕靠右下、跟上面問題間距拉大 */}
            <div className="d-flex justify-content-end mt-5">
              <button type="button" className="tier-submit-btn" disabled={!allAnswered} onClick={() => setSubmitted(true)}>
                <span>送出</span>
                <i className="bi bi-arrow-right ms-1" aria-hidden="true"></i>
              </button>
            </div>
          </div>
        </>
      )}

      {/* 2026-09-10 使用者要求送出後把上面的問題收起來，只留結果卡——
          「重新確認」讓使用者還是能改答案，不會被卡死在結果畫面。 */}
      {tier && (
        <>
          <div className="d-flex flex-wrap menb_type gap-3 mt-4">
            <MemberTypeCard option={SUPPLIER_TIER_RESULT_OPTIONS[tier]} checked readOnly />
          </div>
          <button type="button" className="tier-reset-btn mt-3" onClick={() => setSubmitted(false)}>
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>
            重新確認資格
          </button>
        </>
      )}

      <h3 className="mb-4 me_sho mt-md-5 mt-4">會員權益比較表</h3>
      <CompareTable />

      <div className="card-footer d-flex justify-content-between">
        <Link className="btn-outline-dark" href="/member/register" title="上一步">
          <i className="bi bi-chevron-left" aria-hidden="true"></i>上一步
        </Link>
        {isValid ? (
          <Link className="btn-theme" href={nextHref} title="同意，下一步">
            同意，下一步<i className="bi bi-chevron-right" aria-hidden="true"></i>
          </Link>
        ) : (
          <span className="btn-theme" aria-disabled="true" style={{ opacity: 0.5, pointerEvents: "none" }}>
            同意，下一步<i className="bi bi-chevron-right" aria-hidden="true"></i>
          </span>
        )}
      </div>
    </>
  );
}
