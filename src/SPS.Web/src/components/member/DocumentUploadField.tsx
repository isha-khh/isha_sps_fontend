/**
 * 積木元件：單一份文件上傳欄位，對應 p02.html 的 `.tit_dow` +
 * `.dropzone-upload-box`。
 *
 * 舊站用 Dropzone.js 處理真的拖曳/上傳/預覽，這裡先做成純展示的
 * 靜態按鈕（點了沒有真的上傳行為）——跟其他會員頁一樣，範圍還沒
 * 確認要不要做成真的能送出的表單，先求畫面長相一致，之後要接真的
 * 上傳邏輯（含後端 API）再回來補。
 *
 * `mode="review"` 對應 p03.html（Step 4 完成註冊）唯讀檢視，直接顯示
 * 一張示範縮圖，不是可互動的上傳按鈕。
 */
export default function DocumentUploadField({
  label,
  required,
  hint = "上傳格式支援PDF、影像檔，最大上限10MB。",
  mode,
  previewAlt,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  mode: "edit" | "review";
  previewAlt?: string;
}) {
  if (mode === "review") {
    return (
      <div className="tit_dow">
        <label className="mb-2">{label}</label>
        <div className="pt-2">
          <img className="img-fluid d-block" src="/images/all/menb_logo2.jpg" alt={previewAlt ?? label} />
        </div>
      </div>
    );
  }

  return (
    <div className="tit_dow">
      <label className="mb-2">
        {required && (
          <span className="red me-1" aria-hidden="true">
            *
          </span>
        )}
        {label}
      </label>
      <div className="pass_on d-flex gap-4">
        <div className="uplo_cpo w-100">
          <div className="actions-wrap mb-2">
            <button type="button" className="btn fileinput-button dropzone-upload-box" title={`點擊或拖曳上傳${label}檔案`} aria-label={`點擊或拖曳上傳${label}檔案`}>
              <div className="upload-icon-box">
                <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i>
              </div>
              <p className="upload-main-text">
                將檔案拖曳至此，或 <span className="highlight">點擊上傳</span>
              </p>
              <div className="dire_lex mt-2">
                <p className="mb-0">※ {hint}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
