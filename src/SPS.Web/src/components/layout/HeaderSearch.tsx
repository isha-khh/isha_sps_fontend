"use client";

import { useEffect, useRef, useState } from "react";
import { withBasePath } from "@/lib/api-client";

/**
 * Header 的全站搜尋：圖示按鈕展開一個輸入框，送出後導到 `/search?q=`。
 *
 * 舊站 header（page/_uc/nav.html）沒有搜尋框，是 2026-10-02 新增的。用原生
 * `<form method="get">` 送出，不依賴 router，JS 還沒載入也能搜。展開後自動 focus，
 * 按 Esc 或點面板外面會收起來。
 *
 * 兩種版型（`variant`）：
 * - `header`：header 列上的圖示按鈕＋展開面板，只在 ≥1400px 才顯示。桌機版主選單
 *   `padding` 本來就只有 6px，實測 1024px 時只剩約 25px 空間，放一顆 28px 以上的按鈕會讓
 *   選單文字折行；≥1200px 又因為版面左右留白變大而更擠（1280px 不加搜尋主選單就已經折行），
 *   實測要到 1536px 才有餘裕，1440px 放得下。
 * - `panel`：手機版選單面板（<768px）頂端直接放一個輸入框，不用先點圖示。
 * - `float`：768–1399px 的懸浮按鈕（固定在視窗右下角）。這個寬度的 header 一個多餘的按鈕都放不下
 *   （放進選單列會折行、放在 header 其他位置會跟 logo／電子報按鈕打架），所以不跟 header 搶空間，
 *   改成不會被捲走的懸浮入口；展開的面板往上長，避免被視窗底部切到。
 */
export default function HeaderSearch({ variant = "header" }: { variant?: "header" | "panel" | "float" }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (variant === "panel") {
    return (
      <form className="header-search-inline" role="search" method="get" action={withBasePath("/search")}>
        <input type="search" name="q" className="form-control" placeholder="搜尋公告、案例、常見問題…" aria-label="搜尋關鍵字" maxLength={100} required />
        <button type="submit" className="btn btn-primary" title="搜尋">
          <i className="bi bi-search" aria-hidden="true"></i>
          <span className="visually-hidden">搜尋</span>
        </button>
        <style>{`
          .header-search-inline {
            display: flex;
            gap: 8px;
            /* 上面留空間給面板右上角的關閉按鈕（.bsnavclose），不然會蓋到搜尋按鈕 */
            padding: 56px 16px 8px;
          }
        `}</style>
      </form>
    );
  }

  const isFloat = variant === "float";

  // float 不能加 `position-relative`：Bootstrap 這個 class 是 `!important`，會蓋掉懸浮用的 `position: fixed`
  return (
    <div className={`header-search header-search--${variant} ${isFloat ? "" : "position-relative me-2"}`} ref={wrapRef}>
      <button
        type="button"
        className={`btn ${isFloat ? "btn-primary shadow" : "btn-light"} rounded-circle header-search-toggle`}
        aria-label="開啟全站搜尋"
        aria-expanded={open}
        aria-controls="header-search-panel"
        title="全站搜尋"
        onClick={() => setOpen((v) => !v)}
      >
        <i className="bi bi-search" aria-hidden="true"></i>
      </button>

      {open && (
        <form id="header-search-panel" className="header-search-panel" role="search" method="get" action={withBasePath("/search")}>
          <input ref={inputRef} type="search" name="q" className="form-control" placeholder="搜尋公告、案例、常見問題…" aria-label="搜尋關鍵字" maxLength={100} required />
          <button type="submit" className="btn btn-primary" title="搜尋">
            <i className="bi bi-search" aria-hidden="true"></i>
            <span className="visually-hidden">搜尋</span>
          </button>
        </form>
      )}

      <style>{`
        .header-search--header {
          display: none;
        }

        @media (min-width: 1400px) {
          .header-search--header {
            display: block;
          }
        }

        .header-search--float {
          display: none;
        }

        @media (min-width: 768px) and (max-width: 1399.98px) {
          .header-search--float {
            display: block;
            position: fixed;
            right: 16px;
            bottom: 24px;
            z-index: 1100;
          }

          /* 懸浮在右下角：面板往上長 */
          .header-search--float .header-search-panel {
            top: auto;
            bottom: calc(100% + 10px);
          }
        }

        .header-search-toggle {
          width: 40px;
          height: 40px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .header-search-panel {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          z-index: 1200;
          display: flex;
          gap: 8px;
          width: min(340px, calc(100vw - 32px));
          padding: 12px;
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }
      `}</style>
    </div>
  );
}
