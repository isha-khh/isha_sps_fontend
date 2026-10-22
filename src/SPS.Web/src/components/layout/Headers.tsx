"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { withBasePath } from "@/lib/api-client";
import { authApi } from "@/lib/api/auth";
import { INBOX_CHANGED_EVENT, memberNotificationsApi } from "@/lib/api/member-notifications";
import { useAuthStore } from "@/store/auth-store";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { useIndustryAiLink, useNewsNavCategories } from "@/components/SiteLinksProvider";
import { resolveServeCategoryLink } from "@/lib/industry-ai-link";
import { setupHeaderNav } from "@/components/layout/header-nav";

/**
 * 過渡期元件：內容照抄舊站的 page/_uc/nav.html，
 * 樣式繼續吃 public/css 底下照搬過來的舊站 CSS + bsnav 套件。
 *
 * 互動行為（手機選單開關 / focus trap / 下拉選單無障礙屬性 / 訂閱電子報捲動）
 * 原本是寫在 nav.html 內嵌的 <script>（後來搬進這裡的 useEffect、用 jQuery 綁事件），
 * 現在是原生 JS 版的 `setupHeaderNav()`（header-nav.ts），不再依賴 jQuery 與 bsnav.min.js。
 *
 * 手機版選單面板（.bsnav-mobile）裡的項目**不是**用 jQuery 在 mount 時
 * 把桌機版 `<ul>` clone 一份塞進去——原本 bsnav.min.js 的 `mobileMenu()`
 * 是這樣做沒錯，但那支函式實際上因為掛在 `$(window).on('load', ...)`
 * 上、Next.js 這裡 script 執行時 `load` 事件早就過了而完全不會被觸發
 * （見下面 useEffect 開頭的說明）。一開始想說既然 bsnav.js 的這段沒
 * 用，那就自己在 useEffect 裡重做一次同樣的「clone 進去」邏輯——結果
 * 踩到更嚴重的問題：用 jQuery `.clone().appendTo()` 把節點插進一個
 * **React 自己管理的** `<div>` 裡，React 完全不知道多了這個節點，之後
 * 任何一次重新渲染（開發模式的 Fast Refresh、甚至正式環境這個元件
 * 未來如果真的因為某個原因重新渲染）都會讓 React 的 `insertBefore`／
 * `removeChild` 對不上真實 DOM，直接噴 `NotFoundError`，選單因此更爛：
 * 開關失靈、內容重複、甚至畫面上一直卡著一條沒收乾淨的選單面板。
 *
 * 正確做法（也是現在這份用的做法）：選單項目本來就是寫死的靜態
 * JSX，不是從 API 來的動態資料，根本不需要在 runtime 用 jQuery
 * clone──直接把這些 `<li>` 抽成 `NavLinks` 這個小元件，桌機版
 * `<ul id="mainNavbarNav">` 跟手機版 `.bsnav-mobile` 面板**各自在
 * JSX 裡呼叫一次**，兩份都是 React 自己創造、自己管理的真實節點，
 * 不會有上面那些指令式操作 DOM 才會踩到的問題。
 */
/**
 * 「會員中心」選單：沒登入是「我要登入／註冊會員」，登入後換成「會員中心／登出」（已登入的人不需要再看到登入與註冊）。
 * 登入狀態用 `GET /api/Auth/session` 查（沒登入也回 200，不會因為 401 被導去登入頁），整個網站共用同一份結果；
 * 桌機與手機版選單各渲染一次，兩份都吃同一個狀態。查完之前先顯示未登入的版本。
 */
