"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { demandRepliesApi } from "@/lib/api/demand-replies";

/**
 * 積木元件：需求詳情頁「我要回應」彈窗（取代原本寫進詢問單的「我要提案」彈窗），只有供應端企業會員開得起來。
 * 送出呼叫 `POST /api/Demand/{id}/replies`，存成「待審」；後台「需求回應」審核通過後才會寄信給刊登者與當下所有追蹤者，
 * 退回則寄信通知回應者。同一家供應業者對同一需求可以回應多次（不設上限）。
 * 彈窗上方明確提示收件對象與人數（`followerCount`，後端只對供應端會員提供），並要勾選「我了解」才能送出；聯絡資訊會一併寄出。
 *
 * 「送出」用 `<a>` 不是 `<button>`：見 `ProposeSolutionModal` 舊版與 `EnterpriseContactModal.tsx` 同一段說明（`.btn-theme` 只定義在 `a` 上）。
 */
export default function ReplyNeedModal({ id, demandId, demandTitle, followerCount }: { id: string; demandId: string; demandTitle: string; followerCount: number | null }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [content, setContent] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (submitting) return;
    setError(null);
    if (!name.trim() || !email.trim()) return setError("請填寫聯絡人姓名與信箱");
    if (!content.trim()) return setError("請輸入回應內容");
    if (!acknowledged) return setError("請勾選「我了解以上收件對象」");

    setSubmitting(true);
    const message = await demandRepliesApi.create(demandId, {
      contactName: name.trim(),
      contactEmail: email.trim(),
      contactPhone: phone.trim() || undefined,
      content: content.trim(),
      acknowledged,
    });
    setSubmitting(false);
    if (message) return setError(message);
    setSubmitted(true);
    setContent("");
    setAcknowledged(false);
  }

  return (
    <Modal id={id} title="我要回應">
      <p className="mb-3">
        <b>需求：</b>
        {demandTitle}
      </p>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-name`}>聯絡人姓名</label>
        <input id={`${id}-name`} type="text" className="form-control" placeholder="請輸入聯絡人姓名" maxLength={50} required aria-required="true" value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-email`}>聯絡信箱</label>
        <input id={`${id}-email`} type="email" className="form-control" placeholder="請輸入聯絡信箱" maxLength={320} required aria-required="true" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-phone`}>聯絡電話（選填）</label>
        <input id={`${id}-phone`} type="tel" className="form-control" placeholder="請輸入聯絡電話" maxLength={50} value={phone} onChange={(event) => setPhone(event.target.value)} />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-content`}>回應內容</label>
        <textarea id={`${id}-content`} className="form-control" rows={5} placeholder="說明您的解決方案、可交付範圍與預估時程" maxLength={3000} required aria-required="true" value={content} onChange={(event) => setContent(event.target.value)} />
      </div>

      <div className="Disclaimer">
        <h5>收件對象提醒：</h5>
        <p>
          您的回應經平台審核通過後，會寄給這筆需求的刊登者
          {followerCount != null ? `與目前追蹤此需求的 ${followerCount} 位業者` : "與追蹤此需求的業者"}
          ，他們會看到您的公司名稱、聯絡人、信箱、電話與回應內容。審核未通過時，平台會通知您原因。本平台僅提供資訊交流，不參與後續洽談、報價與合作。
        </p>
      </div>

      <div className="peer d-flex mb-3 mt-4">
        <label className="relative">
          <input type="checkbox" title="我了解以上收件對象" className="form-check-input peer me-1" checked={acknowledged} onChange={() => setAcknowledged((prev) => !prev)} />
          <span>我了解以上收件對象</span>
        </label>
      </div>

      {error && (
        <p className="mb-3" role="alert" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}
      {submitted && <p className="text-success mb-3">已收到您的回應，審核通過後會寄給刊登者與追蹤者，可以到會員中心「我的回應」查看審核狀態。</p>}

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <a href="javascript:void(0)" className="btn-theme mat_Send" aria-disabled={submitting} onClick={() => void submit()}>
          {submitting ? "送出中…" : "送出回應"}
        </a>
      </div>
    </Modal>
  );
}
