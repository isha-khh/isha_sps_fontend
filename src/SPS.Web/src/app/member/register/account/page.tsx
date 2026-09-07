import type { Metadata } from "next";
import Link from "next/link";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberTypeCard from "@/components/member/MemberTypeCard";
import CompareTable from "@/components/member/CompareTable";
import { MEMBER_TYPE_OPTIONS } from "@/lib/member-registration-data";

export const metadata: Metadata = {
  title: "會員註冊 - 帳號設定",
};

/**
 * 會員註冊 Step 2「帳號設定」，對應舊站 page/member/p01.html。
 *
 * 注意：`.tit_tw` 標題／`StepProgress` 上寫的是「帳號設定」，但這頁
 * 實際內容是「請選擇會員類型」＋內嵌的會員權益比較表——這是舊站本身
 * 的命名跟內容對不太上（標題步驟名稱可能是預留給之後的帳號欄位，
 * 目前這步只做類型選擇），照舊站原樣呈現，不自己改標題。
 */
export default function MemberRegisterAccountPage() {
  return (
    <>
      <BodyClass className="member register p01" />
      <InnerPageShell title="帳號設定" breadcrumb={[{ label: "會員註冊", href: "/member/register" }, { label: "帳號設定" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={2} />

          <h3 className="mb-4 me_sho">請選擇會員類型</h3>
          <fieldset className="menb_type_fieldset border-0 p-0 m-0">
            <div className="d-flex flex-wrap menb_type gap-3">
              {MEMBER_TYPE_OPTIONS.map((option, index) => (
                <MemberTypeCard key={option.id} option={option} defaultChecked={index === 0} />
              ))}
            </div>
          </fieldset>

          <h3 className="mb-4 me_sho">會員權益比較表</h3>
          <CompareTable />

          <div className="card-footer d-flex justify-content-between">
            <Link className="btn-outline-dark" href="/member/register" title="上一步">
              <i className="bi bi-chevron-left" aria-hidden="true"></i>上一步
            </Link>
            <Link className="btn-theme" href="/member/register/info" title="同意，下一步">
              同意，下一步<i className="bi bi-chevron-right" aria-hidden="true"></i>
            </Link>
          </div>
        </div>
      </InnerPageShell>
    </>
  );
}