function MemberNavItem() {
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const checkSession = useAuthStore((state) => state.checkSession);
  const clear = useAuthStore((state) => state.clear);
  const [loggingOut, setLoggingOut] = useState(false);
  // 收件匣未讀數：登入後查一次，之後每分鐘更新，並在收件匣標已讀時（INBOX_CHANGED_EVENT）立刻更新
  const [unread, setUnread] = useState(0);
  const memberId = member?.id;

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  useEffect(() => {
    if (!memberId) return;
    let active = true;
    const refresh = () => {
      memberNotificationsApi
        .getUnreadCount()
        .then((counts) => active && setUnread(counts.unreadCount + counts.chatUnreadCount))
        .catch(() => {});
    };
    refresh();
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener(INBOX_CHANGED_EVENT, refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener(INBOX_CHANGED_EVENT, refresh);
    };
  }, [memberId]);

  const unreadShown = member ? unread : 0;

  async function handleLogout(event: React.MouseEvent) {
    event.preventDefault();
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // 登出 API 失敗時 cookie 到期也會失效，本地狀態照樣清掉
    } finally {
      clear();
      setLoggingOut(false);
      router.push("/");
    }
  }

  return (
    <li className="nav-item dropdown dropdown-left fadeup">
      <Link href={member ? "/member" : "/member/login"} className="nav-link dropdown-toggle" role="button" aria-expanded="false">
        <span className="title-main">會員中心</span>
        {unreadShown > 0 && (
          <span className="badge rounded-pill bg-danger ms-1" aria-label={`${unreadShown} 則未讀通知`}>
            {unreadShown > 99 ? "99+" : unreadShown}
          </span>
        )}
      </Link>
      <ul className="dropdown-menu">
        {member ? (
          <>
            <li className="hover_r_sider dropdown-submenu">
              <Link className="dropdown-item dropdown-toggle" href="/member" title="前往會員中心">
                會員中心
              </Link>
            </li>
            <li className="hover_r_sider dropdown-submenu">
              <Link className="dropdown-item dropdown-toggle" href="/member?section=inbox" title="收件匣">
                收件匣{unreadShown > 0 ? `（${unreadShown > 99 ? "99+" : unreadShown}）` : ""}
              </Link>
            </li>
            <li className="hover_r_sider dropdown-submenu">
              <a className="dropdown-item dropdown-toggle" href="#" title="登出" onClick={handleLogout}>
                {loggingOut ? "登出中…" : "登出"}
              </a>
            </li>
          </>
        ) : (
          <>
            <li className="hover_r_sider dropdown-submenu">
              <Link className="dropdown-item dropdown-toggle" href="/member/login" title="我要登入">
                我要登入
              </Link>
            </li>
            <li className="hover_r_sider dropdown-submenu">
              <Link className="dropdown-item dropdown-toggle" href="/member/register" title="註冊會員">
                註冊會員
              </Link>
            </li>
          </>
        )}
      </ul>
    </li>
  );
}

