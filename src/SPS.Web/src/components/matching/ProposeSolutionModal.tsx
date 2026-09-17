"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import DocumentUploadField from "@/components/member/DocumentUploadField";

/**
 * 積木元件：需求詳情頁「我要提案」彈窗，對應設計稿
 * `page/matching/show2.html` 的 `#staticmembership2`——公司名稱／姓名／
 * 聯絡電話／信箱四個文字欄位＋公司登記證明文件上傳，跟列表頁「我要
 * 刊登」彈窗（`PublishNeedModal`）雖然 id 同名 `staticmembership2`，
 * 但欄位完全不同（這裡是「提供解方」的廠商在填寫聯絡資料，不是刊登
 * 需求），設計稿本來就是兩份獨立的彈窗定義，只是剛好沿用同一個 id，
 * 不會衝突——因為兩者位在不同頁面（`/matching` 列表頁 vs
 * `/matching/[id]` 詳情頁），同一時間只會有一個掛載。
 *
 * 檔案上傳沿用 `DocumentUploadField`（純展示，沒有真的上傳行為）——
 * 跟該元件本身、`DownloadRequestForm` 同樣的「先求畫面一致」階段。
 */
export default function ProposeSolutionModal({ id }: { id: string }) {
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <Modal id={id} title="我要提案">
      <div className="form-group">
        <label className="mb-2">公司名稱</label>
        <input type="text" className="form-control" title="請輸入公司名稱" placeholder="請輸入公司名稱" required aria-required="true" />
      </div>

      <div className="form-group">
        <label className="mb-2">姓名</label>
        <input type="text" className="form-control" title="請輸入姓名" placeholder="請輸入姓名" required aria-required="true" />
      </div>

      <div className="form-group">
        <label className="mb-2">聯絡電話</label>
        <input type="text" className="form-control" title="請輸入聯絡電話" placeholder="請輸入聯絡電話" required aria-required="true" />
      </div>

      <div className="form-group">
        <label className="mb-2">信箱</label>
        <input type="text" className="form-control" title="請輸入信箱" placeholder="請輸入信箱" required aria-required="true" />
      </div>

      <div className="form-group">
        <DocumentUploadField label="附件" mode="edit" hint="上傳格式支援PDF、影像檔，最大上限10MB。" />
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

      {submitted && <p className="text-success mb-3">已收到您的提案，將由需求刊登單位主動與您聯繫。</p>}

      <div className="card-footer d-flex justify-content-center">
        <a className="btn-outline-dark me-2" href="#" title="取消" data-bs-dismiss="modal">
          取消
        </a>
        <button type="button" className="btn-theme mat_Send" onClick={() => setSubmitted(true)}>
          送出
        </button>
      </div>
    </Modal>
  );
}
