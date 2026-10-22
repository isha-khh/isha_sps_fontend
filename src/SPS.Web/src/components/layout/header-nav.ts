/**
 * 頁首導覽的互動行為（原生 JS，不依賴 jQuery）：手機選單開關／ESC／Tab 焦點鎖定／點遮罩關閉／視窗拉大自動關閉、
 * 手機版下拉子選單手風琴、桌機下拉選單的 aria-expanded 同步、「訂閱電子報」捲動到頁尾訂閱表單。
 *
 * 原本寫在 Headers.tsx 的 useEffect 裡，用 jQuery 綁事件；改成原生版本後行為照舊，差別有兩個：
 * - 全部用「document 上的捕捉階段（capture）委派」，不是綁在元素本身上。React 17+ 的 click 監聽掛在 root container 的
 *   冒泡階段，document 的捕捉階段一定比它先執行，所以這裡 `preventDefault()`／`stopPropagation()` 能擋掉 `<Link>` 的導頁
 *   （手機版點有子選單的項目只展開、不跳轉）。委派也代表之後重新渲染出來的元素（例如登入後換掉的會員選單）不需要重新綁定。
 * - 手風琴的展開／收合動畫用 Web Animations API 取代 jQuery 的 slideUp／slideDown。
 *
 * 回傳的函式會移除所有監聽，給 useEffect 清理用（開發模式 StrictMode 會重複執行 effect）。
 */

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** 跟 jQuery `:visible` 同義：元素有佔版面（display:none 或祖先 display:none 都算不可見） */
function isVisible(el: HTMLElement): boolean {
  return Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function slideUp(el: HTMLElement, duration: number) {
  el.getAnimations().forEach((animation) => animation.cancel());
  if (!isVisible(el)) {
    el.style.display = "none";
    return;
  }
  const height = el.offsetHeight;
  el.style.overflow = "hidden";
  const animation = el.animate({ height: [`${height}px`, "0px"], paddingTop: [getComputedStyle(el).paddingTop, "0px"], paddingBottom: [getComputedStyle(el).paddingBottom, "0px"] }, { duration, easing: "ease" });
  animation.onfinish = () => {
    el.style.display = "none";
    el.style.overflow = "";
  };
}

function slideDown(el: HTMLElement, duration: number) {
  el.getAnimations().forEach((animation) => animation.cancel());
  el.style.display = "block";
  const style = getComputedStyle(el);
  const height = el.offsetHeight;
  el.style.overflow = "hidden";
  const animation = el.animate({ height: ["0px", `${height}px`], paddingTop: ["0px", style.paddingTop], paddingBottom: ["0px", style.paddingBottom] }, { duration, easing: "ease" });
  animation.onfinish = () => {
    el.style.overflow = "";
  };
}

export function setupHeaderNav(): () => void {
  const doc = document;

  const mobileNav = () => doc.querySelector<HTMLElement>(".bsnav-mobile");
  const toggler = () => doc.querySelector<HTMLElement>(".navbar-toggler");
  const closeButton = () => doc.querySelector<HTMLElement>(".bsnavclose");

  function closeMobileNav() {
    const nav = mobileNav();
    if (!nav?.classList.contains("in")) return;
    const button = toggler();
    nav.classList.remove("in");
    button?.classList.remove("active");
    button?.setAttribute("aria-expanded", "false");
    closeButton()?.classList.remove("active");
    doc.body.classList.remove("bsnav-mobile-open");
    doc.documentElement.classList.remove("bsnav-mobile-open");
    if (button && isVisible(button)) button.focus();
  }

  function openMobileNav() {
    const nav = mobileNav();
    if (!nav) return;
    const button = toggler();
    nav.classList.add("in");
    button?.classList.add("active");
    button?.setAttribute("aria-expanded", "true");
    closeButton()?.classList.add("active");
    doc.body.classList.add("bsnav-mobile-open");
    doc.documentElement.classList.add("bsnav-mobile-open");
    closeButton()?.focus();
  }

  function onClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof Element)) return;

    // 手機版漢堡按鈕
    if (target.closest(".navbar-toggler")) {
      event.preventDefault();
      if (mobileNav()?.classList.contains("in")) closeMobileNav();
      else openMobileNav();
      return;
    }

    // 關閉按鈕或遮罩
    if (target.closest(".bsnavclose, .bsnav-mobile-overlay")) {
      event.preventDefault();
      event.stopPropagation();
      closeMobileNav();
      return;
    }

    // 訂閱電子報：捲動到 footer 的訂閱表單
    if (target.closest(".btn-scroll-newsletter")) {
      event.preventDefault();
      const footerTop = doc.querySelector<HTMLElement>(".footer-top");
      if (footerTop) window.scrollTo({ top: footerTop.getBoundingClientRect().top + window.scrollY, behavior: "smooth" });
      return;
    }

    // 手機版下拉子選單（點擊展開／收合）：桌機（>= 992px）是 CSS hover，這裡不處理
    const dropdownToggle = target.closest<HTMLElement>(".navbar-nav .dropdown-toggle");
    if (dropdownToggle && window.innerWidth < 992) {
      const menu = dropdownToggle.parentElement?.querySelector<HTMLElement>(":scope > .dropdown-menu");
      if (!menu) return;
      event.preventDefault();
      event.stopPropagation();

      const item = dropdownToggle.parentElement as HTMLElement;
      item.parentElement?.querySelectorAll<HTMLElement>(":scope > li").forEach((sibling) => {
        if (sibling === item) return;
        sibling.querySelectorAll<HTMLElement>(".dropdown-menu").forEach((siblingMenu) => {
          slideUp(siblingMenu, 200);
          siblingMenu.classList.remove("show");
        });
        sibling.querySelectorAll<HTMLElement>(".dropdown-toggle").forEach((siblingToggle) => {
          siblingToggle.classList.remove("show");
          siblingToggle.setAttribute("aria-expanded", "false");
        });
      });

      if (isVisible(menu)) {
        slideUp(menu, 200);
        menu.classList.remove("show");
        dropdownToggle.classList.remove("show");
        dropdownToggle.setAttribute("aria-expanded", "false");
      } else {
        slideDown(menu, 200);
        menu.classList.add("show");
        dropdownToggle.classList.add("show");
        dropdownToggle.setAttribute("aria-expanded", "true");
      }
    }
  }

  // 鍵盤無障礙控制（ESC 關閉 + Tab 焦點鎖定在側邊欄內）
  function onKeydown(event: KeyboardEvent) {
    const nav = mobileNav();
    if (!nav?.classList.contains("in")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closeMobileNav();
      return;
    }

    if (event.key === "Tab") {
      const focusable = Array.from(nav.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(isVisible);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey) {
        if (doc.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  // 視窗拉大時關閉手機選單
  function onResize() {
    if (window.innerWidth >= 768) closeMobileNav();
  }

  // 桌機版下拉選單 hover / focus 的無障礙屬性同步
  const DESKTOP_DROPDOWN = ".navbar-expand-md .nav-item.dropdown";
  const setExpanded = (item: Element, expanded: boolean) =>
    item.querySelector(".dropdown-toggle")?.setAttribute("aria-expanded", String(expanded));

  function onMouseOver(event: MouseEvent) {
    const item = event.target instanceof Element ? event.target.closest(DESKTOP_DROPDOWN) : null;
    if (item && !(event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) setExpanded(item, true);
  }

  function onMouseOut(event: MouseEvent) {
    const item = event.target instanceof Element ? event.target.closest(DESKTOP_DROPDOWN) : null;
    if (item && !(event.relatedTarget instanceof Node && item.contains(event.relatedTarget))) setExpanded(item, false);
  }

  function onFocusIn(event: FocusEvent) {
    const item = event.target instanceof Element ? event.target.closest(DESKTOP_DROPDOWN) : null;
    if (item) setExpanded(item, true);
  }

  function onFocusOut(event: FocusEvent) {
    const item = event.target instanceof Element ? event.target.closest(DESKTOP_DROPDOWN) : null;
    if (!item) return;
    window.setTimeout(() => {
      if (!item.contains(doc.activeElement)) setExpanded(item, false);
    }, 10);
  }

  doc.addEventListener("click", onClick, true);
  doc.addEventListener("keydown", onKeydown);
  doc.addEventListener("mouseover", onMouseOver);
  doc.addEventListener("mouseout", onMouseOut);
  doc.addEventListener("focusin", onFocusIn);
  doc.addEventListener("focusout", onFocusOut);
  window.addEventListener("resize", onResize);

  return () => {
    doc.removeEventListener("click", onClick, true);
    doc.removeEventListener("keydown", onKeydown);
    doc.removeEventListener("mouseover", onMouseOver);
    doc.removeEventListener("mouseout", onMouseOut);
    doc.removeEventListener("focusin", onFocusIn);
    doc.removeEventListener("focusout", onFocusOut);
    window.removeEventListener("resize", onResize);
  };
}
