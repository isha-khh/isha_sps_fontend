"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

/**
 * 積木元件：「媒合對接」列表頁「訂閱解方」彈窗，對應設計稿
 * `page/matching/index.html` 的 `#staticmembership`——單純同意免責
 * 聲明後送出，沒有任何額外欄位（比企業名錄的 `EnterpriseContactModal`
 * 更簡單，不用勾選智慧技術範疇，也不會展開顯示聯絡資訊）。
 *
 * 「送出」目前只切換一段確認文字顯示/隱藏，沒有真的送出到任何地方
 * ——跟這個專案其他還沒接資料的表單（`DownloadRequestForm`／
 * `EnterpriseContactModal`）同樣的階段。
 */
export default function SubscribeSolutionModal({ id }: { id: string }) {
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <Modal id={id} title="訂閱解方">
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
          <span>需勾選同意免責聲明及相關解方將同步信件及通知予使用者。</span>
        </label>
      </div>

      {submitted && <p className="text-success mb-3">已收到您的訂閱，相關解方將同步以信件及通知提供給您。</p>}

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
