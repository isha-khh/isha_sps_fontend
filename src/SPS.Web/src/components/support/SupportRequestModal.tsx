"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

/**
 * 積木元件：政府補助資源卡片「索取資料協助評估」彈窗，對應設計稿
 * `page/support/p01.html` 的 `#staticmembership`——留下聯絡方式，
 * 由專人協助評估是否符合申請資格。
 *
 * 跟 `EnterpriseContactModal` 同一種「先把畫面做出來」階段的做法：
 * 送出只顯示畫面上的完成訊息，沒有真的打 API，之後接真後端時再決定
 * 要送去哪支端點。
 */
export default function SupportRequestModal({ id, resourceTitle }: { id: string; resourceTitle: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
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

          <div className="card-footer d-flex justify-content-center">
            <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
              取消
            </a>
            <button type="submit" className="btn-theme mat_Send">
              送出
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
