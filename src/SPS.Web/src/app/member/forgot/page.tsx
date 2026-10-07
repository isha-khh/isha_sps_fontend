import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MemberForgotForm from "@/components/member/MemberForgotForm";
import RedirectIfLoggedIn from "@/components/member/RedirectIfLoggedIn";

export const metadata: Metadata = {
  title: "忘記密碼",
};

/**
 * 忘記密碼，對應舊站 page/member/forgot.html。原本是純靜態展示（「送出」只連回登入頁、不寄信），
 * 2026-10-03 接上 `POST /api/Auth/forgot-password`：表單與送出後的訊息在 client component
 * `MemberForgotForm`，信裡的重設連結由 `/member/reset-password` 接手。這支檔案只負責外層版型。
 */
export default function MemberForgotPage() {
  return (
    <>
      <BodyClass className="member login forgot" />
      <RedirectIfLoggedIn />
      <InnerPageShell title="忘記密碼" breadcrumb={[{ label: "會員登入", href: "/member/login" }, { label: "忘記密碼" }]}>
        <div className="frame-small-box">
          <div className="melo_box d-flex">
            <MemberForgotForm />
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
