import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";

export const metadata: Metadata = {
  title: "忘記密碼",
};

/**
 * 忘記密碼，對應舊站 page/member/forgot.html。跟 login.html 一樣是純
 * 靜態展示（沒有真的寄送驗證信的後端），「送出」目前連回登入頁，
 * 對照舊站行為。
 */
export default function MemberForgotPage() {
  return (
    <>
      <BodyClass className="member login forgot" />
      <InnerPageShell title="忘記密碼" breadcrumb={[{ label: "忘記密碼" }]}>
        <div className="frame-small-box">
          <div className="melo_box d-flex">
            <div className="melo_box_left w-100">
              <div className="form-group">
                <label htmlFor="forgotAccount" className="mb-2">
                  會員帳號<span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input type="text" id="forgotAccount" className="form-control" placeholder="請輸入會員帳號" required aria-required="true" />
              </div>

              <div className="form-group">
                <label htmlFor="forgotCaptcha" className="mb-2">
                  驗證碼<span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="msk_sdcv">
                  <input type="text" id="forgotCaptcha" className="form-control me-2" placeholder="請輸入驗證碼" required aria-required="true" />
                  <img className="img-fluid d-block" src="/images/all/chksum.jpg" alt="驗證碼" />
                </div>
              </div>

              <Link href="/member/login" title="送出" className="more_x" style={{ margin: "0 auto" }}>
                <span>送出</span>
                <i className="bi bi-arrow-right" aria-hidden="true"></i>
              </Link>
            </div>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
