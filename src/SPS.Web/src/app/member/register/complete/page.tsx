import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberDetailsForm from "@/components/member/MemberDetailsForm";

export const metadata: Metadata = {
  title: "會員註冊 - 完成註冊",
};

/**
 * 會員註冊 Step 4「完成註冊」，對應舊站 page/member/p03.html——
 * Step 3 填寫內容的唯讀檢視（所有欄位 disabled，帶入示範假資料），
 * 「確認送出」點下去彈出完成註冊 modal。
 *
 * 表單本體共用 [MemberDetailsForm](../../../../components/member/MemberDetailsForm.tsx)
 * 的 `mode="review"`。
 *
 * 2026-09-10：跟 Step3 一樣讀 `applicantType`／`role`／`tier`
 * query string（Step3「下一步」帶過來的），顯示同一組欄位——唯讀
 * 檢視要是跟 Step3 填的欄位對不起來（例如 Step3 藏起來的欄位這裡又
 * 冒出來），使用者會很困惑剛剛是不是漏填了什麼。
 */
export default async function MemberRegisterCompletePage({ searchParams }: PageProps<"/member/register/complete">) {
  const { applicantType: rawApplicantType, role: rawRole, tier: rawTier } = await searchParams;
  const applicantType = rawApplicantType === "individual" ? "individual" : "company";
  const role = rawRole === "demand" ? "demand" : "supply";
  const tier = rawTier === "excellent" ? "excellent" : "emerging";

  return (
    <>
      <BodyClass className="member register p02" />

      <div className="modal fade" id="staticmembership" data-bs-backdrop="static" data-bs-keyboard="false" tabIndex={-1} aria-labelledby="staticmembership" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h4>完成註冊</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close">
                X
              </button>
            </div>
            <div className="modal-body">
              <div className="txt editor"></div>
              <p className="text-center">恭喜您！已完成會員註冊程序。</p>

              <div className="card-footer d-flex justify-content-center">
                <Link className="btn-theme" href="/member/login" title="前往會員專區">
                  前往會員專區<i className="bi bi-chevron-right" aria-hidden="true"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <InnerPageShell title="完成註冊" breadcrumb={[{ label: "會員註冊", href: "/member/register" }, { label: "完成註冊" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={4} />
          <MemberDetailsForm
            mode="review"
            onSubmitHref="#"
            onSubmitLabel="確認送出"
            applicantType={applicantType}
            companyRole={role}
            tier={tier}
          />
        </div>
      </InnerPageShell>
    </>
  );
}
