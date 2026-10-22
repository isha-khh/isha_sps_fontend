/*
 * 舊站共用腳本（遷移中）。這個 React 版站台用不到的舊站功能已移除：頁首固定高度補償（.banner-top）、
 * 回頂端按鈕（.gotop／.fcgotop）、側欄 collapsed-btn 與「顯示分類」收合（改由 CategorySidebar 的 React state 處理）、
 * 日期選擇器（datepicker 外掛本來就沒載入）、分享／tooltip 等沒人呼叫的函式（分享見 ShareBox.tsx）。
 * 這些在實際頁面上都找不到對應的元素（2026-10-22 查證），所以直接刪除。
 *
 * 剩下的 jQuery 只有手機主選單的 `.navbar-toggler` 那一段（第二階段隨 bsnav 一起改成 React，見
 * docs/移除jQuery規劃-2026-10-22.md）；捲動樣式、AOS、Fancybox 已改成不依賴 jQuery。
 */
(function () {
  function init() {
    // 捲動超過 10px 時 body 加 is_scroll（頁首縮小用，見 coreStyle.css 的 .is_scroll .navbar）
    function scrollCheck() {
      document.body.classList.toggle("is_scroll", window.scrollY > 10);
    }
    window.addEventListener("scroll", scrollCheck, { passive: true });
    scrollCheck();

    // 手機主選單開關（第二階段移除，見檔頭說明）
    $(".bsnav .navbar-toggler").click(function () {
      if (($(".bsnavclose.close-btn").length > 0 && $(".bsnav-mobile").hasClass("full")) || $(".bsnav-mobile").hasClass("down")) {
        if ($(".bsnavclose.close-btn").hasClass("active")) {
          $(".bsnavclose.close-btn").removeClass("active");
        } else {
          $(".bsnavclose.close-btn").addClass("active");
        }
      }

      $(".bsnav-mobile .navbar-nav.navbar-mobile > .nav-item > .nav-link").click(function () {
        $(".bsnav-mobile .navbar-nav.navbar-mobile > .nav-item > .nav-link").not(this).parent("li").removeClass("in");
        $(".bsnav-mobile .navbar-nav.navbar-mobile > .nav-item > .nav-link").not(this).next("ul").slideUp();
      });

      return false;
    });

    // Fancybox 全域綁定（委派式，綁一次，之後 client-side 導覽進來的 [data-fancybox] 也有效；
    // 原本要「載入當下頁面上已經有 [data-fancybox]」才綁，從沒有燈箱的頁面導覽過去就會失效）
    if (window.Fancybox) {
      window.Fancybox.bind("[data-fancybox]", {
        Toolbar: {
          display: {
            left: ["infobar"],
            right: ["zoomIn", "zoomOut", "close"],
          },
        },
      });
    }

    if (window.AOS) {
      window.AOS.init({ duration: 900, once: true });
      window.addEventListener("resize", function () {
        window.AOS.refresh();
      });
      window.addEventListener("scroll", function () {
        window.AOS.refresh();
      }, { passive: true });
      window.addEventListener("load", function () {
        window.AOS.refresh();
      });
    }
  }

  // 這支是 afterInteractive 載入，DOMContentLoaded 通常已經過了
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


//無障礙TAB設定
let isTabPressed = false;

// 記錄 Tab 鍵按下狀態
document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') {
        isTabPressed = true;
    }

    const key = e.key.toUpperCase();
    const isTriggered = isTabPressed || e.altKey;

    if (isTriggered && ['U', 'C', 'B'].includes(key)) {
        let targetId = '';
        let targetWrapper = null;

        if (key === 'U') {
            targetId = 'header-block';
            targetWrapper = document.querySelector('header');
        } else if (key === 'C') {
            targetId = 'main-block';
            targetWrapper = document.querySelector('main');
        } else if (key === 'B') {
            targetId = 'footer-block';
            targetWrapper = document.querySelector('footer');
        }

        const targetAnchor = document.getElementById(targetId);

        if (targetWrapper && targetAnchor) {
            e.preventDefault();

            // 1. 平滑捲動至目標區塊
            targetWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

            // 2. 焦點直接進入該錨點（防止原生跳動影響平滑滾動）
            targetAnchor.focus({ preventScroll: true });
        }
    }
});

// 重設 Tab 鍵狀態
document.addEventListener('keyup', function (e) {
    if (e.key === 'Tab') {
        isTabPressed = false;
    }
});
