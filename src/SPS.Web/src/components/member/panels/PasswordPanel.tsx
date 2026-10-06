"use client";

import { useEffect, useRef, useState } from "react";
import PasswordField from "@/components/member/PasswordField";
import { memberprofileApi } from "@/lib/api/memberprofile";
import { VerificationCodePurpose } from "@/types/memberprofile";
import { getApiErrorMessage } from "@/lib/error-utils";

const RESEND_SECONDS = 60;

/**
 * 積木元件：會員中心「變更密碼」面板，接 `POST /api/member/send-verification-code`（用途＝變更密碼）與
 * `POST /api/member/change-password`。流程：先寄驗證碼到會員信箱，再填驗證碼與新密碼（至少 8 個字元，
 * 不能與目前密碼相同；規則由後端檢查，訊息直接顯示）。驗證碼 60 秒內不能重寄（前端提示，後端也有頻率限制）。
 */
export default function PasswordPanel() {
  const [email, setEmail] = useState<string>();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [sending, setSending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;
    memberprofileApi
      .getMembersProfile()
      .then((profile) => mounted && setEmail(profile.email))
      .catch((err) => mounted && setError(getApiErrorMessage(err, "載入會員資料失敗")));
    return () => {
      mounted = false;
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function startCooldown() {
    setCooldown(RESEND_SECONDS);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCooldown((value) => {
        if (value <= 1 && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
        return Math.max(0, value - 1);
      });
    }, 1000);
  }

  async function sendCode() {
    setSending(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await memberprofileApi.sendVerificationCode(VerificationCodePurpose.ChangePassword);
      setMessage(`驗證碼已寄到 ${email ?? "您的信箱"}，請於信中查看（有效時間內請盡快使用）。`);
      startCooldown();
    } catch (err) {
      setError(getApiErrorMessage(err, "寄送驗證碼失敗，請稍後再試"));
    } finally {
      setSending(false);
    }
  }

  async function save() {
    setError(undefined);
    setMessage(undefined);
    if (!email) return setError("無法取得會員信箱，請重新整理頁面");
    if (!/^\d{6}$/.test(code.trim())) return setError("請輸入 6 位數的驗證碼");
    if (newPassword.length < 8) return setError("新密碼至少 8 個字元");
    if (newPassword !== confirmPassword) return setError("確認密碼與新密碼不一致");

    setSaving(true);
    try {
      await memberprofileApi.changePassword({ email, verificationCode: code.trim(), newPassword, confirmPassword });
      setCode("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("密碼已更新，下次登入請使用新密碼。");
    } catch (err) {
      setError(getApiErrorMessage(err, "變更密碼失敗，請稍後再試"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="menb_inp_box d-flex">
      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2">會員帳號（Email）</label>
        <input type="text" className="form-control" value={email ?? ""} disabled />
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2" htmlFor="pwd-code">
          驗證碼
        </label>
        <div className="d-flex gap-2">
          <input
            id="pwd-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            className="form-control"
            placeholder="請輸入 6 位數驗證碼"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button type="button" className="tier-reset-btn flex-shrink-0" onClick={() => void sendCode()} disabled={sending || cooldown > 0 || !email}>
            {sending ? "寄送中…" : cooldown > 0 ? `${cooldown} 秒後可重寄` : "寄送驗證碼"}
          </button>
        </div>
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2">新密碼（至少 8 個字元）</label>
        <PasswordField label="新密碼" placeholder="請輸入新密碼" value={newPassword} onChange={setNewPassword} />
      </div>

      <div className="menb_inp_tit form-group w-100">
        <label className="mb-2">確認新密碼</label>
        <PasswordField label="確認新密碼" placeholder="請再輸入一次新密碼" value={confirmPassword} onChange={setConfirmPassword} />
      </div>

      {message && (
        <p className="text-success w-100 mb-0">
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
          {message}
        </p>
      )}
      {error && (
        <p className="text-danger w-100 mb-0" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <div className="w-100">
        <button type="button" className="tier-submit-btn" onClick={() => void save()} disabled={saving}>
          <span>{saving ? "儲存中…" : "變更密碼"}</span>
        </button>
      </div>
    </div>
  );
}
