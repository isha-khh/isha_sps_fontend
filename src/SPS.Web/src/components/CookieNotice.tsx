"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "sps-cookie-notice-dismissed";

/**
 * 第一次造訪的 Cookie 告知橫幅（固定在畫面底部）。文字、按鈕、連結由後台「頁面設定 → 隱私權政策」維護。
 * 只做「告知」：按下按鈕只是記住「看過了」（存在 localStorage，不另外寫 cookie），不影響網站的任何追蹤行為。
 * 伺服器端不輸出，掛載後才依 localStorage 決定要不要顯示，避免 hydration 不一致；localStorage 讀寫失敗（隱私模式）就每次都顯示，不會壞掉。
 * 樣式在 `globals.css` 的 `.cookie-notice`。
 */
export default function CookieNotice({ message, buttonText, linkText }: { message: string; buttonText: string; linkText?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(STORAGE_KEY) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // 寫不進去也沒關係，只是下次還會再顯示
    }
    setVisible(false);
  };

  return (
    <div className="cookie-notice" role="region" aria-label="Cookie 告知">
      <p className="cookie-notice-text">
        {message}
        {linkText && (
          <>
            {" "}
            <Link href="/privacy" title="前往 隱私權政策">
              {linkText}
            </Link>
          </>
        )}
      </p>
      <button type="button" className="cookie-notice-btn" onClick={dismiss}>
        {buttonText}
      </button>
    </div>
  );
}
