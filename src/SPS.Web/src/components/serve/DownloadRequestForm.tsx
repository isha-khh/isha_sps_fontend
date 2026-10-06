"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { InquiryType, submitInquiry } from "@/lib/api/inquiries";

/**
 * 服務專區詳情頁的「立即下載」表單，對應舊站 serve/show.html 裡的
 * `.cont`（留資料換下載文件的表單 + 個資蒐集同意 modal）。
 *
 * 修正原始碼一個實際的無障礙問題：舊站每個 `<label for="companyName">`
 * 指到的 id，對應的 `<input>` 上其實根本沒有寫那個 `id`——六個欄位
 * 全部都這樣，等於 label 沒有真的關聯到任何欄位（螢幕閱讀器唸不出
 * 欄位名稱、點 label 也不會聚焦到輸入框）。這裡把 id 補上、跟 label
 * 對起來。
 *
 * 2026-10-06 接上真後端：改成 client 元件，提交呼叫 `POST /api/Inquiry`（種類＝下載申請，匿名也可以，要勾選個資同意），
 * 存進後台「詢問單」收件匣，記錄是針對哪一個服務項目（`itemId`／`itemTitle`），由承辦單位回覆並提供文件。
 * 目前服務專區的項目還是前端靜態資料，項目識別先用它的代號。
 */
export default function DownloadRequestForm({ itemId, itemTitle }: { itemId: string; itemTitle: string }) {
  const [form, setForm] = useState({ companyName: "", userName: "", userUnit: "", userTitle: "", userTel: "", userEmail: "" });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  async function submit(event: React.MouseEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    if (Object.values(form).some((value) => !value.trim())) return setError("請完整填寫所有欄位");
    if (!agreed) return setError("請勾選已閱讀並同意個資蒐集同意");

    setSubmitting(true);
    const message = await submitInquiry({
      type: InquiryType.DownloadRequest,
      companyName: form.companyName.trim(),
      name: form.userName.trim(),
      unit: form.userUnit.trim(),
      jobTitle: form.userTitle.trim(),
      phone: form.userTel.trim(),
      email: form.userEmail.trim(),
      targetType: "ServeItem",
      targetKey: itemId,
      targetTitle: itemTitle,
      consentAccepted: true,
    });
    setSubmitting(false);
    if (message) return setError(message);
    setSubmitted(true);
    setForm({ companyName: "", userName: "", userUnit: "", userTitle: "", userTel: "", userEmail: "" });
    setAgreed(false);
  }

  return (
    <div className="cont">
      <div className="dow-name">
        <i className="bi bi-download me-1" aria-hidden="true"></i>
        <span>立即下載</span>
      </div>

      <div className="dow_box">
        <div className="row g-3 g-lg-4 mb-3 mb-lg-4">
          <div className="col-md-6 col-12">
            <label htmlFor="companyName" className="mb-2">
              公司名稱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="companyName" name="companyName" {...bind("companyName")} type="text" className="form-control" placeholder="請輸入公司名稱" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userName" className="mb-2">
              姓名
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userName" name="userName" {...bind("userName")} type="text" className="form-control" placeholder="請輸入姓名" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userUnit" className="mb-2">
              單位
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userUnit" name="userUnit" {...bind("userUnit")} type="text" className="form-control" placeholder="請輸入單位" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userTitle" className="mb-2">
              職稱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userTitle" name="userTitle" {...bind("userTitle")} type="text" className="form-control" placeholder="請輸入職稱" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userTel" className="mb-2">
              電話
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userTel" name="userTel" {...bind("userTel")} type="tel" className="form-control" placeholder="請輸入電話" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userEmail" className="mb-2">
              信箱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userEmail" name="userEmail" {...bind("userEmail")} type="email" className="form-control" placeholder="請輸入信箱" required aria-required="true" />
          </div>
        </div>

        <div className="checkbox text-center mt-4 mb-4">
          <input type="checkbox" id="agreePrivacy" required aria-required="true" checked={agreed} onChange={() => setAgreed((prev) => !prev)} />
          <label htmlFor="agreePrivacy">我已同意並閱讀</label>「
          <a
            className="ma_bat blue"
            href="#"
            data-bs-toggle="modal"
            data-bs-target="#privacyConsentModal"
            title="前往閱讀個資蒐集同意條款（開啟對話框）"
          >
            個資蒐集同意
          </a>
          」
        </div>

        {error && (
          <p className="text-center mb-3" role="alert" style={{ color: "#c0392b" }}>
            {error}
          </p>
        )}
        {submitted && <p className="text-center text-success mb-3">已收到您的申請，承辦單位將與您聯繫並提供文件。</p>}

        <a href="#" title="提交" className="more_x" aria-disabled={submitting} onClick={(event) => void submit(event)}>
          <span>{submitting ? "送出中…" : "提交"}</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </a>
      </div>

      <Modal id="privacyConsentModal" title="個資蒐集條款">
        <p>內容內容內容內容內容</p>
      </Modal>
    </div>
  );
}
