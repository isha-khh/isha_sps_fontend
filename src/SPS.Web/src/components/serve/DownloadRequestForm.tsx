"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ui/Modal";
import PersonalDataConsentNotice from "@/components/member/PersonalDataConsentNotice";
import { requestServeDownload, type ServeDownloadLink } from "@/lib/api/inquiries";
import { resolveBackendAssetUrl } from "@/lib/content-list-utils";

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
 * 2026-10-06 接上真後端：改成 client 元件，提交呼叫 `POST /api/Inquiry`（種類＝下載申請，匿名也可以，要勾選個資同意），
 * 存進後台「詢問單」收件匣，記錄是針對哪一個服務項目（`itemId`／`itemTitle`），由承辦單位回覆並提供文件。
 *
 * 2026-10-13 服務專區改接後台內容：改呼叫 `POST /api/Inquiry/download/{項目編號}`（`requestServeDownload`），**送出成功後直接顯示這個項目的附件下載連結**
 * （詢問單照樣存下申請人資料，針對的項目由後端決定）。附件不在公開頁面列出，沒填表單拿不到連結；項目沒有附件時父頁面不顯示這個表單。
 */
const FIELD_LABELS = { companyName: "公司名稱", userName: "姓名", userUnit: "單位", userTitle: "職稱", userTel: "電話", userEmail: "信箱" } as const;

