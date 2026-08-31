import Modal from "@/components/ui/Modal";

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
 * 目前還沒有後端可以送，`<a>` 提交按鈕先不接任何邏輯，等真的要串
 * API 的時候再處理表單送出（那時候這支大概也要改成 client 元件）。
 */
export default function DownloadRequestForm() {
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
            <input id="companyName" name="companyName" type="text" className="form-control" placeholder="請輸入公司名稱" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userName" className="mb-2">
              姓名
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userName" name="userName" type="text" className="form-control" placeholder="請輸入姓名" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userUnit" className="mb-2">
              單位
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userUnit" name="userUnit" type="text" className="form-control" placeholder="請輸入單位" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userTitle" className="mb-2">
              職稱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userTitle" name="userTitle" type="text" className="form-control" placeholder="請輸入職稱" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userTel" className="mb-2">
              電話
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userTel" name="userTel" type="tel" className="form-control" placeholder="請輸入電話" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userEmail" className="mb-2">
              信箱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userEmail" name="userEmail" type="email" className="form-control" placeholder="請輸入信箱" required aria-required="true" />
          </div>
        </div>

        <div className="checkbox text-center mt-4 mb-4">
          <input type="checkbox" id="agreePrivacy" required aria-required="true" />
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

        <a href="#" title="提交" className="more_x">
          <span>提交</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </a>
      </div>

      <Modal id="privacyConsentModal" title="個資蒐集條款">
        <p>內容內容內容內容內容</p>
      </Modal>
    </div>
  );
}
