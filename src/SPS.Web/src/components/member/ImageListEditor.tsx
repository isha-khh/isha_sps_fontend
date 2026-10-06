"use client";

import { useRef, useState } from "react";
import { getApiErrorMessage } from "@/lib/error-utils";
import { memberAssetUrl, memberCompanyApi, type MemberCompanyImage } from "@/lib/api/member-company";

/**
 * 積木元件：會員中心的圖片清單編輯器——縮圖＋移除，可一次選多張上傳（`POST /api/member/company/images`，
 * 後端依檔頭驗證是 JPG／PNG／WebP／GIF、5MB 以內）。圖片清單由上層保存（受控），按「儲存」時才把檔案 Id 一起送出。
 */
export default function ImageListEditor({
  images,
  onChange,
  max = 12,
  disabled,
  single,
}: {
  images: MemberCompanyImage[];
  onChange: (images: MemberCompanyImage[]) => void;
  max?: number;
  disabled?: boolean;
  /** 只放一張（例如 LOGO）：再選會取代原本的 */
  single?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>();

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(undefined);
    setUploading(true);
    let next = single ? [] : [...images];
    try {
      for (const file of Array.from(fileList)) {
        if (next.length >= max) {
          setError(`圖片最多 ${max} 張`);
          break;
        }
        const uploaded = await memberCompanyApi.uploadImage(file);
        next = single ? [uploaded] : [...next, uploaded];
        if (single) break;
      }
      onChange(next);
    } catch (err) {
      setError(getApiErrorMessage(err, "圖片上傳失敗"));
      onChange(next);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      {images.length > 0 && (
        <div className="d-flex flex-wrap gap-3 mb-3">
          {images.map((image) => (
            <div className="position-relative" key={image.fileId} style={{ width: single ? 160 : 140 }}>
              <div className="ratio ratio-4x3 border rounded overflow-hidden bg-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={memberAssetUrl(image.url)} alt={image.fileName} style={{ objectFit: "contain" }} />
              </div>
              {!disabled && (
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 py-0 px-1"
                  aria-label={`移除 ${image.fileName}`}
                  title="移除"
                  onClick={() => onChange(images.filter((i) => i.fileId !== image.fileId))}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {!disabled && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple={!single}
            className="d-none"
            onChange={(e) => void handleFiles(e.target.files)}
          />
          <button type="button" className="btn btn-outline-secondary btn-sm" disabled={uploading || (!single && images.length >= max)} onClick={() => inputRef.current?.click()}>
            {uploading ? "上傳中…" : single ? (images.length > 0 ? "更換圖片" : "選擇圖片") : "新增圖片"}
          </button>
          <span className="ms-2 small text-muted">JPG、PNG、WebP、GIF，5MB 以內{single ? "" : `，最多 ${max} 張`}</span>
        </>
      )}
      {error && (
        <p className="text-danger small mt-2 mb-0" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
