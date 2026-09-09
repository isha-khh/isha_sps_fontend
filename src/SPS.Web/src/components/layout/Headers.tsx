"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * 過渡期元件：內容照抄舊站的 page/_uc/nav.html，
 * 樣式繼續吃 public/css 底下照搬過來的舊站 CSS + bsnav 套件。
 *
 * 互動行為（手機選單開關 / focus trap / 下拉選單無障礙屬性 / 訂閱電子報捲動）
 * 原本是寫在 nav.html 內嵌的 <script>，這裡原封不動搬進 useEffect，
 * 只是把 document 上的事件都掛上 `.headerNav` namespace，
 * 這樣 React StrictMode 在開發模式下重複執行 effect 時不會重複綁定。
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
function NavLinks() {
  return (
    <>
      <li className="nav-item">
        <a className="nav-link" href="#">
          <span className="title-main">網站導覽</span>
        </a>
      </li>

      <li className="nav-item">
        <a className="nav-link" href="/page/about/index.html">
          <span className="title-main">關於我們</span>
        </a>
      </li>

      {/* 公告事項：/news 已經做出來了，這裡改成真的路由（其他還沒蓋的頁面暫時維持舊站路徑字串） */}
      <li className="nav-item dropdown dropdown-left fadeup">
        <Link href="/news" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
          <span className="title-main">公告事項</span>
        </Link>
        <ul className="dropdown-menu">
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item dropdown-toggle" href="/news?category=活動資訊" title="活動資訊">
              活動資訊
            </Link>
          </li>
          <li className="hover_r_sider">
            <Link className="dropdown-item" href="/news?category=產業新知" title="產業新知">
              產業新知
            </Link>
          </li>
          <li className="hover_r_sider">
            <Link className="dropdown-item" href="/news?category=外部消息" title="外部消息">
              外部消息
            </Link>
          </li>
        </ul>
      </li>

      {/* 服務專區：分類其實是兩層（盤點細節見 serve-data.ts 開頭的說明），
          這裡「技術工具」/「人才培育」是分組標籤，disabled、本來就點不了
          （見下面 dropdown-toggle disabled 那則註解），真正可以點的是底下
          的葉節點——都改成 `/serve?category=<葉節點>`，對應 /serve 頁面
          現在讀的 `?category=` 就是葉節點名稱，不是分組名稱。
          「產業輔導」這一組只有一個葉節點「輔導」，組本身的連結跟葉節點
          連去同一個地方；「輔助資源」有兩個葉節點，組本身沒有單一對應的
          分類，連去 /serve 總覽。 */}
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
                <Link className="dropdown-item" href="/serve?category=產業AI" title="產業AI">
                  產業AI
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/serve?category=技術文件" title="技術文件">
                  技術文件
                </Link>
              </li>
            </ul>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item dropdown-toggle disabled" href="/serve" title="人才培育">
              人才培育
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="/serve?category=知識加值" title="知識加值">
                  知識加值
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/serve?category=XR" title="XR">
                  XR
                </Link>
              </li>
            </ul>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/serve?category=輔導" title="產業輔導">
              產業輔導
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="/serve?category=輔導" title="輔導">
                  輔導
                </Link>
              </li>
            </ul>
          </li>
          <li className="hover_r_sider dropdown-submenu">
            <Link className="dropdown-item" href="/serve" title="輔助資源">
              輔助資源
            </Link>
            <ul className="dropdown-menu">
              <li>
                <Link className="dropdown-item" href="/serve?category=本計畫補助" title="本計畫補助">
                  本計畫補助
                </Link>
              </li>
              <li>
                <Link className="dropdown-item" href="/serve?category=政府補助資源" title="政府補助資源">
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

      {/* 我要媒合：企業名錄已經做出來了，改成真的路由，媒合對接還沒蓋，
          維持舊站路徑字串（跟上面公告事項那則註解同一個做法）。組本身
          （dropdown-toggle）連去企業名錄——目前底下唯一真的存在的頁面。 */}
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
            <a className="dropdown-item dropdown-toggle" href="/page/matching/index.html" title="媒合對接">
              媒合對接
            </a>
          </li>
        </ul>
      </li>

      {/* 常見問題 */}
      <li className="nav-item">
        <Link className="nav-link" href="/faq">
          <span className="title-main">常見問題</span>
        </Link>
      </li>

      {/* 會員中心 */}
      <li className="nav-item dropdown dropdown-left fadeup">
        <Link href="/member/login" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
          <span className="title-main">會員中心</span>
        </Link>
        <ul className="dropdown-menu">
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
        </ul>
      </li>
    </>
  );
}

