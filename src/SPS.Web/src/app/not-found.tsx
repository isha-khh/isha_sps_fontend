import type { Metadata } from "next";
import Header from "@/components/layout/Headers";
import Footer from "@/components/layout/Footer";
import BodyClass from "@/components/BodyClass";
import AutoRedirectCountdown from "@/components/ui/AutoRedirectCountdown";

export const metadata: Metadata = {
  title: "找不到頁面",
};

const REDIRECT_SECONDS = 7;

/**
 * 全站 404 頁，對應 App Router 的 `not-found.tsx` 慣例：路由對不到任何
 * 頁面時會自動顯示這支，`notFound()`（news/serve/promotion 詳情頁查無
 * 資料時呼叫的那個）也是導到這裡。
 *
 * 2026-09-09 改用舊站真的交付過的切版：根目錄 `httpstatus.html`
 * （對應 body class `httpstatus`）。跟一開始沒有對應切版時自己畫的
 * 版本（InnerPageShell + 跑馬燈標題/麵包屑）不一樣，這份設計是
 * **獨立滿版**的錯誤頁——沒有跑馬燈標題、沒有麵包屑、沒有側欄，
 * `.error_wrap` 直接撐滿 100vh，所以這裡不套 `InnerPageShell`（那支
 * 版型固定會畫麵包屑），改成照 `httpstatus.html` 原始結構自己組
 * `<Header />`／`<main>`／`<Footer />`，`.content` 沒有側欄可以分寬度
 * 時要手動撐滿（跟 InnerPageShell 處理「兩側欄位都沒有」時是同一個
 * 修法，見那支檔案的註解——`.content` 的寬度在 CSS 裡是寫死比例的，
 * 不是「扣掉旁邊欄位剩下的空間」這種彈性寬度）。
 *
 * 「系統將於 7 秒後將自動跳轉到首頁」這句話舊站本來就有，但翻遍
 * `httpstatus.html`（兩段 `$(document).ready(...)` 都是空的）跟
 * `coreScript.js`，完全沒有真的倒數/跳轉的邏輯——純粹是「畫面上寫著
 * 會跳轉，但永遠不會跳轉」的半成品。照抄成靜態的「7」反而更誤導
 * 使用者（會真的等著看它跳轉），這裡用 `AutoRedirectCountdown` 補上
 * 真的倒數＋導頁，把設計稿原本要表達的行為做完整，不是照抄半成品。
 */
export default function NotFound() {
  return (
    <>
      <a href="#main-content" className="visually-hidden-focusable">
        跳至主要內容
      </a>

      <BodyClass className="httpstatus" />

      <div className="page_wrapper">
        <Header />

        <main className="main" id="main-content" role="main">
          <a href="#main-block" id="main-block" accessKey="C" title="中央主要內容區塊" className="visually-hidden-focusable">
            ::: 主要內容區塊
          </a>

          <div className="container-fluid px-0">
            <div className="row gx-0 gy-4">
              {/* 沒有側欄可以分寬度時要手動撐滿，見上面的檔案說明 */}
              <div className="content" style={{ flex: "1 1 100%", width: "100%", maxWidth: "100%" }}>
                <div className="error_wrap">
                  <div className="error_wrap_top">
                    <img className="img-fluid d-block" src="/images/all/logo.svg" alt="智慧工安技術 產業資訊暨媒合平台" />

                    <div className="error_content">
                      <h2 className="error_title">找不到網路資源</h2>
                      <p className="error_desc">
                        您要尋找的資源可能已經移除或名稱變更而無法使用！
                        <br />
                        系統將於 <AutoRedirectCountdown seconds={REDIRECT_SECONDS} /> 秒後將自動跳轉到首頁
                      </p>
                    </div>
                  </div>

                  <div className="footer_bg4" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/all/footer_bg4.png" alt="" />
                  </div>

                  <div className="s_round_3" aria-hidden="true">
                    <img className="img-fluid d-block" src="/images/home/round_3.jpg" alt="" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <a href="#footer-block" id="footer-block" accessKey="B" title="下方功能區塊" className="visually-hidden-focusable" tabIndex={0}>
          ::: 下方功能區塊
        </a>
        <Footer />
      </div>
    </>
  );
}
