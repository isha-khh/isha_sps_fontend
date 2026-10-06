"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { InquiryType, submitInquiry } from "@/lib/api/inquiries";

/**
 * 積木元件：政府補助資源卡片「索取資料協助評估」彈窗，對應設計稿
 * `page/support/p01.html` 的 `#staticmembership`——留下聯絡方式，
 * 由專人協助評估是否符合申請資格。
 *
 * 2026-10-06 接上真後端：送出呼叫 `POST /api/Inquiry`（種類＝索取補助資料，匿名也可以，要勾選同意蒐集聯絡資料），
 * 存進後台「詢問單」收件匣，記錄是針對哪一個補助資源（`resourceId`／`resourceTitle`）。
 *
 * 「送出」維持 `<button type="submit">`（不像其他同類彈窗改成
 * `<a>`）：這裡是真的 `<form onSubmit>` 搭配 HTML5 `required` 驗證，
 * 換成 `<a>` 會讓原生表單驗證/submit 事件完全不會觸發。`.btn-theme`
 * 這個 class 本來只綁 `<a>` 標籤（`css/style.css` 的
 * `.card-footer a.btn-theme`），`globals.css` 額外補了
 * `.card-footer button.btn-theme` 讓 button 也吃得到同一組漸層樣式。
 */
export default function SupportRequestModal({ id, resourceId, resourceTitle }: { id: string; resourceId: string; resourceTitle: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (!consent) return setError("請勾選同意蒐集聯絡資料");
    setSubmitting(true);
    const message = await submitInquiry({
      type: InquiryType.SupportRequest,
      name: name.trim(),
      phone: phone.trim(),
      targetType: "SupportResource",
      targetKey: resourceId,
      targetTitle: resourceTitle,
      consentAccepted: true,
    });
    setSubmitting(false);
    if (message) return setError(message);
    setSubmitted(true);
  }

  return (
    <Modal id={id} title="索取資料協助評估">
      {submitted ? (
        <div className="co_m_botom">
          <h4>已收到您的需求</h4>
          <p className="mb-0">專人將會盡快與您聯繫，協助評估「{resourceTitle}」的申請資格。</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p>請留下您的聯絡方式，我們將協助評估「{resourceTitle}」的申請資格。</p>

          <div className="form-group mb-3">
            <label className="form-label" htmlFor={`${id}-name`}>
              聯絡人姓名
            </label>
            <input
              id={`${id}-name`}
              className="form-control"
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="form-group mb-3">
            <label className="form-label" htmlFor={`${id}-phone`}>
              聯絡電話
            </label>
            <input
              id={`${id}-phone`}
              className="form-control"
              type="tel"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="peer d-flex mb-3">
            <label className="relative">
              <input type="checkbox" className="form-check-input peer me-1" checked={consent} onChange={() => setConsent((prev) => !prev)} />
              <span>我同意本平台蒐集上述聯絡資料，僅用於協助評估補助申請資格之聯繫。</span>
            </label>
          </div>

          {error && (
            <p className="mb-3" role="alert" style={{ color: "#c0392b" }}>
              {error}
            </p>
          )}

          <div className="card-footer d-flex justify-content-center">
            <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
              取消
            </a>
            <button type="submit" className="btn-theme mat_Send" disabled={submitting}>
              {submitting ? "送出中…" : "送出"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
