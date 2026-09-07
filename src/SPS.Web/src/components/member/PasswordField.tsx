"use client";

import { useId, useState } from "react";

/**
 * 積木元件：會員密碼欄位，右側「顯示/隱藏密碼」眼睛圖示按鈕。
 *
 * 對應舊站 login.html／forgot.html／p03.html 共用的 `.icon-eyes` jQuery
 * 行為（`data-id` 找到對應 input，切換 `type="password"`/`"text"` 跟圖示），
 * 這裡改成 React state 控制，行為一致。
 */
export default function PasswordField({
  label = "會員密碼",
  placeholder = "請輸入會員密碼",
  required = true,
  disabled = false,
  defaultValue,
}: {
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();

  return (
    <div className="pwd position-relative">
      <input
        type={visible ? "text" : "password"}
        className="form-control pe-5"
        id={inputId}
        placeholder={placeholder}
        required={required}
        aria-required={required}
        aria-label={label}
        disabled={disabled}
        defaultValue={defaultValue}
      />

      <button
        type="button"
        className="btn icon-eyes position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "隱藏密碼" : "顯示密碼"}
        title={visible ? "隱藏密碼" : "顯示密碼"}
        aria-pressed={visible}
      >
        <i className={`bi ${visible ? "bi-eye" : "bi-eye-slash"}`} aria-hidden="true"></i>
      </button>
    </div>
  );
}
