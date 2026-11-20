"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 可左右捲動的容器（目前給知識加值 `/talent` 的課程表格用）：手機、平板的表格比畫面寬，捲軸又是隱藏的，
 * 使用者看不出右邊還有欄位，所以加三個提示——
 * 1. 容器上方一條「左右滑動查看更多欄位」提示列：內容真的比容器寬才出現，使用者第一次捲動之後就消失；
 * 2. 右側（捲過之後左側也有）淡出陰影，捲到最右邊時右側陰影消失；
 * 3. 第一次捲動之前，右邊緣多一個小箭頭。
 * 內容放得下（桌機）時什麼都不顯示，也不影響原本的版面。陰影與箭頭不做動畫（有「減少動態效果」設定的使用者不受影響）。
 * 樣式見 `globals.css` 的 `.scroll-hint-*`。
 */
export default function ScrollHintContainer({
  children,
  className,
  hint = "左右滑動查看更多欄位",
  label,
}: {
  children: ReactNode;
  /** 實際負責捲動的那一層（例如 `course-table-container`） */
  className?: string;
  hint?: string;
  /** 捲動區域的無障礙名稱，鍵盤使用者聚焦後可以用方向鍵左右捲動 */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setOverflow(max > 1);
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    // 視窗大小改變（轉向）或內容大小改變（換頁、字體載入）都要重新判斷
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <div className="scroll-hint-wrap">
      {overflow && !scrolled && (
        <p className="scroll-hint-note" role="note">
          <i className="bi bi-arrow-left-right" aria-hidden="true"></i>
          <span>{hint}</span>
        </p>
      )}
      <div className="scroll-hint-frame">
        <div
          ref={ref}
          className={className}
          onScroll={(event) => {
            measure();
            if (event.currentTarget.scrollLeft > 2) setScrolled(true);
          }}
          {...(overflow ? { tabIndex: 0, role: "region", "aria-label": label } : {})}
        >
          {children}
        </div>
        <span className={`scroll-hint-fade scroll-hint-fade-left${overflow && !atStart ? " is-visible" : ""}`} aria-hidden="true" />
        <span className={`scroll-hint-fade scroll-hint-fade-right${overflow && !atEnd ? " is-visible" : ""}`} aria-hidden="true" />
        {overflow && !atEnd && !scrolled && <i className="bi bi-chevron-right scroll-hint-arrow" aria-hidden="true"></i>}
      </div>
    </div>
  );
}
