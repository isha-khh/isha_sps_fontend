"use client";

import { useEffect, useRef, useState } from "react";
import type { ContributeFormat } from "@/lib/types";
import { withBasePath } from "@/lib/api-client";

const FORMAT_INFO: Record<ContributeFormat["kind"], { label: string; hint: string; icon: string }> = {
  docx: { label: "Word 文件格式（.docx）", hint: "適用 Microsoft Word、WPS、LibreOffice 等", icon: "bi-file-earmark-word" },
  odt: { label: "ODF 文件格式（.odt）", hint: "適用 LibreOffice、WPS、Word（另存 ODF）等", icon: "bi-file-earmark-text" },
  pdf: { label: "PDF 格式", hint: "適合先閱讀填寫說明", icon: "bi-file-earmark-pdf" },
};

/**
 * 積木元件：「下載投稿格式」按鈕與選擇格式的對話框（ODF／PDF）。
 *
 * 投稿格式檔（Word .docx、ODF .odt、PDF）由後台「內容管理 → 頁面設定 → 我要投稿」維護（或隨程式碼 seed）；對話框只列出目前真的有的格式：
 * - 沒有任何格式：按鈕變成不可點的「投稿格式準備中」，不顯示失效連結
 * - 只有一種格式：一樣開對話框（讓使用者看得到檔名與大小，知道點下去會下載什麼）
 *
 * 對話框用 React 自己控制、不依賴 bootstrap 的 modal JS：Esc、點背景會關閉，開啟時鎖住背景捲動，
 * 焦點移進對話框、關閉後還給原本的按鈕。下載連結用 `download` 屬性，不開新分頁。
 * 外觀沿用 bootstrap 的 `.modal`／`.modal-backdrop` class（舊站 CSS 已載入）。
 */
export default function ContributeFormatDialog({ formats }: { formats: ContributeFormat[] }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const trigger = triggerRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const arrow = (
    <div className="con-arrow" aria-hidden="true">
      <img className="img-fluid d-block" src={withBasePath("/images/home/arrow.svg")} alt="" />
    </div>
  );

  if (formats.length === 0) {
    return (
      <span className="contribute_more_1" aria-disabled="true" style={{ opacity: 0.6, cursor: "not-allowed" }} title="投稿格式準備中">
        <i className="bi bi-file-earmark-arrow-down me-1" aria-hidden="true"></i>
        <span>投稿格式準備中</span>
        {arrow}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        className="contribute_more_1 border-0"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        title="下載投稿格式"
      >
        <i className="bi bi-file-earmark-arrow-down me-1" aria-hidden="true"></i>
        <span>下載投稿格式</span>
        {arrow}
      </button>

      {open && (
        <>
          <div className="modal-backdrop fade show contribute-format-backdrop" onClick={() => setOpen(false)}></div>
          <div
            className="modal fade show d-block contribute-format-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="contribute-format-title"
            tabIndex={-1}
            onClick={(event) => {
              // 點到對話框外面的空白處（.modal 本身）才關閉
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title h5" id="contribute-format-title">
                    下載投稿格式
                  </h4>
                  {/* 舊站 CSS 的 .btn-close 是把「X」文字畫成圓形按鈕（見會員註冊完成視窗），所以要放 X 文字 */}
                  <button type="button" ref={closeRef} className="btn-close" aria-label="關閉" onClick={() => setOpen(false)}>
                    X
                  </button>
                </div>
                <div className="modal-body">
                  <p className="mb-3">請選擇要下載的檔案格式：</p>
                  <ul className="list-unstyled mb-0 d-grid gap-3">
                    {formats.map((format) => {
                      const info = FORMAT_INFO[format.kind];
                      return (
                        <li key={format.kind}>
                          <a
                            href={format.url}
                            download={format.fileName}
                            className="format-link d-flex align-items-center gap-3 p-3 border rounded text-decoration-none"
                            title={`下載 ${format.fileName}`}
                          >
                            <i className={`bi ${info.icon} fs-2`} aria-hidden="true"></i>
                            <span className="flex-grow-1">
                              <strong className="d-block">{info.label}</strong>
                              <span className="d-block small text-muted">{info.hint}</span>
                              <span className="d-block small text-muted">
                                {format.fileName}
                                {format.formattedFileSize ? `（${format.formattedFileSize}）` : ""}
                              </span>
                            </span>
                            <i className="bi bi-download" aria-hidden="true"></i>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            <style>{`
              /* 頁首選單裡的 logo、「訂閱電子報」按鈕等元素的 z-index 比 bootstrap 預設的對話框高，
                 會浮在背景遮罩和對話框上面（對話框最上面被蓋住），所以把對話框與遮罩拉到比它們都高 */
              .contribute-format-backdrop {
                z-index: 100000;
              }
              .contribute-format-dialog {
                z-index: 100001;
              }
              /* 舊站 CSS 在這個頁面把連結文字設成白色（原本是放在深色底的按鈕上），
                 對話框是白底，不指定顏色會整行字與圖示都看不見 */
              .contribute-format-dialog .format-link,
              .contribute-format-dialog .format-link * {
                color: #1f2937;
              }
              .contribute-format-dialog .format-link .text-muted {
                color: #6b7280;
              }
              .contribute-format-dialog .format-link:hover,
              .contribute-format-dialog .format-link:focus-visible {
                background: #f3f4f6;
              }
            `}</style>
          </div>
        </>
      )}
    </>
  );
}
