import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import StepProgress from "@/components/member/StepProgress";
import MemberTypeSelector from "@/components/member/MemberTypeSelector";

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
 *
 * 2026-09-10 對照官方《會員申請須知》重新設計：原本這裡是 6 張扁平
 * 單選卡（含兩張「個人會員升級」），改成分支選擇流程，說明見
 * `MemberTypeSelector.tsx`——「個人會員升級成企業會員」這個動作搬去
 * 會員中心「權益升級」（已登入才會用到，見 docs/改版規劃.md）。
 */
export default function MemberRegisterAccountPage() {
  return (
    <>
      <BodyClass className="member register p01" />
      <InnerPageShell title="帳號設定" breadcrumb={[{ label: "會員註冊", href: "/member/register" }, { label: "帳號設定" }]}>
        <div className="frame-small-box">
          <StepProgress activeStep={2} />
          <MemberTypeSelector />
        </div>
      </InnerPageShell>
    </>
  );
}
