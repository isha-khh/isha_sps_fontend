import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import PasswordField from "@/components/member/PasswordField";

export const metadata: Metadata = {
  title: "會員登入",
};

/**
 * 會員登入，對應舊站 page/member/login.html。
 *
 * 舊站的「登入」是純靜態 `<a>`（連去一個不存在的 `member/index.html`
 * 會員中心首頁，目前整個平台都還沒有這個頁面/後端），這裡先保留原本
 * 純展示行為，沒有做成會送出的表單——跟目前其他會員頁一樣，都還是
 * 「畫面長什麼樣子」的靜態版本，等後端/會員中心範圍確認後再補真的
 * 表單驗證與登入邏輯。
 *
 * 沒有側欄/右欄（`.side1`／`.side2` 都是 d-none），所以不給
 * `InnerPageShell` 的 `sidebar`／`aside`。
 */
export default function MemberLoginPage() {
  return (
    <>
      <BodyClass className="member login" />
      <InnerPageShell title="會員登入" breadcrumb={[{ label: "會員登入" }]}>
        <div className="frame-small-box">
          <div className="melo_box d-flex">
            <div className="melo_box_left">
              <div className="form-group">
                <label htmlFor="memberAccount" className="mb-2">
                  會員帳號<span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input type="text" id="memberAccount" className="form-control" placeholder="請輸入會員帳號" required aria-required="true" />
              </div>

              <div className="form-group g-input">
                <div className="so_pass d-flex justify-content-between align-items-center mb-2">
                  <label className="mb-0">
                    會員密碼<span className="text-danger ms-1" aria-hidden="true">*</span>
                  </label>
                  <Link href="/member/forgot" title="前往忘記密碼頁面" className="blue">
                    <i className="bi bi-question-circle-fill me-1" aria-hidden="true"></i>忘記密碼
                  </Link>
                </div>

                <PasswordField />
              </div>

              <div className="form-group">
                <label htmlFor="loginCaptcha" className="mb-2">
                  驗證碼<span className="text-danger" aria-hidden="true">*</span>
                </label>
                <div className="msk_sdcv">
                  <input type="text" id="loginCaptcha" className="form-control me-2" placeholder="請輸入驗證碼" required aria-required="true" />
                  <img className="img-fluid d-block" src="/images/all/chksum.jpg" alt="驗證碼" />
                </div>
              </div>

              <a href="#" title="登入" className="more_x" style={{ margin: "0 auto" }}>
                <span>登入</span>
                <i className="bi bi-arrow-right" aria-hidden="true"></i>
              </a>
            </div>

            <div className="melo_box_right">
              <div className="melo_box_right_1">
                <div className="tit">
                  <p>還沒註冊會員帳號嗎？</p>
                  <Link href="/member/register" className="more_x more_x_gu" title="會員註冊">
                    <span>會員註冊</span>
                  </Link>
                </div>

                <p>查詢申請狀態</p>
                <a href="#" className="more_x more_x_gu" title="立即查詢">
                  <span>立即查詢</span>
                </a>
              </div>

              <div className="melo_box_right_2">
                <Link href="/member/compare" className="w-100" title="權益比較表">
                  <i className="bi bi-table me-1"></i>
                  <span>權益比較表</span>
                  <i className="bi bi-caret-right-fill"></i>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
