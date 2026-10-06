"use client";

import { useRef, useState } from "react";
import { InquiryType, submitInquiry } from "@/lib/api/inquiries";

/**
 * 頁尾「訂閱電子報」，原本是 `Footer`（伺服器元件）裡純展示的標記，2026-10-06 抽成 client 元件接上真後端：
 * 送出呼叫 `POST /api/Inquiry`（種類＝電子報，匿名也可以），存進後台「詢問單」收件匣，承辦單位依名單寄送。
 * 頁尾文案已說明「訂閱即表示同意蒐集電子郵件」，所以送出時視為已同意個資告知。
 *
 * 版面是 `.footer_right` 固定的一列（下拉＋信箱＋按鈕），沒有多餘空間放訊息：錯誤用瀏覽器原生的驗證提示泡泡
 * （`setCustomValidity` + `reportValidity`）顯示，成功則把按鈕暫時改成「已訂閱」。
 * 「產業代碼」下拉的選項目前沒有資料來源（設計稿沒有給代碼表），先維持只有提示選項；有選才會送。
 */
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [industry, setIndustry] = useState("");
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
    const message = await submitInquiry({
      type: InquiryType.Newsletter,
      email: email.trim(),
      industry: industry || undefined,
      consentAccepted: true,
    });
    if (message) {
      setState("idle");
      return showError(message);
    }
    setEmail("");
    setState("done");
    window.setTimeout(() => setState("idle"), 4000);
  }

  return (
    <div className="footer_right d-flex">
      <div className="form-group mb-md-0">
        <select className="form-select" aria-label="請選擇產業代碼" value={industry} onChange={(event) => setIndustry(event.target.value)}>
          <option value="">請選擇產業代碼</option>
        </select>
      </div>

      <div className="input-group mt-2 mt-md-0">
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
        {state === "sending" ? "送出中…" : state === "done" ? "已訂閱" : "立即訂閱"}
      </button>
    </div>
  );
}
