import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import CompareTable from "@/components/member/CompareTable";

export const metadata: Metadata = {
  title: "權益比較表",
};

/**
 * 會員權益比較表獨立頁，對應舊站 page/member/compare.html——跟
 * `p01.html`（會員註冊 Step 2）內嵌的是同一份表格，不是註冊流程的
 * 一部分（沒有 `StepProgress`／上一步下一步），單純從 login.html 的
 * 「權益比較表」連結過來查閱用。
 */
export default function MemberComparePage() {
  return (
    <>
      <BodyClass className="member login" />
      <InnerPageShell title="權益比較表" breadcrumb={[{ label: "權益比較表" }]}>
        <div className="frame-small-box">
          <CompareTable />
        </div>
      </InnerPageShell>
    </>
  );
}
