"use client";

import { useId, useRef } from "react";
import { withBasePath } from "@/lib/api-client";

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
 * `mode="review"` 對應 p03.html（Step 4 完成註冊）唯讀檢視，直接顯示
 * 一張示範縮圖，不是可互動的上傳按鈕。
 */
export default function DocumentUploadField({
  label,
  required,
  hint = "上傳格式支援PDF、影像檔，最大上限10MB。",
  mode,
  previewAlt,
  selectedFileName,
  onFileSelected,
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
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  if (mode === "review") {
    return (
      <div className="tit_dow">
        <label className="mb-2">{label}</label>
        <div className="pt-2">
          <img className="img-fluid d-block" src={withBasePath("/images/all/menb_logo2.jpg")} alt={previewAlt ?? label} />
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
