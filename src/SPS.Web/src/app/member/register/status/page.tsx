import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import ApplicationStatusLookup from "@/components/member/ApplicationStatusLookup";

export const metadata: Metadata = {
  title: "查詢申請進度",
};

/**
 * 會員申請進度查詢。登入頁右側「查詢申請狀態 → 立即查詢」原本是設計稿遺留的 `href="#"`，沒有對應頁面
 * 也沒有後端；申請通知信裡的「申請進度查詢」連結也指到這裡（帶 `?applicationNumber=` 預填編號）。
 *
 * 版型沿用登入頁的 `.frame-small-box`／`.melo_box`，表單與結果在 client component
 * `ApplicationStatusLookup`。這支檔案只負責外層版型與讀取預填的申請編號。
 */
export default async function ApplicationStatusPage({ searchParams }: PageProps<"/member/register/status">) {
  const { applicationNumber } = await searchParams;
  const initialApplicationNumber = typeof applicationNumber === "string" ? applicationNumber.slice(0, 40) : "";

  return (
    <>
      <BodyClass className="member login" />
      <InnerPageShell
        title="查詢申請進度"
        breadcrumb={[{ label: "會員註冊", href: "/member/register" }, { label: "查詢申請進度" }]}
      >
        <div className="frame-small-box">
          <ApplicationStatusLookup initialApplicationNumber={initialApplicationNumber} />
        </div>
      </InnerPageShell>
    </>
  );
}
