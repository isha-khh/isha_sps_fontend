"use client";

import { useId, useRef } from "react";

/**
 * 積木元件：單一份文件上傳欄位，對應 p02.html 的 `.tit_dow` +
 * `.dropzone-upload-box`。
 *
 * 2026-10-01 接真的註冊 API 之前，這裡只是純展示的靜態按鈕（點了
 * 沒有真的上傳行為）——現在改成真的受控 `<input type="file">`，選檔
 * 後透過 `onFileSelected` 把 `File` 往上交給 `MemberDetailsForm`。
 * 實際呼叫後端上傳 API 延後到整個表單送出時才做（因為上傳需要先有
 * `applicationId`，而草稿申請要等表單送出那一刻才會被建立），這個
 * 元件本身只負責「選檔＋顯示已選檔名」，不自己打 API。
 *
 * `mode="review"` 對應 p03.html（Step 4 完成註冊）唯讀檢視。2026-10-07 起顯示使用者**真正上傳的檔案**
 * （原本是寫死的示範縮圖，不管上傳什麼都顯示同一張）：JPG／PNG／GIF／WebP 顯示圖片縮圖（點一下另開視窗看原圖）、
 * PDF 顯示檔名與「開啟預覽」連結、其他檔案顯示檔名與下載連結、沒上傳的顯示「未上傳」。檔案由
 * `GET /api/Applications/{id}/documents/{documentId}/file` 提供（要持有這份申請的存取密鑰），後端依檔案內容
 * 判斷能不能直接顯示，不能的一律當成附件下載。
 */
/** 已上傳文件的預覽資料（由 `ApplicationResponse.documents` 組出） */
export interface DocumentPreviewData {
  url: string;
  fileName: string;
  contentType: string;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/** 已上傳文件的唯讀預覽：圖片顯示縮圖、PDF 與其他檔案顯示檔名與連結、沒上傳顯示「未上傳」 */
export function DocumentPreview({ data, alt, size = 200 }: { data?: DocumentPreviewData | null; alt: string; size?: number }) {
  if (!data) return <p className="text-muted mb-0">未上傳</p>;
  const type = data.contentType.toLowerCase();
  if (IMAGE_TYPES.includes(type)) {
    return (
      <a href={data.url} target="_blank" rel="noopener noreferrer" title={`${data.fileName}（另開視窗看原圖）`}>
        <img className="img-fluid d-block" src={data.url} alt={alt} style={{ maxWidth: size, maxHeight: size, objectFit: "contain" }} />
        <span className="d-block small text-muted mt-1">{data.fileName}</span>
      </a>
    );
  }
  const isPdf = type === "application/pdf";
  return (
    <a href={data.url} target="_blank" rel="noopener noreferrer" title={isPdf ? `${data.fileName}（另開視窗預覽）` : `下載 ${data.fileName}`} className="d-inline-flex align-items-center gap-2">
      <i className={`bi ${isPdf ? "bi-file-earmark-pdf" : "bi-file-earmark"} fs-2`} aria-hidden="true"></i>
      <span>
        <span className="d-block">{data.fileName}</span>
        <span className="d-block small text-muted">{isPdf ? "開啟預覽" : "下載檔案"}</span>
      </span>
    </a>
  );
}

export default function DocumentUploadField({
  label,
  required,
  hint = "上傳格式支援PDF、影像檔，最大上限10MB。",
  mode,
  previewAlt,
  selectedFileName,
  onFileSelected,
  preview,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  mode: "edit" | "review";
  previewAlt?: string;
  /** 目前已選擇的檔名，有值就顯示在按鈕下方 */
  selectedFileName?: string;
  /** 使用者選檔（或清空選擇）時呼叫，`null` 代表取消選擇 */
  onFileSelected?: (file: File | null) => void;
  /** `mode="review"` 專用：這個欄位已上傳的文件；沒有就是沒上傳 */
  preview?: DocumentPreviewData | null;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  if (mode === "review") {
    return (
      <div className="tit_dow">
        <label className="mb-2">{label}</label>
        <div className="pt-2">
          <DocumentPreview data={preview} alt={previewAlt ?? label} />
        </div>
      </div>
    );
  }

  return (
    <div className="tit_dow">
      <label className="mb-2" htmlFor={inputId}>
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
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              className="d-none"
              onChange={(e) => onFileSelected?.(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              className="btn fileinput-button dropzone-upload-box"
              title={`點擊或拖曳上傳${label}檔案`}
              aria-label={`點擊或拖曳上傳${label}檔案`}
              onClick={() => inputRef.current?.click()}
            >
              <div className="upload-icon-box">
                <i className="bi bi-cloud-arrow-up" aria-hidden="true"></i>
              </div>
              <p className="upload-main-text">
                {selectedFileName ? (
                  <span className="highlight">{selectedFileName}</span>
                ) : (
                  <>
                    將檔案拖曳至此，或 <span className="highlight">點擊上傳</span>
                  </>
                )}
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
