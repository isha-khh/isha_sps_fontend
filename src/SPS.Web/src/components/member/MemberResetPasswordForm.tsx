"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import PasswordField from "@/components/member/PasswordField";
import { authApi } from "@/lib/api/auth";
import { getApiErrorMessage } from "@/lib/error-utils";

/**
 * 積木元件：重設密碼表單。忘記密碼信裡的連結是 `/member/reset-password?token=…`，
 * 這個頁面原本不存在（連結 404），現在接 `GET /api/Auth/validate-reset-token`（先確認連結還有效）
 * 與 `POST /api/Auth/reset-password`。
 *
 * 流程：載入時先驗證 token → 無效／過期就直接告知並導向重新申請，不顯示表單；
 * 有效才顯示「新密碼＋確認新密碼」。密碼規則（長度、複雜度）由後端檢查，錯誤訊息直接顯示。
 * 成功後 token 就失效，導去登入頁。
 */
export default function MemberResetPasswordForm({ token }: { token: string }) {
  const [state, setState] = useState<"checking" | "invalid" | "ready" | "done">(token ? "checking" : "invalid");
  const [email, setEmail] = useState<string>();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi
      .validateResetToken(token)
      .then((r) => {
        if (cancelled) return;
        setEmail(r.email);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("invalid");
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    if (!newPassword || !confirmPassword) {
      setError("請輸入新密碼並再輸入一次確認");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("兩次輸入的密碼不一致");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword({ token, newPassword, confirmPassword });
      setState("done");
    } catch (err) {
      setError(getApiErrorMessage(err, "重設密碼失敗，請稍後再試"));
    } finally {
      setSubmitting(false);
    }
  }

  if (state === "checking") {
    return <p className="text-center py-4">驗證連結中…</p>;
  }

  if (state === "invalid") {
    return (
      <div className="melo_box_left w-100">
        <p className="text-center mb-4" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1 text-danger" aria-hidden="true"></i>
          這個重設密碼連結無效或已過期（連結有效時間為 30 分鐘，且只能使用一次）。
        </p>
        <Link href="/member/forgot" title="重新申請" className="more_x" style={{ margin: "0 auto" }}>
          <span>重新申請</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="melo_box_left w-100">
        <p className="text-center mb-4" role="status">
          <i className="bi bi-check-circle-fill me-1 text-success" aria-hidden="true"></i>
          密碼已重設，請使用新密碼登入。
        </p>
        <Link href="/member/login" title="前往登入" className="more_x" style={{ margin: "0 auto" }}>
          <span>前往登入</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>
    );
  }

  return (
    <form className="melo_box_left w-100" onSubmit={handleSubmit} noValidate>
      {email && <p className="mb-3">為帳號 <strong>{email}</strong> 設定新密碼</p>}

      <div className="form-group g-input">
        <label className="mb-2">
          新密碼<span className="text-danger ms-1" aria-hidden="true">*</span>
        </label>
        <PasswordField label="新密碼" placeholder="請輸入新密碼" value={newPassword} onChange={setNewPassword} />
      </div>

      <div className="form-group g-input">
        <label className="mb-2">
          確認新密碼<span className="text-danger ms-1" aria-hidden="true">*</span>
        </label>
        <PasswordField label="確認新密碼" placeholder="請再輸入一次新密碼" value={confirmPassword} onChange={setConfirmPassword} />
      </div>

      {error && (
        <p className="text-danger mb-3" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <button type="submit" title="送出" className="more_x" style={{ margin: "0 auto" }} disabled={submitting}>
        <span>{submitting ? "送出中…" : "設定新密碼"}</span>
        <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </button>
    </form>
  );
}