export default function DownloadRequestForm({ itemId }: { itemId: number | string; itemTitle?: string }) {
  const [form, setForm] = useState({ companyName: "", userName: "", userUnit: "", userTitle: "", userTel: "", userEmail: "" });
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<ServeDownloadLink[] | null>(null);

  // 驗證沒過：錯誤區塊列出哪些欄位沒填、每一項都是連結，點了（或自動）把焦點帶到該欄位（無障礙檢測 GN2330300E）
  const [missing, setMissing] = useState<{ id: string; label: string }[]>([]);
  const errorRef = useRef<HTMLDivElement>(null);
  const [errorSeq, setErrorSeq] = useState(0);
  useEffect(() => {
    if (errorSeq > 0) errorRef.current?.focus();
  }, [errorSeq]);

  function focusField(id: string) {
    const element = document.getElementById(id);
    if (!element) return;
    element.focus({ preventScroll: true });
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  const bind = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  async function submit(event: React.MouseEvent) {
    event.preventDefault();
    if (submitting) return;
    setError(null);
    const emptyFields = (Object.keys(FIELD_LABELS) as (keyof typeof form)[]).filter((key) => !form[key].trim()).map((key): { id: string; label: string } => ({ id: key, label: FIELD_LABELS[key] }));
    if (!agreed) emptyFields.push({ id: "agreePrivacy", label: "個資蒐集同意（請勾選）" });
    setMissing(emptyFields);
    if (emptyFields.length > 0) {
      setError(agreed || emptyFields.length > 1 ? "以下欄位還沒填寫：" : "請勾選已閱讀並同意個資蒐集同意");
      setErrorSeq((n) => n + 1);
      return;
    }

    setSubmitting(true);
    const result = await requestServeDownload(itemId, {
      companyName: form.companyName.trim(),
      name: form.userName.trim(),
      unit: form.userUnit.trim(),
      jobTitle: form.userTitle.trim(),
      phone: form.userTel.trim(),
      email: form.userEmail.trim(),
    });
    setSubmitting(false);
    if ("error" in result) return setError(result.error);
    setLinks(result.links);
    setForm({ companyName: "", userName: "", userUnit: "", userTitle: "", userTel: "", userEmail: "" });
    setAgreed(false);
  }

  return (
    <div className="cont">
      <div className="dow-name">
        <i className="bi bi-download me-1" aria-hidden="true"></i>
        <span>立即下載</span>
      </div>

      {links && (
        <div className="dow_box" role="status">
          <p className="text-success mb-3">已收到您的申請，請從下面下載文件：</p>
          {links.length === 0 ? (
            <p className="mb-0">目前沒有可下載的文件，承辦單位會與您聯繫。</p>
          ) : (
            <ul className="list-unstyled mb-0 d-grid gap-2">
              {links.map((link) => (
                <li key={link.fileId}>
                  <a href={resolveBackendAssetUrl(link.url) ?? link.url} target="_blank" rel="noopener noreferrer" className="d-inline-flex align-items-center gap-2" title={`下載 ${link.fileName}（另開視窗）`}>
                    <i className="bi bi-file-earmark-arrow-down" aria-hidden="true"></i>
                    <span>{link.fileName}</span>
                    <span className="small text-muted">（{link.formattedFileSize}）</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!links && (
      <div className="dow_box">
        <div className="row g-3 g-lg-4 mb-3 mb-lg-4">
          <div className="col-md-6 col-12">
            <label htmlFor="companyName" className="mb-2">
              公司名稱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="companyName" name="companyName" aria-invalid={missing.some((m) => m.id === "companyName") || undefined} {...bind("companyName")} type="text" className="form-control" placeholder="請輸入公司名稱" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userName" className="mb-2">
              姓名
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userName" name="userName" aria-invalid={missing.some((m) => m.id === "userName") || undefined} {...bind("userName")} type="text" className="form-control" placeholder="請輸入姓名" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userUnit" className="mb-2">
              單位
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userUnit" name="userUnit" aria-invalid={missing.some((m) => m.id === "userUnit") || undefined} {...bind("userUnit")} type="text" className="form-control" placeholder="請輸入單位" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userTitle" className="mb-2">
              職稱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userTitle" name="userTitle" aria-invalid={missing.some((m) => m.id === "userTitle") || undefined} {...bind("userTitle")} type="text" className="form-control" placeholder="請輸入職稱" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userTel" className="mb-2">
              電話
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userTel" name="userTel" aria-invalid={missing.some((m) => m.id === "userTel") || undefined} {...bind("userTel")} type="tel" className="form-control" placeholder="請輸入電話" required aria-required="true" />
          </div>

          <div className="col-md-6 col-12">
            <label htmlFor="userEmail" className="mb-2">
              信箱
              <span className="text-danger" aria-hidden="true">
                *
              </span>
            </label>
            <input id="userEmail" name="userEmail" aria-invalid={missing.some((m) => m.id === "userEmail") || undefined} {...bind("userEmail")} type="email" className="form-control" placeholder="請輸入信箱" required aria-required="true" />
          </div>
        </div>

        <div className="checkbox text-center mt-4 mb-4">
          <input type="checkbox" id="agreePrivacy" required aria-required="true" checked={agreed} onChange={() => setAgreed((prev) => !prev)} />
          <label htmlFor="agreePrivacy">我已同意並閱讀</label>「
          <a
            className="ma_bat blue"
            href="#"
            role="button"
            data-bs-toggle="modal"
            data-bs-target="#privacyConsentModal"
            title="前往閱讀個資蒐集同意條款（開啟對話框）"
          >
            個資蒐集同意
          </a>
          」
        </div>

        {error && (
          <div className="text-center mb-3" role="alert" ref={errorRef} tabIndex={-1} style={{ color: "#c0392b" }}>
            <p className="mb-1">{error}</p>
            {missing.length > 0 && error.endsWith("：") && (
              <ul className="list-unstyled mb-0 d-inline-block text-start">
                {missing.map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      style={{ color: "#c0392b", textDecoration: "underline" }}
                      onClick={(event) => {
                        event.preventDefault();
                        focusField(item.id);
                      }}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <a href="#" role="button" title="提交" className="more_x" aria-disabled={submitting} onClick={(event) => void submit(event)}>
          <span>{submitting ? "送出中…" : "提交"}</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </a>
      </div>
      )}

      {/* 2026-10-14 設計稿：標題改為「蒐集個人資料告知事項暨個人資料同意書」，內文與註冊流程共用同一份（官方《附件一》逐字） */}
      <Modal id="privacyConsentModal" title="蒐集個人資料告知事項暨個人資料同意書">
        <h5>蒐集個人資料告知事項：</h5>
        <PersonalDataConsentNotice />
      </Modal>
    </div>
  );
}
