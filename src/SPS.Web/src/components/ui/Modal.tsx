"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * 積木元件：bootstrap modal 對話框，對應舊站 serve/show.html 裡的
 * 「個資蒐集條款」彈窗（`#staticBackdrop`）。
 *
 * 跟 Tabs 是同一種做法：不用 React state 管開關，靠已經整站載入的
 * bootstrap.bundle.min.js 認得 `data-bs-toggle="modal"`／
 * `data-bs-target="#xxx"` 屬性就會動。要開啟這個 modal，隨便一個
 * 按鈕/連結加上：
 *   <button data-bs-toggle="modal" data-bs-target={`#${id}`}>開啟</button>
 *
 * 這是通用的對話框外殼，之後其他地方要彈條款/提示視窗都可以重複用，
 * 不用每次重寫一次 modal 的骨架。
 *
 * **彈窗一律掛到 `<body>` 底下（portal）**（issue #26、#45）：bootstrap 的背景遮罩（`.modal-backdrop`，z-index 1050）是加在 `<body>` 底下，
 * 而頁面的 `<main>` 有 `position:relative; z-index:10`，自成一個堆疊層——彈窗如果放在 `<main>` 裡面（例如卡片、表單旁邊），
 * 它的 z-index（1055）只在 `<main>` 這層裡比，永遠比遮罩低，遮罩會蓋住整個彈窗、攔截所有點擊（畫面反黑、點不動）。
 * 掛到 `<body>` 就沒有這個問題，呼叫端想把 `<Modal>` 放在哪裡都可以。伺服器端渲染時不輸出（掛載後才出現），開關靠
 * `data-bs-toggle`／`data-bs-target` 屬性，點擊時彈窗一定已經掛上去了。
 *
 * `dialogClassName` 是選填的額外 class，加在 `.modal-dialog` 上——
 * 設計稿有些對話框（例如媒合對接「我要刊登」）額外掛
 * `modal-dialog_w7`（`css/style.css` 定義 `max-width:70%`，比
 * bootstrap 預設寬），沒給就維持原本的寬度。
 */
export default function Modal({
  id,
  title,
  children,
  dialogClassName,
}: {
  id: string;
  title: string;
  children: ReactNode;
  dialogClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="modal fade" id={id} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={`${id}Label`} aria-hidden="true">
      <div className={`modal-dialog modal-dialog-centered${dialogClassName ? ` ${dialogClassName}` : ""}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title" id={`${id}Label`}>
              {title}
            </h4>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="關閉對話框" title="關閉對話框">
              X
            </button>
          </div>

          <div className="modal-body">{children}</div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
