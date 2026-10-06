"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { InquiryType, submitInquiry } from "@/lib/api/inquiries";

/**
 * 積木元件：需求詳情頁「我要提案」彈窗，對應設計稿
 * `page/matching/show2.html` 的 `#staticmembership2`——公司名稱／姓名／
 * 聯絡電話／信箱四個文字欄位，跟列表頁「我要刊登」彈窗（`PublishNeedModal`）
 * 雖然 id 同名 `staticmembership2`，但欄位完全不同（這裡是「提供解方」的廠商
 * 在填寫聯絡資料，不是刊登需求），設計稿本來就是兩份獨立的彈窗定義，
 * 不會衝突——因為兩者位在不同頁面（`/matching` 列表頁 vs `/matching/[id]` 詳情頁），
 * 同一時間只會有一個掛載。
 *
 * 2026-10-06 接上真後端：送出呼叫 `POST /api/Inquiry`（種類＝提案，只有登入的企業會員可以；沒登入會被導去登入頁），
 * 存進後台「詢問單」收件匣，記錄是針對哪一筆需求（`demandId`／`demandTitle`）。
 * 設計稿的「附件」上傳欄位這次沒做：要讓會員上傳檔案需要另外做受保護的上傳端點（不能放進公開的檔案管理），
 * 之後有需要再補；目前請提案者在送出後由承辦單位聯繫再補件。
 *
 * 「送出」用 `<a>` 不是 `<button>`：`.btn-theme` 這個 class 在
 * `css/style.css` 只定義在 `.card-footer a.btn-theme`（綁 `<a>` 標籤
 * 的選擇器），`<button class="btn-theme">` 完全吃不到，會變成瀏覽器
 * 預設的裸按鈕樣式，見 `EnterpriseContactModal.tsx` 同一段說明。
 */
export default function ProposeSolutionModal({ id, demandId, demandTitle }: { id: string; demandId: string; demandTitle: string }) {
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (submitting) return;
    setError(null);
    if (!companyName.trim() || !name.trim() || !phone.trim() || !email.trim()) return setError("請填寫公司名稱、姓名、聯絡電話與信箱");
    if (!agreed) return setError("請勾選同意免責聲明");

    setSubmitting(true);
    const message = await submitInquiry({
      type: InquiryType.ProposeSolution,
      companyName: companyName.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      targetType: "Demand",
      targetKey: demandId,
      targetTitle: demandTitle,
    });
    setSubmitting(false);
    if (message) return setError(message);
    setSubmitted(true);
  }

  return (
    <Modal id={id} title="我要提案">
      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-company`}>公司名稱</label>
        <input id={`${id}-company`} type="text" className="form-control" title="請輸入公司名稱" placeholder="請輸入公司名稱" maxLength={200} required aria-required="true" value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-name`}>姓名</label>
        <input id={`${id}-name`} type="text" className="form-control" title="請輸入姓名" placeholder="請輸入姓名" maxLength={100} required aria-required="true" value={name} onChange={(event) => setName(event.target.value)} />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-phone`}>聯絡電話</label>
        <input id={`${id}-phone`} type="tel" className="form-control" title="請輸入聯絡電話" placeholder="請輸入聯絡電話" maxLength={50} required aria-required="true" value={phone} onChange={(event) => setPhone(event.target.value)} />
      </div>

      <div className="form-group">
        <label className="mb-2" htmlFor={`${id}-email`}>信箱</label>
        <input id={`${id}-email`} type="email" className="form-control" title="請輸入信箱" placeholder="請輸入信箱" maxLength={320} required aria-required="true" value={email} onChange={(event) => setEmail(event.target.value)} />
      </div>

      <div className="Disclaimer">
        <h5>免責聲明：</h5>
        <p>
          本人／本單位於「智慧工安技術產業資訊暨媒合平台」（以下簡稱本平台）刊登需求文章前，已詳閱並同意：本平台僅提供需求資訊刊載、交流及媒合機會，不參與使用者與任何第三人間之洽談、報價、簽約、付款、交付、驗收、保固或其他合作事項，亦非任何一方之代理人、保證人或契約當事人。刊登者應確保所提供之資料真實、完整、合法，且未侵害他人權益，並對刊登內容自行負責；本平台不保證刊登資訊、媒合對象、技術、產品或服務之正確性、品質、安全性、適用性、履約能力或媒合成果，使用者於進行合作前，應自行查證、評估風險並議定相關契約。因使用者間後續接洽、交易、合作、履約或爭議所生之損害、費用及法律責任，應由相關當事人自行處理及負擔。本平台如發現刊登內容涉及違法、不實、侵權、違反平台規範或其他不宜公開之情形，得要求刊登者修正，或暫停、拒絕刊登及刪除相關內容。
        </p>
      </div>

      <div className="peer d-flex mb-3 mt-4">
        <label className="relative">
          <input
            type="checkbox"
            title="同意免責聲明及相關解方將同步信件及通知予使用者"
            className="form-check-input peer me-1"
            checked={agreed}
            onChange={() => setAgreed((prev) => !prev)}
          />
          <span>需勾選同意免責聲明</span>
        </label>
      </div>

      {error && (
        <p className="mb-3" role="alert" style={{ color: "#c0392b" }}>
          {error}
        </p>
      )}
      {submitted && <p className="text-success mb-3">已收到您的提案，將由承辦單位與您聯繫。</p>}

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <a href="javascript:void(0)" className="btn-theme mat_Send" aria-disabled={submitting} onClick={() => void submit()}>
          {submitting ? "送出中…" : "送出"}
        </a>
      </div>
    </Modal>
  );
}
