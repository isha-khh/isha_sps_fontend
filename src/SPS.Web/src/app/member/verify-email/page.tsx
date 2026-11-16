import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import EmailVerifyForm from "@/components/member/EmailVerifyForm";

export const metadata: Metadata = {
  title: "驗證電子信箱",
};

/**
 * 驗證電子信箱：登入（密碼或 Passkey）後，若會員的信箱還沒驗證就會被導來這一頁，
 * 會員中心偵測到未驗證也會導來。表單在 client component `EmailVerifyForm`。
 */
export default function MemberVerifyEmailPage() {
  return (
    <>
      <BodyClass className="member login forgot" />
      <InnerPageShell title="驗證電子信箱" breadcrumb={[{ label: "會員登入", href: "/member/login" }, { label: "驗證電子信箱" }]}>
        <div className="frame-small-box">
          <div className="melo_box d-flex">
            <EmailVerifyForm />
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
