import type { ReactNode } from "react";

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
  return (
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
    </div>
  );
}