function NavLinks() {
  // 「產業AI」可在後台「頁面設定」改成外部連結（關閉時維持站內頁面）
  const industryAiTarget = resolveServeCategoryLink("產業AI", useIndustryAiLink());
  // 「公告事項」下拉列的是後台「公告類別」中啟用的分類（issue #57）
  const newsCategories = useNewsNavCategories();
  return (
    <>
      <li className="nav-item">
        <Link className="nav-link" href="/sitemap">
          <span className="title-main">網站導覽</span>
        </Link>
      </li>

      <li className="nav-item">
        <Link className="nav-link" href="/about">
          <span className="title-main">關於我們</span>
        </Link>
      </li>

      {/* 公告事項：/news 已經做出來了，這裡改成真的路由（其他還沒蓋的頁面暫時維持舊站路徑字串） */}
      <li className="nav-item dropdown dropdown-left fadeup">
        <Link href="/news" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
          <span className="title-main">公告事項</span>
        </Link>
        <ul className="dropdown-menu">
          {newsCategories.map((category) => (
            <li className="hover_r_sider" key={category.id}>
              <Link className="dropdown-item" href={`/news?category=${encodeURIComponent(category.name)}`} title={category.name}>
                {category.name}
              </Link>
            </li>
          ))}
        </ul>
      </li>

      {/* 服務專區：分類其實是兩層（盤點細節見 serve-data.ts 開頭的說明），
          這裡「技術工具」/「人才培育」是分組標籤，disabled、本來就點不了
          （見下面 dropdown-toggle disabled 那則註解）。
          2026-09-16：「人才培育」「產業輔導」「補助資源」原本葉節點都是
          連去 `/serve?category=<葉節點>`（用泛用的 ServeItemCard 假資料
          代打，那時候還沒有專屬設計稿）——這次設計稿交來了各自專屬的
          頁面（`/talent`、`/talent/xr`、`/tutoring`、`/support`、
          `/support/resources`，版面/欄位都跟 `/serve` 的泛用卡片不一樣），
          改連去這些真頁面。serve-data.ts 裡對應的舊假資料項目
          （知識加值／輔導／本計畫補助）目前變成沒有連結指過去的孤兒
          資料，還沒清掉，記在 docs/改版規劃.md。 */}
      <li className="nav-item dropdown dropdown-left fadeup">
        <Link href="/serve" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
          <span className="title-main">服務專區</span>
        </Link>
        <ul className="dropdown-menu">
          <li className="hover_r_sider dropdown-submenu">
            {/* 程式判斷第2層不能點多家 disabled */}
            <Link className="dropdown-item dropdown-toggle disabled" href="/serve" title="技術工具">
              技術工具
            </Link>
            <ul className="dropdown-menu">
              <li>
                {industryAiTarget.external ? (
                  <a
                    className="dropdown-item"
                    href={industryAiTarget.href}
                    title="產業AI"
                    {...(industryAiTarget.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    產業AI
                  </a>
                ) : (
                  <Link className="dropdown-item" href="/serve?category=產業AI" title="產業AI">
                    產業AI
                  </Link>
                )}
              </li>
              <li>
                <Link className="dropdown-item" href="/serve?category=技術文件" title="技術文件">
                  技術文件
                </Link>
              </li>
            </ul>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item dropdown-toggle disabled" href="/talent" title="人才培育">
              人才培育
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="/talent" title="知識加值">
                  知識加值
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/talent/xr" title="XR">
                  XR
                </Link>
              </li>
            </ul>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/tutoring" title="產業輔導">
              產業輔導
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="/tutoring" title="輔導">
                  輔導
                </Link>
              </li>
            </ul>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/support" title="補助資源">
              補助資源
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="/support" title="本計畫補助">
                  本計畫補助
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/support/resources" title="政府補助資源">
                  政府補助資源
                </Link>
              </li>
            </ul>
          </li>
        </ul>
      </li>

      {/* 推廣專區 */}
      <li className="nav-item dropdown dropdown-left fadeup">
        <Link href="/promotion" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
          <span className="title-main">推廣專區</span>
        </Link>
        <ul className="dropdown-menu">
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/promotion" title="產業案例">
              產業案例
            </Link>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/promotion/video" title="影音專區">
              影音專區
            </Link>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/promotion/contribute" title="我要投稿">
              我要投稿
            </Link>
          </li>
        </ul>
      </li>

      {/* 我要媒合：企業名錄／媒合對接都已經做出來了，兩個子項都改成真的路由。 */}
      <li className="nav-item dropdown dropdown-left fadeup">
        <Link href="/matching/enterprise" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
          <span className="title-main">我要媒合</span>
        </Link>
        <ul className="dropdown-menu">
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item dropdown-toggle" href="/matching/enterprise" title="企業名錄">
              企業名錄
            </Link>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item dropdown-toggle" href="/matching" title="媒合對接">
              媒合對接
            </Link>
          </li>
        </ul>
      </li>

      {/* 常見問題 */}
      <li className="nav-item">
        <Link className="nav-link" href="/faq">
          <span className="title-main">常見問題</span>
        </Link>
      </li>

      <MemberNavItem />
    </>
  );
}

export default function Headers() {
  // 手機選單開關／ESC／焦點鎖定、手機版子選單手風琴、aria 同步、訂閱電子報捲動，見 header-nav.ts
  useEffect(() => setupHeaderNav(), []);

  return (
    <header className="header">
      <a href="#header-block" id="header-block" accessKey="U" title="上方功能區塊" className="visually-hidden-focusable">
        ::: 上方功能區塊
      </a>

      <nav className="nav" aria-label="主要導覽">
        <nav className="navbar navbar-expand-md fixed-top bsnav nav-big-wrapper" aria-label="主要導覽選單">
          <div className="container-fluid mx-xl-auto mx-lg-auto mx-md-auto mx-sm-auto mx-auto">
            {/* 品牌 Logo 區塊 */}
            <div className="nav-brand-wrapper">
              <Link className="navbar-brand" href="/">
                <h1 className="fs-6 m-0 p-0">
                  高雄技術處<span className="visually-hidden">logo</span>
                </h1>
              </Link>
            </div>

            {/* 選單內容（桌機版） */}
            <div className="collapse navbar-collapse justify-content-end d-md-block d-none" id="mainNavbarNav">
              <ul className="navbar-nav nav-1">
                <NavLinks />
              </ul>
            </div>

            <div className="small-btn-box nav-3 d-flex align-items-center">
              <HeaderSearch />

              <a href="#" className="btn btn-light rounded-pill btn-scroll-newsletter" title="訂閱電子報">
                <span>訂閱電子報</span>
              </a>

              {/* 手機版漢堡按鈕——開關的是下面的 .bsnav-mobile 面板，不是
                  上面桌機版的 #mainNavbarNav，所以沒有放 Bootstrap 的
                  data-bs-toggle/data-bs-target（放了也只是徒增一個沒人
                  在看的 collapse 狀態切換，故意不加）。 */}
              <button
                className="navbar-toggler toggler-spring d-md-none"
                type="button"
                aria-expanded="false"
                aria-label="切換導覽選單"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </div>
          </div>
        </nav>

        {/* 768–1399px 的搜尋入口：header 在這個寬度沒有餘裕，改成懸浮按鈕，見 HeaderSearch.tsx */}
        <HeaderSearch variant="float" />

        {/* 手機版選單面板——跟上面桌機版是同一份 NavLinks，各自渲染，
            不是 runtime clone 出來的（見檔案開頭的說明） */}
        <div className="bsnav-mobile right d-md-none" role="dialog" aria-modal="true" aria-hidden="true">
          <button type="button" className="bsnavclose close-btn border-0 bg-transparent" aria-label="關閉選單" tabIndex={-1}>
            <img src={withBasePath("/images/all/close.svg")} alt="" aria-hidden="true" />
          </button>
          <div className="bsnav-mobile-overlay"></div>
          <div className="navbar nav-big-wrapper">
            <HeaderSearch variant="panel" />
            <ul className="navbar-nav nav-1">
              <NavLinks />
            </ul>
          </div>
        </div>
      </nav>

      <style>{`
        /* 確保按鈕內的圖片不阻擋事件 */
        .bsnavclose img {
          pointer-events: none;
        }

        /*
         * 手機版選單面板關閉時「應該」被 bsnav.min.js 附帶的 CSS
         * （js/bsnav-master/dist/bsnav.min.js，layout.tsx 有 import 它的
         * CSS）用 'transform: translate3d(300px, 0, 0)' 推到畫面右邊外面
         * 藏起來——那份 CSS 假設面板寬度固定是 230px，300 > 230 才能
         * 完全藏住。但實測（Chrome DevTools 手機模擬）這個面板的實際
         * 渲染寬度可能超過 230px（例如 320px），300px 推不夠、右邊會
         * 露出一條實色窄條。
         *
         * 與其追出實際寬度是多少，這裡直接換成用百分比的 transform：
         * 'translate3d(100%, 0, 0)' 永遠是「推出去正好等於自己的寬度」，
         * 不管實際渲染寬度是多少都一定完全藏到畫面外。用 '!important'
         * 確保蓋過 bsnav.min.css 那個固定 px 的版本。
         */
        .bsnav-mobile .navbar {
          transform: translate3d(100%, 0, 0) !important;
        }

        .bsnav-mobile.in .navbar {
          transform: translate3d(0, 0, 0) !important;
        }

        @media (min-width: 768px) {
          .navbar-expand-md .dropdown-submenu > .dropdown-menu {
            top: 0;
            left: 100%;
            margin-top: -1px;
          }

          .navbar-expand-md .nav-item.dropdown:hover > .dropdown-menu,
          .navbar-expand-md .nav-item.dropdown:focus-within > .dropdown-menu,
          .navbar-expand-md .dropdown-submenu:hover > .dropdown-menu,
          .navbar-expand-md .dropdown-submenu:focus-within > .dropdown-menu {
            display: block !important;
            opacity: 1 !important;
            visibility: visible !important;
            pointer-events: auto !important;
          }

          .navbar-nav .nav-item.dropdown {
            position: relative;
          }
        }
      `}</style>
    </header>
  );
}
