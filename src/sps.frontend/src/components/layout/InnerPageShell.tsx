import type { ReactNode } from "react";
import Header from "@/components/layout/Headers";
import Footer from "@/components/layout/Footer";
import CategorySidebar from "@/components/layout/CategorySidebar";
import Breadcrumb, { type BreadcrumbItem } from "@/components/layout/Breadcrumb";
import MarqueeTrack from "@/components/ui/MarqueeTrack";

/**
 * 積木元件：內頁共用版型（news、serve…之後每個內頁都套這個）。
 *
 * 對應舊站每個內頁重複出現的那一整段結構：(可選)跑馬燈標題 → (可選)
 * 輪播 banner → 麵包屑 → 側欄 + 內容兩欄。首頁不是套這個版型（首頁沒有
 * 跑馬燈標題/麵包屑，是自己的英雄區塊），所以首頁的組裝邏輯還是留在
 * app/page.tsx 裡。
 *
 * `title` 沒給就不渲染跑馬燈標題那塊——對照舊站，列表頁（news/index、
 * serve/index）有這塊，但詳情頁（news/show、serve/show）沒有，兩種
 * 內頁版型長得不完全一樣。
 *
 * 用法範例：
 *   <InnerPageShell title="最新消息" breadcrumb={[{ label: "公告事項", href: "/news" }]}>
 *     頁面內容...
 *   </InnerPageShell>
 */
export default function InnerPageShell({
  title,
  titleAside,
  breadcrumb,
  banner,
  topBar,
  sidebar,
  aside,
  decorations,
  children,
}: {
  title?: string;
  /** 跑馬燈標題旁邊的小型子分類切換（例如 serve 詳情頁的「產業AI／技術文件」），沒給就不渲染，`title` 沒給時也不會顯示 */
  titleAside?: ReactNode;
  breadcrumb: BreadcrumbItem[];
  banner?: ReactNode;
  /**
   * 麵包屑下方、側欄+內容那個三欄 row *外面* 的滿版區塊——目前給
   * 公告事項列表頁的分類頁籤用（見 CategoryTabStrip.tsx），這種頁籤
   * 客戶要求是橫跨整個內容寬度，不是塞進 `sidebar` 那個窄欄位裡，
   * 所以另外開一個滿版插槽，沒給就不渲染。
   */
  topBar?: ReactNode;
  sidebar?: ReactNode;
  /** 右側欄（熱門文章／廣告圖片這類），對應舊站的 `.side.side2`，沒給就不渲染 */
  aside?: ReactNode;
  /** `<main>` 裡、三欄 row 外面的裝飾用圖層（例如詳情頁的 s_round_6／s_round_3），沒給就不渲染 */
  decorations?: ReactNode;
  children: ReactNode;
}) {
  // `.content` 這個 class 在舊站 CSS 裡是寫死寬度比例的（配合三欄版型：
  // 側欄 + 內容 + 右欄），不是「扣掉旁邊欄位剩下的空間」這種彈性寬度。
  // 所以兩側欄位都不給的時候（例如 404 這種沒有分類/相關選單的頁面），
  // `.content` 還是會卡在原本比例的寬度，畫面看起來像整塊內容被推到
  // 左邊、右邊留一大塊空白，置中怎麼調都對不齊版面。這裡偵測「兩側欄
  // 位都沒有內容」的情況，直接把 `.content` 撐滿整個 row，其他頁面
  // （有側欄的）不受影響。
  const hasSideColumns = Boolean(sidebar) || Boolean(aside);

  return (
    <>
      <a href="#main-content" className="visually-hidden-focusable">
        跳至主要內容
      </a>

      <div className="page_wrapper">
        <Header />

        {title && (
          <div className="section-title-wrap">
            <div className="marquee-bg" aria-hidden="true">
              <MarqueeTrack />
            </div>

            <h2 className="main-title">
              <span className="tit_tw">{title}</span>
            </h2>

            {titleAside}
          </div>
        )}

        {banner && (
          <div className="banner" aria-label="輪播廣告看板">
            {banner}
          </div>
        )}

        <div className="breadcrumb" aria-label="麵包屑導覽">
          <Breadcrumb items={breadcrumb} />
        </div>

        <main className="main" id="main-content" role="main">
          <a href="#main-block" id="main-block" accessKey="C" title="中央主要內容區塊" className="visually-hidden-focusable">
            ::: 主要內容區塊
          </a>

          <div className="container-fluid">
            {topBar}

            <div className="row gx-0 gy-4">
              <CategorySidebar hidden={!sidebar}>{sidebar}</CategorySidebar>

              <div className="content" style={hasSideColumns ? undefined : { flex: "1 1 100%", width: "100%", maxWidth: "100%" }}>
                {children}
              </div>

              {aside && (
                <div className="side side2" id="side2-block" aria-label="相關選單">
                  <a href="#side2-block" id="right-block" accessKey="R" title="右側選單區塊" className="visually-hidden-focusable">
                    ::: 右側選單區塊
                  </a>
                  {aside}
                </div>
              )}
            </div>
          </div>

          {decorations}
        </main>

        <a href="#footer-block" id="footer-block" accessKey="B" title="下方功能區塊" className="visually-hidden-focusable" tabIndex={0}>
          ::: 下方功能區塊
        </a>
        <Footer />
      </div>
    </>
  );
}
