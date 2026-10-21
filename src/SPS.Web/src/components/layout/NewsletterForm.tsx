"use client";

import { useRef, useState } from "react";

/** Newsleopard（電子報服務）的訂閱表單端點；送出後由 Newsleopard 寄驗證信，點信件連結才算完成訂閱 */
const NEWSLEOPARD_SUBSCRIBE_URL = "https://api-backend.app.newsleopard.com/api/contacts/subscribe/4028985e972b1435019733375b860449/verify";

/**
 * 頁尾「訂閱電子報」，原本是 `Footer`（伺服器元件）裡純展示的標記，2026-10-06 抽成 client 元件。
 * 2026-10-21 起訂閱直接送到 Newsleopard（電子報寄送服務，嵌入碼的 form POST 改成 fetch），不再存進後台「詢問單」；
 * 「產業代碼」欄位已取消，只收電子郵件。Newsleopard 會寄驗證信給訂閱者，點信件連結才完成訂閱。
 * 頁尾文案已說明「訂閱即表示同意蒐集電子郵件」。
 *
 * 版面是 `.footer_right` 固定的一列（信箱＋按鈕），沒有多餘空間放訊息：錯誤用瀏覽器原生的驗證提示泡泡
 * （`setCustomValidity` + `reportValidity`）顯示，成功則把按鈕暫時改成「請收驗證信」。
 * 要換電子報帳號／表單時改 `NEWSLEOPARD_SUBSCRIBE_URL`（CSP 的 `connect-src` 在 `src/proxy.ts`，換網域要一起改）。
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const emailRef = useRef<HTMLInputElement>(null);

  function showError(message: string) {
    const input = emailRef.current;
    if (!input) return;
    input.setCustomValidity(message);
    input.reportValidity();
  }

  async function submit() {
    if (state !== "idle") return;
    const input = emailRef.current;
    input?.setCustomValidity("");
    if (!input?.checkValidity() || !email.trim()) return showError("請輸入有效的電子郵件信箱");

    setState("sending");
    try {
      const response = await fetch(NEWSLEOPARD_SUBSCRIBE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `email=${encodeURIComponent(email.trim())}`,
      });
      if (!response.ok) throw new Error(String(response.status));
    } catch {
      setState("idle");
      return showError("暫時無法接受訂閱，請稍候重新嘗試");
    }
    setEmail("");
    setState("done");
    window.setTimeout(() => setState("idle"), 6000);
  }

  return (
    <div className="footer_right d-flex">
      <div className="input-group">
        <input
          ref={emailRef}
          type="email"
          className="form-control"
          placeholder="你的電子郵件位置"
          aria-label="請輸入您的電子郵件信箱"
          autoComplete="email"
          maxLength={320}
          required
          value={email}
          onChange={(event) => {
            event.target.setCustomValidity("");
            setEmail(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submit();
            }
          }}
        />
      </div>
      <button type="button" className="btn_a" title="送出訂閱電子報" disabled={state === "sending"} onClick={() => void submit()}>
        {state === "sending" ? "送出中…" : state === "done" ? "請收驗證信" : "立即訂閱"}
      </button>
    </div>
  );
}
