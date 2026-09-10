"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordField from "@/components/member/PasswordField";
import CaptchaField, { type CaptchaFieldHandle } from "@/components/member/CaptchaField";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth-store";
import { getApiErrorMessage } from "@/lib/error-utils";

/**
 * 積木元件：會員登入表單本體，對應舊站 login.html 的 `.melo_box_left`。
 *
 * 2026-09-10 對接真後端 `POST /api/Auth/login`（見 `lib/api/auth.ts`）：
 * - 原本這頁是純靜態展示（見 git 歷史那版註解），連驗證碼都是張死圖
 *   `/images/all/chksum.jpg`——真後端這個 scenario（`member-login`）
 *   驗證碼是真的有開（`captchaType:2` 圖片驗證碼），不是可以跳過的
 *   裝飾，改用 `CaptchaField` 真的打 `/api/captcha/generate`。
 * - 登入成功後端把 Token 設進 HttpOnly Cookie（不是回應 body），這裡
 *   拿到的只有 `member` 資訊，存進 `useAuthStore` 給畫面顯示「目前是誰
 *   登入」用。
 * - 登入後導去哪裡：舊站原本連去 `member/index.html`（會員中心首頁，
 *   從沒真的做過，login.html 的說明本來就寫了這件事）——2026-09-10
 *   `/member` 會員中心頁面做出來了，改導去那裡。
 * - 密碼錯誤／驗證碼錯誤，後端統一回 `400 { error: "..." }`
 *   （`AuthController.Login`），用 `getApiErrorMessage()` 取出來顯示；
 *   失敗後強制換一組新的驗證碼圖（`captchaRef.refresh()`）——圖片驗證碼
 *   後端驗證過一次就失效，沿用舊的一定會再錯一次。
 */
export default function MemberLoginForm() {
  const router = useRouter();
  const captchaRef = useRef<CaptchaFieldHandle>(null);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const setMember = useAuthStore((s) => s.setMember);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);

    const captcha = captchaRef.current?.getValue();
    if (!captcha) {
      setError("請輸入驗證碼");
      return;
    }

    setSubmitting(true);
    try {
      const { member } = await authApi.login({ email: account, password, captcha });
      setMember(member);
      router.push("/member");
    } catch (err) {
      setError(getApiErrorMessage(err, "登入失敗，請確認帳號密碼是否正確"));
      captchaRef.current?.refresh();
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="melo_box_left" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="memberAccount" className="mb-2">
          會員帳號<span className="text-danger" aria-hidden="true">*</span>
        </label>
        <input
          type="text"
          id="memberAccount"
          className="form-control"
          placeholder="請輸入會員帳號"
          required
          aria-required="true"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          autoComplete="username"
        />
      </div>

      <div className="form-group g-input">
        <div className="so_pass d-flex justify-content-between align-items-center mb-2">
          <label className="mb-0">
            會員密碼<span className="text-danger ms-1" aria-hidden="true">*</span>
          </label>
          <Link href="/member/forgot" title="前往忘記密碼頁面" className="blue">
            <i className="bi bi-question-circle-fill me-1" aria-hidden="true"></i>忘記密碼
          </Link>
        </div>

        <PasswordField value={password} onChange={setPassword} />
      </div>

      <div className="form-group">
        <label className="mb-2">
          驗證碼<span className="text-danger" aria-hidden="true">*</span>
        </label>
        <CaptchaField ref={captchaRef} />
      </div>

      {error && (
        <p className="text-danger mb-3" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <button type="submit" title="登入" className="more_x" style={{ margin: "0 auto" }} disabled={submitting}>
        <span>{submitting ? "登入中…" : "登入"}</span>
        <i className="bi bi-arrow-right" aria-hidden="true"></i>
      </button>
    </form>
  );
}