export default function Headers() {
  useEffect(() => {
    const $ = window.jQuery;
    if (!$) return;

    const NS = ".headerNav";
    const focusableSelectors =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function closeMobileNav() {
      const $mobileNav = $(".bsnav-mobile");
      const $toggler = $(".navbar-toggler");

      if ($mobileNav.hasClass("in")) {
        $mobileNav.removeClass("in");
        $toggler.removeClass("active").attr("aria-expanded", "false");
        $(".bsnavclose").removeClass("active");
        $("body, html").removeClass("bsnav-mobile-open");

        if ($toggler.is(":visible")) {
          $toggler.focus();
        }
      }
    }

    /**
     * 開啟手機版選單——這件事原本是交給 bsnav.min.js 的 `mobileMenu()`
     * 做（`.navbar-toggler` 點擊時 `toggleClass('in')`），但那支是掛在
     * `$(window).on('load', ...)`——Next.js 這裡 script 標籤真正執行
     * 時，瀏覽器的 `load` 事件早就已經觸發過了，這個監聽器根本沒機會
     * 被叫到，點漢堡按鈕因此永遠沒反應。跟關閉行為（`closeMobileNav`）
     * 同樣的道理，改成自己在這個 `useEffect` 裡接管。
     *
     * 選單內容本身不在這裡處理——`.bsnav-mobile` 面板裡的項目是 JSX
     * 直接渲染兩份（`NavLinks`，見上面的元件說明），不是這裡用 jQuery
     * 動態塞進去的，這樣才不會跟 React 自己管理的 DOM 打架。
     *
     * 這裡刻意直接綁在 `.navbar-toggler` 這個元素本身上
     * （`$(".navbar-toggler").on(...)`），不是用 `$(document).on('click',
     * '.navbar-toggler', ...)` 這種委派寫法——實測抓出 `coreScript.js`
     * （舊站帶來的共用腳本，這個元件沒有直接匯入，是透過 layout.tsx
     * 全站載入的）也直接綁了一個 click handler 在同一顆按鈕上，那個
     * handler 最後 `return false`（jQuery 裡等同同時呼叫
     * `preventDefault()` 跟 `stopPropagation()`），事件因此在到達
     * `document` 之前就被攔截掉，委派寫法完全收不到這個 click，選單
     * 因此永遠打不開。直接綁在按鈕本身上，跟 `coreScript.js`／
     * bsnav.min.js 那兩個既有的 handler 一樣「同一個元素上的多個
     * handler」，`stopPropagation()` 不會擋掉同一個元素上其他 handler
     * 執行，才能確保這裡一定會被叫到。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(".navbar-toggler").on(`click${NS}`, (e: any) => {
      e.preventDefault();

      const $mobileNav = $(".bsnav-mobile");
      if ($mobileNav.hasClass("in")) {
        closeMobileNav();
        return;
      }

      const $toggler = $(".navbar-toggler");
      $mobileNav.addClass("in");
      $toggler.addClass("active").attr("aria-expanded", "true");
      $(".bsnavclose").addClass("active");
      $("body, html").addClass("bsnav-mobile-open");
      $(".bsnavclose").trigger("focus");
    });

    // 點擊關閉按鈕或遮罩關閉
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(document).on(`click${NS}`, ".bsnavclose, .bsnav-mobile-overlay", (e: any) => {
      e.preventDefault();
      e.stopPropagation();
      closeMobileNav();
    });

    // 鍵盤無障礙控制（ESC 關閉 + Tab 焦點鎖定在側邊欄內）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(document).on(`keydown${NS}`, (e: any) => {
      const $mobileNav = $(".bsnav-mobile");
      if (!$mobileNav.hasClass("in")) return;

      if (e.key === "Escape" || e.keyCode === 27) {
        e.preventDefault();
        closeMobileNav();
        return;
      }

      if (e.key === "Tab" || e.keyCode === 9) {
        const $focusableElements = $mobileNav.find(focusableSelectors).filter(":visible");
        if ($focusableElements.length === 0) return;

        const $firstElement = $focusableElements.first();
        const $lastElement = $focusableElements.last();

        if (e.shiftKey) {
          if ($(document.activeElement).is($firstElement)) {
            e.preventDefault();
            $lastElement.focus();
          }
        } else if ($(document.activeElement).is($lastElement)) {
          e.preventDefault();
          $firstElement.focus();
        }
      }
    });

    // 視窗拉大時重設
    $(window).on(`resize${NS}`, () => {
      if ($(window).width() >= 768) {
        closeMobileNav();
      }
    });

    // 訂閱電子報：捲動到 footer 的訂閱表單
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(document).on(`click${NS}`, ".btn-scroll-newsletter", (e: any) => {
      e.preventDefault();
      const $target = $(".footer-top");
      if ($target.length) {
        $("html, body").animate({ scrollTop: $target.offset().top }, 600);
      }
    });

    /**
     * 手機版下拉選單（點擊展開/收合子選單）——這裡也跟開啟手機版選單
     * 那個 handler 一樣，故意直接綁在每個 `.dropdown-toggle` 元素本身
     * 上，不是委派到 document：這些連結都是 Next.js 的 `<Link>`，
     * React 自己在更上層（root container）也掛了 click 監聽器處理
     * client-side 導頁，而且會比委派到 `document` 的 jQuery handler
     * 更早收到這個事件（React 的監聽點在 bubble 路徑上比 `document`
     * 更靠近元素本身）。如果用委派寫法，這裡的 `e.preventDefault()`
     * 執行時 React 早就已經根據「當下還沒被 preventDefault」判斷要
     * 導頁了——實測點「公告事項」這種有子選單的項目，手風琴是有展開
     * 沒錯，但畫面同時也真的跳轉到 /news 去了。直接綁在元素本身上，
     * 在事件真正開始往上冒泡（也就是 React 的監聽器收到之前）就先
     * 執行完 `preventDefault()`，才能真的攔下 Next.js 的導頁。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(".navbar-nav .dropdown-toggle").on(`click${NS}`, function (this: HTMLElement, e: any) {
      if (window.innerWidth >= 992) return;

      const $this = $(this);
      const $dropdownMenu = $this.siblings(".dropdown-menu");
      if ($dropdownMenu.length === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const $parentLi = $this.parent("li");
      $parentLi.siblings().find(".dropdown-menu").slideUp(200).removeClass("show");
      $parentLi.siblings().find(".dropdown-toggle").removeClass("show").attr("aria-expanded", "false");

      if ($dropdownMenu.is(":visible")) {
        $dropdownMenu.slideUp(200).removeClass("show");
        $this.removeClass("show").attr("aria-expanded", "false");
      } else {
        $dropdownMenu.slideDown(200).addClass("show");
        $this.addClass("show").attr("aria-expanded", "true");
      }
    });

    // 桌機版下拉選單 hover / focus 的無障礙屬性同步
    $(document).on(`focusin${NS} mouseenter${NS}`, ".navbar-expand-md .nav-item.dropdown", function (this: HTMLElement) {
      $(this).find(".dropdown-toggle").attr("aria-expanded", "true");
    });

    $(document).on(`mouseleave${NS}`, ".navbar-expand-md .nav-item.dropdown", function (this: HTMLElement) {
      $(this).find(".dropdown-toggle").attr("aria-expanded", "false");
    });

    $(document).on(`focusout${NS}`, ".navbar-expand-md .nav-item.dropdown", function (this: HTMLElement) {
      // 用箭頭函式，`this` 沿用外層的 HTMLElement，不用另外指定一個變數保存
      setTimeout(() => {
        if (!this.contains(document.activeElement)) {
          $(this).find(".dropdown-toggle").attr("aria-expanded", "false");
        }
      }, 10);
    });

    return () => {
      $(document).off(NS);
      $(window).off(NS);
      // 這兩個 handler 是直接綁在元素本身上，不是委派到 document，
      // 要另外解綁（見上面各自綁定處的說明）
      $(".navbar-toggler").off(NS);
      $(".navbar-nav .dropdown-toggle").off(NS);
    };
  }, []);

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
              <a href="javascript:void(0);" className="btn btn-light rounded-pill btn-scroll-newsletter" title="訂閱電子報">
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

        {/* 手機版選單面板——跟上面桌機版是同一份 NavLinks，各自渲染，
            不是 runtime clone 出來的（見檔案開頭的說明） */}
        <div className="bsnav-mobile right d-md-none" role="dialog" aria-modal="true" aria-hidden="true">
          <button type="button" className="bsnavclose close-btn border-0 bg-transparent" aria-label="關閉選單" tabIndex={-1}>
            <img src="/images/all/close.svg" alt="" aria-hidden="true" />
          </button>
          <div className="bsnav-mobile-overlay"></div>
          <div className="navbar nav-big-wrapper">
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
