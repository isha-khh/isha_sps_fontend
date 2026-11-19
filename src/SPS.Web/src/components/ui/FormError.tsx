"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { focusFirstInvalidField } from "@/lib/form-focus";

/**
 * 表單送出被擋下來或失敗時顯示的錯誤訊息，順便把鍵盤焦點帶到出錯的地方
 * （無障礙檢測 GN2330300E：要有讓使用者「跳到出錯之處」的機制）。
 *
 * 出現時（掛載）：附近還有沒填的必填欄位就聚焦第一個，沒有（例如「密碼錯誤」這類伺服器端的錯誤）就聚焦這則訊息本身，
 * 螢幕閱讀器會直接念出內容。找欄位的範圍是最近的表單／對話框／主要內容區。
 * 呼叫端照舊用 `{error && <FormError>{error}</FormError>}`；送出前先 `setError(null)` 的表單，
 * 每次重新送出失敗訊息都會重新出現、重新聚焦。
 */
export default function FormError({
  as: Tag = "p",
  className,
  style,
  children,
}: {
  as?: "p" | "div" | "span";
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    focusFirstInvalidField(element.closest("form, [role=dialog], .modal, main"), element);
  }, []);

  return (
    <Tag ref={ref as never} role="alert" tabIndex={-1} className={className} style={style}>
      {children}
    </Tag>
  );
}
