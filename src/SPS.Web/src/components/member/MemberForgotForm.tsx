"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import CaptchaField, { type CaptchaFieldHandle } from "@/components/member/CaptchaField";
import { authApi } from "@/lib/api/auth";
import { captchaApi } from "@/lib/api/captcha";
import { getApiErrorMessage } from "@/lib/error-utils";

/**
 * 積木元件：忘記密碼表單，對應舊站 forgot.html 的 `.melo_box_left`。
 *
 * 原本整頁是純靜態（「送出」只是連回登入頁，沒有寄任何信），而且信裡的重設連結指向的
 * `/member/reset-password` 這個頁面也不存在，等於整條密碼找回流程是壞的。現在接
 * `POST /api/Auth/forgot-password`，信裡的連結由 `app/member/reset-password` 接手。
 *
 * 送出成功一律顯示同樣的訊息：後端刻意不透露「這個信箱有沒有註冊」（防止帳號枚舉），
 * 同一個信箱 1 分鐘內重複送也一樣回成功但不再寄信，所以訊息要寫成「若信箱已註冊…」。
 * 驗證碼錯誤、操作太頻繁（429）等錯誤直接顯示後端訊息，失敗後換一組新的驗證碼
 * （圖片驗證碼後端驗證過一次就失效）。
 */
export default function MemberForgotForm() {
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  // 預設顯示驗證碼，載入到設定後若後台沒有開 forgot-password 場景就收起來、也不要求輸入
  const [captchaEnabled, setCaptchaEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    captchaApi
      .getPublicSettings("forgot-password")
      .then((s) => {
        if (!cancelled) setCaptchaEnabled(s.enabled);
      })
      .catch(() => {
        // 取不到設定就維持顯示：多要一個驗證碼比少一道防線安全
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (!email.trim()) {
      setError("請輸入申請會員時填寫的電子信箱");
      return;
    }
    const captcha = captchaEnabled ? captchaRef.current?.getValue() : undefined;
    if (captchaEnabled && !captcha) {
      setError("請輸入驗證碼");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email: email.trim(), captcha: captcha ?? undefined });
      setSent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "送出失敗，請稍後再試"));
      captchaRef.current?.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="melo_box_left w-100">
        <p className="text-center mb-3" role="status">
          <i className="bi bi-envelope-check-fill me-1" aria-hidden="true"></i>
          若這個信箱已註冊為會員，我們已寄出重設密碼的信件，請在 30 分鐘內點信中的連結設定新密碼。
        </p>
        <p className="text-center mb-4">沒收到的話，請先檢查垃圾郵件匣，或稍後（1 分鐘後）再試一次。</p>
        <Link href="/member/login" title="回登入頁" className="more_x" style={{ margin: "0 auto" }}>
          <span>回登入頁</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>
    );
  }

  return (
    <form className="melo_box_left w-100" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="forgotEmail" className="mb-2">
          會員電子信箱<span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          type="email"
          id="forgotEmail"
          className="form-control"
          placeholder="請輸入申請會員時填寫的電子信箱"
          required
          aria-required="true"
          maxLength={320}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {captchaEnabled && (
        <div className="form-group">
          <label className="mb-2">
            驗證碼<span className="text-danger" aria-hidden="true">*</span>
          </label>
          <CaptchaField ref={captchaRef} />
        </div>
      )}

      {error && (
        <p className="text-danger mb-3" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <button type="submit" title="送出" className="more_x" style={{ margin: "0 auto" }} disabled={submitting}>
        <span>{submitting ? "送出中…" : "送出"}</span>
        <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </button>
    </form>
  );
}
