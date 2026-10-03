import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MemberResetPasswordForm from "@/components/member/MemberResetPasswordForm";

export const metadata: Metadata = {
  title: "重設密碼",
  // 網址帶著一次性的重設 token，不讓搜尋引擎收錄
  robots: { index: false, follow: false },
};

/**
 * 重設密碼。忘記密碼信裡的連結是 `/member/reset-password?token=…`，這個頁面原本不存在（連結 404）。
 * token 由網址帶入，驗證與送出都在 client component `MemberResetPasswordForm`。
 * 這支檔案只負責外層版型，並把 `referrer` 設為 no-referrer 以免 token 隨外部連結的 Referer 外洩。
 */
export default async function MemberResetPasswordPage({ searchParams }: PageProps<"/member/reset-password">) {
  const { token } = await searchParams;

  return (
    <>
      <BodyClass className="member login forgot" />
      <meta name="referrer" content="no-referrer" />
      <InnerPageShell title="重設密碼" breadcrumb={[{ label: "會員登入", href: "/member/login" }, { label: "重設密碼" }]}>
        <div className="frame-small-box">
          <div className="melo_box d-flex">
            <MemberResetPasswordForm token={typeof token === "string" ? token : ""} />
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
