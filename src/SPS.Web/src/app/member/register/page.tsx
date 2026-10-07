import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberConsentGate from "@/components/member/MemberConsentGate";
import PersonalDataConsentNotice from "@/components/member/PersonalDataConsentNotice";
import RegisterDownloadList from "@/components/member/RegisterDownloadList";
import { fetchDownloadResources } from "@/lib/api.server";
import RedirectIfLoggedIn from "@/components/member/RedirectIfLoggedIn";

export const metadata: Metadata = {
  title: "會員註冊",
};

/**
 * 會員註冊 Step 1「使用條款」，對應舊站 page/member/register.html。
 *
 * 這是註冊 4 步驟流程（使用條款→帳號設定→填寫資料→完成註冊）的第一
 * 步，`StepProgress` 顯示目前進度。內容是個資蒐集告知事項（純靜態，
 * 留在這支 server component）＋兩個同意勾選框＋底部按鈕
 * （`MemberConsentGate.tsx`，client component）。
 *
 * 2026-09-10 使用者回報 bug 後補上驗證：兩個勾選框原本沒勾選也能
 * 直接按「同意，下一步」跳到 Step2，這是 git 歷史那版註解已經記著
 * 的已知缺口，這次補上，說明見 `MemberConsentGate.tsx`。
 */
export default async function MemberRegisterPage() {
  const resources = await fetchDownloadResources();

  return (
    <>
      <BodyClass className="member register" />
      <RedirectIfLoggedIn />
      <InnerPageShell title="會員註冊" breadcrumb={[{ label: "會員註冊" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={1} />

          <h3>蒐集個人資料告知事項</h3>
          <div className="txt editor mb-md-5 mb-4">
            <PersonalDataConsentNotice />
          </div>

          <RegisterDownloadList resources={resources} keys={["register-guide", "register-consent", "register-application", "register-review"]} />

          <MemberConsentGate />
        </div>
      </InnerPageShell>
    </>
  );
}
