import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberDetailsForm from "@/components/member/MemberDetailsForm";
import { applicationsApi } from "@/lib/api/applications";
import type { ApplicationResponse } from "@/types/application";

export const metadata: Metadata = {
  title: "會員註冊 - 完成註冊",
};

/**
 * 會員註冊 Step 4「完成註冊」，對應舊站 page/member/p03.html——
 * Step 3 填寫內容的唯讀檢視，「確認送出」點下去送出申請並彈出完成
 * 註冊 modal。
 *
 * 表單本體共用 [MemberDetailsForm](../../../../components/member/MemberDetailsForm.tsx)
 * 的 `mode="review"`。
 *
 * 2026-10-01：這裡原本（連同 `MemberDetailsForm` 的 `mode="review"`）
 * 是整段寫死的示範假資料，跟 Step3 使用者實際填了什麼完全無關——
 * 現在 Step3 送出表單時會先呼叫 `POST /api/Applications` 建立草稿，
 * 並把 `applicationId` 帶在導來這裡的網址上；這個頁面（Server
 * Component）用這個 id 向後端查真正的申請資料，傳給
 * `MemberDetailsForm` 顯示使用者剛剛實際填寫的內容。沒有
 * `applicationId`（例如直接貼網址進來、或 Step3 根本還沒送出）就
 * 顯示「找不到申請資料」並導回 Step3，不會再退回顯示假資料。
 *
 * `applicantType`／`role`／`tier` query string 還是跟 Step3 一樣原封
 * 不動轉傳，用來決定這個唯讀檢視要顯示哪些欄位區塊（跟真正送出的
 * `application.applicantType` 等後端欄位是分開的兩件事——前者控制
 * UI 顯示範圍，後者是這張申請在後端真正的分類）。
 */
export default async function MemberRegisterCompletePage({ searchParams }: PageProps<"/member/register/complete">) {
  const { applicantType: rawApplicantType, role: rawRole, tier: rawTier, applicationId } = await searchParams;
  const applicantType = rawApplicantType === "individual" ? "individual" : "company";
  const role = rawRole === "demand" ? "demand" : "supply";
  const tier = rawTier === "excellent" ? "excellent" : "emerging";

  let application: ApplicationResponse | undefined;
  let loadError = false;
  const id = typeof applicationId === "string" ? applicationId : undefined;
  if (id) {
    try {
      application = await applicationsApi.getById(id);
    } catch {
      loadError = true;
    }
  }

  if (!id || loadError || !application) {
    return (
      <InnerPageShell title="完成註冊" breadcrumb={[{ label: "會員註冊", href: "/member/register" }, { label: "完成註冊" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={4} />
          <p className="text-center py-5">找不到申請資料，請重新填寫會員資料。</p>
          <div className="card-footer d-flex justify-content-center">
            <Link className="btn-theme" href="/member/register/info" title="回填寫資料">
              回填寫資料<i className="bi bi-chevron-right" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
      </InnerPageShell>
    );
  }

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
            onSubmitLabel="確認送出"
            applicantType={applicantType}
            companyRole={role}
            tier={tier}
            application={application}
          />
        </div>
      </InnerPageShell>
    </>
  );
}
