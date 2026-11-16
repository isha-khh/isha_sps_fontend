"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api/auth";
import { memberprofileApi } from "@/lib/api/memberprofile";
import { VerificationCodePurpose } from "@/types/memberprofile";
import { getApiErrorMessage } from "@/lib/error-utils";
import { readNextFromLocation } from "@/lib/login-next";

/** 寄驗證碼後要等多久才能再寄（後端冷卻期是 60 秒，這裡跟著擋，避免按了只拿到錯誤訊息） */
const RESEND_SECONDS = 60;

/**
 * 積木元件：驗證電子信箱。登入後信箱還沒驗證的會員（新註冊審核通過後第一次登入，或過去沒驗證過的舊會員）
 * 會被導來這裡：按「寄送驗證碼」→ 到信箱收 6 位數驗證碼 → 輸入後驗證，成功就回到原本要去的頁面（`?next=`）或會員中心。
 * Passkey 登入也一樣要驗證。接 `POST /api/member/send-verification-code`（用途＝驗證信箱）與 `POST /api/member/verify-email`。
 */
export default function EmailVerifyForm() {
  const router = useRouter();
  const { member, loading, fetchProfile, setMember, clear } = useAuthStore();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    void fetchProfile();
    // 只在掛載時查一次登入狀態
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 已經驗證過（或郵件服務停用不需要驗證）就不用留在這頁
  useEffect(() => {
    if (member && !member.requireEmailVerification) router.replace(readNextFromLocation() ?? "/member");
  }, [member, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSend() {
    setError(undefined);
    setSending(true);
    try {
      await memberprofileApi.sendVerificationCode(VerificationCodePurpose.VerifyEmail);
      setSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(getApiErrorMessage(err, "寄送驗證碼失敗，請稍後再試"));
    } finally {
      setSending(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("請輸入 6 位數字的驗證碼");
      return;
    }
    if (!member) return;
    setVerifying(true);
    try {
      await memberprofileApi.verifyEmail(code.trim());
      setMember({ ...member, requireEmailVerification: false });
      router.push(readNextFromLocation() ?? "/member");
    } catch (err) {
      setError(getApiErrorMessage(err, "驗證失敗，請確認驗證碼是否正確"));
    } finally {
      setVerifying(false);
    }
  }

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // 登出 API 失敗也要把本地狀態清掉
    } finally {
      clear();
      router.push("/member/login");
    }
  }

  if (loading || (member && !member.requireEmailVerification)) {
    return <p className="text-muted">載入中…</p>;
  }

  if (!member) {
    return (
      <div className="melo_box_left w-100">
        <p className="text-center mb-3">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          尚未登入或登入已過期，請重新登入。
        </p>
        <Link href="/member/login" title="前往登入" className="more_x" style={{ margin: "0 auto" }}>
          <span>前往登入</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </Link>
      </div>
    );
  }

  return (
    <form className="melo_box_left w-100" onSubmit={handleVerify} noValidate>
      <p className="mb-3">
        為了確保帳號安全，請先驗證您的電子信箱：<strong>{member.email}</strong>
      </p>
      <p className="mb-4">按下「寄送驗證碼」後，請到信箱收取 6 位數驗證碼（5 分鐘內有效），沒收到請檢查垃圾郵件匣。</p>

      <div className="form-group">
        <button type="button" className="tier-reset-btn" onClick={() => void handleSend()} disabled={sending || cooldown > 0}>
          <i className="bi bi-envelope me-1" aria-hidden="true"></i>
          {sending ? "寄送中…" : cooldown > 0 ? `已寄出，${cooldown} 秒後可重寄` : sent ? "重新寄送驗證碼" : "寄送驗證碼"}
        </button>
      </div>

      <div className="form-group">
        <label htmlFor="emailVerifyCode" className="mb-2">
          驗證碼<span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="emailVerifyCode"
          className="form-control"
          placeholder="請輸入 6 位數驗證碼"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          required
          aria-required="true"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        />
      </div>

      {error && (
        <p className="text-danger mb-3" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <button type="submit" title="驗證" className="more_x" style={{ margin: "0 auto" }} disabled={verifying}>
        <span>{verifying ? "驗證中…" : "驗證"}</span>
        <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </button>

      <p className="text-center mt-4 mb-1">
        收不到驗證碼？請聯絡管理員（聯絡方式見頁尾）。
      </p>
      <p className="text-center mb-0">
        <button type="button" className="tier-reset-btn" onClick={() => void handleLogout()}>
          登出
        </button>
      </p>
    </form>
  );
}
