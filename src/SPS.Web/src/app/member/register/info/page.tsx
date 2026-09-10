import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberDetailsForm from "@/components/member/MemberDetailsForm";

export const metadata: Metadata = {
  title: "會員註冊 - 填寫資料",
};

/**
 * 會員註冊 Step 3「填寫資料」，對應舊站 page/member/p02.html。
 *
 * 表單本體在 [MemberDetailsForm](../../../../components/member/MemberDetailsForm.tsx)
 * （跟 Step 4 唯讀檢視共用），這裡只負責外層版型＋「個人資料同意書」
 * 彈跳視窗（舊站原始內容就是空的說明文字，不是我們漏做）。
 *
 * 2026-09-10：`applicantType`／`role`／`tier` 是 Step2
 * （`MemberTypeSelector.tsx`）算完會員類型後帶過來的 query string，
 * 原封不動轉傳給 `MemberDetailsForm` 決定要顯示哪些欄位；也原封不動
 * 帶到「下一步」連去的 Step4（`/member/register/complete`），這樣
 * Step4 唯讀檢視才會顯示跟 Step3 同一組欄位，不會 Step3 藏起來的
 * 欄位 Step4 又冒出來。
 */
export default async function MemberRegisterInfoPage({ searchParams }: PageProps<"/member/register/info">) {
  const { applicantType: rawApplicantType, role: rawRole, tier: rawTier } = await searchParams;
  const applicantType = rawApplicantType === "individual" ? "individual" : "company";
  const role = rawRole === "demand" ? "demand" : "supply";
  const tier = rawTier === "excellent" ? "excellent" : "emerging";

  const qs = new URLSearchParams();
  qs.set("applicantType", applicantType);
  if (applicantType === "company") qs.set("role", role);
  if (applicantType === "company" && role === "supply") qs.set("tier", tier);
  const nextHref = `/member/register/complete?${qs.toString()}`;

  return (
    <>
      <BodyClass className="member register p02" />

      <div className="modal fade" id="staticmembership" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby="staticmembership" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>個人資料同意書</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="txt editor"></div>
              <p>個人資料同意書個人資料同意書個人資料同意書個人資料同意書個人資料同意書</p>
            </div>
          </div>
        </div>
      </div>

      <InnerPageShell title="填寫資料" breadcrumb={[{ label: "會員註冊", href: "/member/register" }, { label: "填寫資料" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={3} />
          <MemberDetailsForm
            mode="edit"
            onSubmitHref={nextHref}
            onSubmitLabel="同意，下一步"
            applicantType={applicantType}
            companyRole={role}
            tier={tier}
          />
        </div>
      </InnerPageShell>
    </>
  );
}
