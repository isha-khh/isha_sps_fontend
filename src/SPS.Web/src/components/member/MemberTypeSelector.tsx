"use client";

import { useState } from "react";
import Link from "next/link";
import MemberTypeCard from "@/components/member/MemberTypeCard";
import CompareTable from "@/components/member/CompareTable";
import CompanyRoleTierSelector, { type CompanyRoleTierSelection } from "@/components/member/CompanyRoleTierSelector";
import { APPLICANT_TYPE_OPTIONS } from "@/lib/member-registration-data";

type ApplicantType = "individual" | "company";

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
 * 2026-10-02：「需求/供給 + 3 題問答」那段抽到
 * `CompanyRoleTierSelector.tsx` 共用——會員中心「權益升級」面板
 * （個人會員升級成企業會員）需要一模一樣的分支邏輯，見那支檔案的
 * 說明。這裡只保留「個人／企業」的第一層選擇，以及把子元件回報的
 * 選擇結果組進「下一步」的網址。
 *
 * 「下一步」連結的網址帶上這裡選擇的結果（`applicantType`／`role`／
 * `tier`），Step3（`/member/register/info`）靠這個 query string 決定
 * 要顯示哪些欄位/上傳項目——沒有用 sessionStorage 或跨頁 Context，
 * 是因為現有的四步驟本來就是各自獨立的路由（可以重新整理、可以
 * 直接分享網址），query string 是最不用改動這個既有架構的做法。
 */
export default function MemberTypeSelector() {
  const [applicantType, setApplicantType] = useState<ApplicantType | null>(null);
  const [companyRoleTier, setCompanyRoleTier] = useState<CompanyRoleTierSelection | null>(null);

  const isValid = applicantType === "individual" || (applicantType === "company" && companyRoleTier !== null);

  const nextHref = (() => {
    const params = new URLSearchParams();
    if (applicantType) params.set("applicantType", applicantType);
    if (applicantType === "company" && companyRoleTier) {
      params.set("role", companyRoleTier.role);
      if (companyRoleTier.tier) params.set("tier", companyRoleTier.tier);
    }
    const qs = params.toString();
    return qs ? `/member/register/info?${qs}` : "/member/register/info";
  })();

  function handleApplicantTypeChange(value: string) {
    setApplicantType(value as ApplicantType);
    setCompanyRoleTier(null);
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

      {applicantType === "company" && <CompanyRoleTierSelector onChange={setCompanyRoleTier} />}

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
