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
 */
export default function MemberRegisterInfoPage() {
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
          <MemberDetailsForm mode="edit" onSubmitHref="/member/register/complete" onSubmitLabel="同意，下一步" />
        </div>
      </InnerPageShell>
    </>
  );
}
