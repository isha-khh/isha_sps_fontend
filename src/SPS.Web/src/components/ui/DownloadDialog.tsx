"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import type { DownloadLink } from "@/lib/types";

const FORMAT_INFO: Record<DownloadLink["kind"], { label: string; hint: string; icon: string }> = {
  docx: { label: "Word 文件格式（.docx）", hint: "適用 Microsoft Word、WPS、LibreOffice 等", icon: "bi-file-earmark-word" },
  odt: { label: "ODF 文件格式（.odt）", hint: "適用 LibreOffice、WPS、Word（另存 ODF）等", icon: "bi-file-earmark-text" },
  pdf: { label: "PDF 格式", hint: "適合直接閱讀與列印", icon: "bi-file-earmark-pdf" },
  link: { label: "前往下載連結", hint: "會另開新視窗，前往外部網站", icon: "bi-box-arrow-up-right" },
};

/**
 * 積木元件：一個「下載」入口。後台「頁面設定 → 下載資源」維護每個下載項目是哪些檔案或哪個外部連結，
 * 這個元件依照目前有幾個選項決定怎麼呈現（`children` 是入口本身的內容，由呼叫端決定長相，
 * 這樣可以套用各頁面既有的版型樣式）：
 *
 * - 沒有任何選項：入口變成不可點的「準備中」狀態（不是失效連結）
 * - 只有一個選項：直接連結——檔案直接下載；外部連結另開新分頁（`noopener`）
 * - 有多個選項（例如 Word／ODF／PDF 三種格式）：入口開一個對話框讓使用者選格式
 *
 * 對話框用 React 自己控制、不依賴 bootstrap 的 modal JS：Esc、點背景會關閉，開啟時鎖住背景捲動，
 * 焦點移進對話框、關閉後還給原本的入口。外觀沿用 bootstrap 的 `.modal`／`.modal-backdrop`
 * class（舊站 CSS 已載入）；舊站 CSS 會把許多頁面的連結文字設成白色（原本放在深色按鈕上），
 * 對話框是白底，所以這裡自己指定文字顏色，並把層級拉到比頁首元素高。
 *
 * `trigger`：入口用 `<a>` 還是 `<button>`——既有版型的 CSS 如果寫的是 `.xxx a`（例如補助專區的快速連結），
 * 就要用 `a`（對話框模式下是 `<a href="#" role="button">`）；寫的是 class 的可以用 `button`。
 */
export default function DownloadDialog({
  links,
  dialogTitle,
  trigger = "a",
  className,
  style,
  children,
  emptyLabel = "準備中",
  alwaysDialog = false,
}: {
  links: DownloadLink[];
  dialogTitle: string;
  trigger?: "a" | "button";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  /** 沒有任何選項時，入口的提示文字（滑鼠移上去顯示） */
  emptyLabel?: string;
  /** 只有一個選項時是否仍然開對話框（預設直接連結） */
  alwaysDialog?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
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
    const el = triggerRef.current;

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      el?.focus();
    };
  }, [open]);

  if (links.length === 0) {
    return (
      <span className={className} style={{ ...style, opacity: 0.55, cursor: "not-allowed" }} aria-disabled="true" title={emptyLabel}>
        {children}
      </span>
    );
  }

  if (links.length === 1 && !alwaysDialog) {
    const only = links[0];
    const external = only.kind === "link";
    return (
      <a
        href={only.url}
        className={className}
        style={style}
        title={external ? `${dialogTitle}（另開新視窗）` : `下載 ${only.fileName}`}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : { download: only.fileName || true })}
      >
        {children}
      </a>
    );
  }

  const openDialog = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    triggerRef.current = event.currentTarget;
    setOpen(true);
  };

  return (
    <>
      {trigger === "button" ? (
        <button type="button" className={className} style={style} aria-haspopup="dialog" title={dialogTitle} onClick={openDialog}>
          {children}
        </button>
      ) : (
        <a href="#" role="button" className={className} style={style} aria-haspopup="dialog" title={dialogTitle} onClick={openDialog}>
          {children}
        </a>
      )}

      {open && (
        <>
          <div className="modal-backdrop fade show download-dialog-backdrop" onClick={() => setOpen(false)}></div>
          <div
            className="modal fade show d-block download-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={dialogTitle}
            tabIndex={-1}
            onClick={(event) => {
              // 點到對話框外面的空白處（.modal 本身）才關閉
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h4 className="modal-title h5">{dialogTitle}</h4>
                  {/* 舊站 CSS 的 .btn-close 是把「X」文字畫成圓形按鈕（見會員註冊完成視窗），所以要放 X 文字 */}
                  <button type="button" ref={closeRef} className="btn-close" aria-label="關閉" onClick={() => setOpen(false)}>
                    X
                  </button>
                </div>
                <div className="modal-body">
                  <p className="mb-3">請選擇要下載的檔案格式：</p>
                  <ul className="list-unstyled mb-0 d-grid gap-3">
                    {links.map((link) => {
                      const info = FORMAT_INFO[link.kind];
                      const external = link.kind === "link";
                      return (
                        <li key={`${link.kind}-${link.url}`}>
                          <a
                            href={link.url}
                            className="format-link d-flex align-items-center gap-3 p-3 border rounded text-decoration-none"
                            title={external ? "另開新視窗" : `下載 ${link.fileName}`}
                            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : { download: link.fileName || true })}
                          >
                            <i className={`bi ${info.icon} fs-2`} aria-hidden="true"></i>
                            <span className="flex-grow-1">
                              <strong className="d-block">{info.label}</strong>
                              <span className="d-block small text-muted">{info.hint}</span>
                              {link.fileName && (
                                <span className="d-block small text-muted">
                                  {link.fileName}
                                  {link.formattedFileSize ? `（${link.formattedFileSize}）` : ""}
                                </span>
                              )}
                            </span>
                            <i className={`bi ${external ? "bi-box-arrow-up-right" : "bi-download"}`} aria-hidden="true"></i>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
            <style>{`
              .download-dialog-backdrop {
                z-index: 100000;
              }
              .download-dialog {
                z-index: 100001;
              }
              .download-dialog .format-link,
              .download-dialog .format-link * {
                color: #1f2937;
              }
              .download-dialog .format-link .text-muted {
                color: #6b7280;
              }
              .download-dialog .format-link:hover,
              .download-dialog .format-link:focus-visible {
                background: #f3f4f6;
              }
            `}</style>
          </div>
        </>
      )}
    </>
  );
}
