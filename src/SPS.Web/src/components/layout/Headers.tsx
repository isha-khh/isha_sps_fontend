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
 */
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

    // 手機版下拉選單（點擊展開/收合子選單）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $(document).on(`click${NS}`, ".navbar-nav .dropdown-toggle", function (this: HTMLElement, e: any) {
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

            {/* 選單內容 */}
            <div className="collapse navbar-collapse justify-content-end d-md-block d-none" id="mainNavbarNav">
              <ul className="navbar-nav nav-1 navbar-mobile">
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

                {/* 服務專區：/serve 已經做出來了，主連結跟「產業輔導」/「輔助資源」這兩個可以直接點的子項改成真的路由。
                    「技術工具」/「人才培育」是 disabled 的第二層 toggle（本來就點不了，見下面註解），
                    「技術文件」這種再往下一層的細分類目前 /serve 沒有對應的篩選條件，先維持原本的路徑字串。 */}
                <li className="nav-item dropdown dropdown-left fadeup">
                  <Link href="/serve" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
                    <span className="title-main">服務專區</span>
                  </Link>
                  <ul className="dropdown-menu">
                    <li className="hover_r_sider dropdown-submenu">
                      {/* 程式判斷第2層不能點多家 disabled */}
                      <a className="dropdown-item dropdown-toggle disabled" href="/page/serve/index.html" title="技術工具">
                        技術工具
                      </a>
                      <ul className="dropdown-menu">
                        <li>
                          <a className="dropdown-item" href="#" title="產業AI">
                            產業AI
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="/page/serve/index.html" title="技術文件">
                            技術文件
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li className="hover_r_sider dropdown-submenu">
                      <a className="dropdown-item dropdown-toggle disabled" href="/page/serve/index.html" title="人才培育">
                        人才培育
                      </a>
                      <ul className="dropdown-menu">
                        <li>
                          <a className="dropdown-item" href="#" title="知識加值">
                            知識加值
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="#" title="XR">
                            XR
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li className="hover_r_sider dropdown-submenu">
                      <Link className="dropdown-item" href="/serve?category=產業輔導" title="產業輔導">
                        產業輔導
                      </Link>
                      <ul className="dropdown-menu">
                        <li>
                          <a className="dropdown-item" href="#" title="輔導">
                            輔導
                          </a>
                        </li>
                      </ul>
                    </li>
                    <li className="hover_r_sider dropdown-submenu">
                      <Link className="dropdown-item" href="/serve?category=輔助資源" title="輔助資源">
                        輔助資源
                      </Link>
                      <ul className="dropdown-menu">
                        <li>
                          <a className="dropdown-item" href="#" title="本計畫補助">
                            本計畫補助
                          </a>
                        </li>
                        <li>
                          <a className="dropdown-item" href="#" title="政府補助資源">
                            政府補助資源
                          </a>
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

                {/* 我要媒合 */}
                <li className="nav-item dropdown dropdown-left fadeup">
                  <a href="/page/matching/index.html" className="nav-link dropdown-toggle" role="button" aria-expanded="false">
                    <span className="title-main">我要媒合</span>
                  </a>
                  <ul className="dropdown-menu">
                    <li className="hover_r_sider dropdown-submenu">
                      <a className="dropdown-item dropdown-toggle" href="/page/matching/enterprise.html" title="企業名錄">
                        企業名錄
                      </a>
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
              </ul>
            </div>

            <div className="small-btn-box nav-3 d-flex align-items-center">
              <a href="javascript:void(0);" className="btn btn-light rounded-pill btn-scroll-newsletter" title="訂閱電子報">
                <span>訂閱電子報</span>
              </a>

              {/* 手機版漢堡按鈕 */}
              <button
                className="navbar-toggler toggler-spring d-md-none"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#mainNavbarNav"
                aria-controls="mainNavbarNav"
                aria-expanded="false"
                aria-label="切換導覽選單"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </div>
          </div>
        </nav>

        <div className="bsnav-mobile right d-md-none" role="dialog" aria-modal="true" aria-hidden="true">
          <button type="button" className="bsnavclose close-btn border-0 bg-transparent" aria-label="關閉選單" tabIndex={-1}>
            <img src="/images/all/close.svg" alt="" aria-hidden="true" />
          </button>
          <div className="bsnav-mobile-overlay"></div>
          <div className="navbar nav-big-wrapper">
            <div className="navbar-mobile-wrapper"></div>
          </div>
        </div>
      </nav>

      <style>{`
        /* 確保按鈕內的圖片不阻擋事件 */
        .bsnavclose img {
          pointer-events: none;
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
