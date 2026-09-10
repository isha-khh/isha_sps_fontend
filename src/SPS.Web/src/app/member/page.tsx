import type { Metadata } from "next";
import InnerPageShell from "@/components/layout/InnerPageShell";
import BodyClass from "@/components/BodyClass";
import MemberCenterContent from "@/components/member/MemberCenterContent";

export const metadata: Metadata = {
  title: "會員中心",
};

/**
 * 會員中心——全新頁面，legacy 參考站沒有對應設計（查過
 * `page/_uc/nav.html`／`footer.html`，「會員中心」連結一路都只指到
 * `login.html`，下拉選單也只有「我要登入」「註冊會員」兩項，這個
 * 頁面在舊站設計稿階段就沒有做過）。
 *
 * 2026-09-10 對照使用者另一個舊專案
 * （`~/RiderProjects/isha-sps/src/SPS.Web`）裡已經設計好、但用不同
 * 視覺系統（Tailwind）刻的 `/member` 頁面重新做過——功能範圍（側欄
 * 分類、基本資料/密碼/公司資料/成員管理/產品資訊/媒合資料/我的
 * 最愛幾個面板）照抄，視覺換成這個專案實際在用的既有樣式
 * （`.frame-small-box`／`.side .nav`／`btn-theme` 這套），不是照搬
 * Tailwind 版本的 JSX。這次只有「基本資料」真的接了真後端資料
 * （`ProfilePanel.tsx`），其他面板先顯示「即將推出」，範圍見
 * `MemberCenterContent.tsx` 的說明。
 *
 * 表單本體是 client component（`MemberCenterContent`），因為要在
 * 瀏覽器端呼叫 `fetchProfile()`（帶 Cookie 認證）確認登入狀態，
 * 這裡（server component）只負責外層版型跟 metadata。
 */
export default function MemberPage() {
  return (
    <>
      <BodyClass className="member" />
      <InnerPageShell title="會員中心" breadcrumb={[{ label: "會員中心" }]}>
        <MemberCenterContent />
      </InnerPageShell>
    </>
  );
}
