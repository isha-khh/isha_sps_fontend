"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";

export interface LightboxOptions {
  [key: string]: unknown;
  autoFocus?: boolean;
  trapFocus?: boolean;
  dragToClose?: boolean;
  backdropClick?: boolean;
}

/**
 * 積木元件：fancybox 的「inline 內容彈窗」，對應舊站首頁 index.html 的
 * `#welcome-modal`（進站自動彈出的公告）。
 *
 * 跟 [ui/Modal.tsx](./Modal.tsx)（bootstrap 版對話框）不是同一套系統，
 * 沒有硬凹成一個共用元件——bootstrap modal 適合表單/純文字這種「頁面
 * 裡的一塊」，用 `data-bs-toggle` 讓 bootstrap 自己的 JS 處理；fancybox
 * 是做圖片/影音燈箱起家的，選項（拖曳關閉、焦點鎖定…）跟開啟方式都
 * 不一樣，兩個維持各自的積木，對應各自適合的場景。
 *
 * 兩種用法：
 * 1. 進站自動彈出（`autoOpen`）——原本 WelcomeModal 那種：
 *      <Lightbox id="welcome-modal" autoOpen>
 *        <img src="..." alt="..." />
 *      </Lightbox>
 * 2. 點圖放大（不用 `autoOpen`，交給整站已經在跑的
 *    `Fancybox.bind('[data-fancybox]', ...)` 全域綁定，見
 *    coreScript.js）——這種不需要 Lightbox，直接幫 `<a>` 加
 *    `data-fancybox` 屬性就好，見 [ZoomableImage.tsx](./ZoomableImage.tsx)。
 */
export default function Lightbox({
  id,
  children,
  className = "Fancy_home",
  style,
  autoOpen = false,
  options = { autoFocus: true, trapFocus: true, dragToClose: false, backdropClick: true },
}: {
  id: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** 掛載時是否自動彈出（原本 WelcomeModal 的行為） */
  autoOpen?: boolean;
  options?: LightboxOptions;
}) {
  useEffect(() => {
    if (!autoOpen) return;

    const timer = setTimeout(() => {
      window.Fancybox?.show([{ src: `#${id}`, type: "inline" }], options);
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpen, id]);

  return (
    <div id={id} className={className} style={{ display: "none", ...style }}>
      {children}
    </div>
  );
}
