"use client";

import { useEffect } from "react";

/**
 * 全站搜尋的快速鍵 `S`。
 *
 * 搜尋入口依視窗寬度有三種版型（見 HeaderSearch.tsx）：≥1400px 的 header 圖示、768–1399px 的懸浮按鈕、
 * <768px 藏在手機選單裡的輸入框；其中兩個同一時間是 `display: none`，瀏覽器的 accesskey 觸發不了隱藏的元素，
 * 所以不能把 accesskey 掛在搜尋按鈕上（原本這樣做，視窗窄一點就按了沒反應）。
 *
 * 改成跟上方／中央／下方區塊的快速鍵一樣，放一個**永遠存在**、只有取得焦點才看得見的連結掛 `accessKey="S"`，
 * 由它依目前看得到的版型打開搜尋：有搜尋按鈕就點它並把游標放進輸入框；手機寬度則打開選單再聚焦。
 * 另外加一層全頁鍵盤監聽（Mac 是 Control + Option + S，Windows／Linux 是 Alt + S，Firefox 的 Alt + Shift + S 也算），
 * 不依賴瀏覽器怎麼處理 accesskey（各家組合鍵與實作有差異、嵌入式瀏覽器甚至不支援）。兩條路都是「打開」而不是「切換」，
 * 同時觸發也不會又關起來。
 */
function focusInput(selector: string): void {
  document.querySelector<HTMLInputElement>(selector)?.focus();
}

function openSearch(): void {
  const toggle = Array.from(document.querySelectorAll<HTMLButtonElement>(".header-search-toggle")).find(
    (button) => button.getClientRects().length > 0,
  );

  if (toggle) {
    // header／懸浮版型：沒展開就點開（HeaderSearch 展開後會自己 focus），已展開就只要把游標放回輸入框
    if (toggle.getAttribute("aria-expanded") === "true") focusInput("#header-search-panel input");
    else toggle.click();
    return;
  }

  // 手機寬度：搜尋框在選單面板裡，先打開選單（面板開啟時有 `.in`），等轉場後再聚焦
  const panel = document.querySelector(".bsnav-mobile");
  const burger = document.querySelector<HTMLButtonElement>(".navbar-toggler");
  if (burger && panel && !panel.classList.contains("in")) burger.click();
  window.setTimeout(() => focusInput(".header-search-inline input"), 350);
}

export default function SearchAccesskey() {
  useEffect(() => {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "KeyS" || event.metaKey) return;
      // Mac：Control + Option；其他：Alt（Firefox 另加 Shift，一併接受）。不接受單獨的 S 或 Ctrl + S（存檔）
      const matched = isMac ? event.ctrlKey && event.altKey : event.altKey && !event.ctrlKey;
      if (!matched) return;
      event.preventDefault();
      openSearch();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <a
      href="#"
      accessKey="S"
      title="全站搜尋"
      className="visually-hidden-focusable"
      onClick={(event) => {
        event.preventDefault();
        openSearch();
      }}
    >
      ::: 全站搜尋
    </a>
  );
}
