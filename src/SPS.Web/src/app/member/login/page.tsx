import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MemberLoginForm from "@/components/member/MemberLoginForm";

export const metadata: Metadata = {
  title: "會員登入",
};

/**
 * 會員登入，對應舊站 page/member/login.html。
 *
 * 2026-09-10 對接真後端 `POST /api/Auth/login`：表單本體（帳號／密碼／
 * 驗證碼／送出）抽成 client component `MemberLoginForm`，這支檔案繼續
 * 當 server component 只負責外層版型跟 metadata，說明見
 * `MemberLoginForm.tsx`。
 *
 * 「還沒註冊會員帳號嗎？」／「查詢申請狀態」／「權益比較表」這半邊
 * （`.melo_box_right`）維持原本純靜態連結，沒有要接的資料。
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
            <MemberLoginForm />

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
