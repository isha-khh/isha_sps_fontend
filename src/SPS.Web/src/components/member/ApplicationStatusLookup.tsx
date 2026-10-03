"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { applicationsApi } from "@/lib/api/applications";
import { getApiErrorMessage } from "@/lib/error-utils";
import type { ApplicationStatusResponse } from "@/types/application";

/**
 * 積木元件：會員申請進度查詢。
 *
 * 申請送出後審核結果只會寄一封信；被拒絕或還在審核的申請人沒有會員帳號，沒辦法登入回來看，
 * 所以用「申請編號＋申請時填的信箱」查（見後端 `POST /api/Applications/status`）。
 * 申請編號可以從郵件連結預填（`?applicationNumber=`），信箱要自己輸入——網址裡不放任何個資。
 *
 * 結果只顯示後端回的欄位（狀態、送出／審核時間、未通過原因）。查不到、信箱不符、查錯太多次，
 * 都直接顯示後端的 `error` 訊息。
 */
export default function ApplicationStatusLookup({ initialApplicationNumber = "" }: { initialApplicationNumber?: string }) {
  const [applicationNumber, setApplicationNumber] = useState(initialApplicationNumber);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApplicationStatusResponse>();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setResult(undefined);

    if (!applicationNumber.trim() || !email.trim()) {
      setError("請輸入申請編號與申請時填寫的電子信箱");
      return;
    }

    setSubmitting(true);
    try {
      setResult(await applicationsApi.getStatus(applicationNumber.trim(), email.trim()));
    } catch (err) {
      setError(getApiErrorMessage(err, "查詢失敗，請稍後再試"));
    } finally {
      setSubmitting(false);
    }
  }

  const formatTime = (value?: string | null) => (value ? new Date(value).toLocaleString("zh-TW", { hour12: false }) : "—");

  // 0 草稿、1 待審核、2 審核中、3 通過、4 未通過、6 已取消
  const tone = result?.status === 3 ? "success" : result?.status === 4 ? "danger" : result?.status === 6 ? "secondary" : "primary";

  return (
    <div className="melo_box d-flex">
      <form className="melo_box_left w-100" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="statusApplicationNumber" className="mb-2">
            申請編號<span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            type="text"
            id="statusApplicationNumber"
            className="form-control"
            placeholder="例如 APP20261003060707157（見申請成功通知信）"
            required
            aria-required="true"
            maxLength={40}
            value={applicationNumber}
            onChange={(e) => setApplicationNumber(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="statusEmail" className="mb-2">
            申請時填寫的電子信箱<span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            type="email"
            id="statusEmail"
            className="form-control"
            placeholder="請輸入電子信箱"
            required
            aria-required="true"
            maxLength={320}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-danger mb-3" role="alert">
            <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
            {error}
          </p>
        )}

        <button type="submit" title="查詢" className="more_x" style={{ margin: "0 auto" }} disabled={submitting}>
          <span>{submitting ? "查詢中…" : "查詢"}</span>
          <i className="bi bi-arrow-right" aria-hidden="true"></i>
        </button>

        {result && (
          <div className={`alert alert-${tone} mt-4 mb-0`} role="status" aria-live="polite">
            <p className="mb-1">
              <strong>申請編號：</strong>
              {result.applicationNumber}
            </p>
            <p className="mb-1">
              <strong>目前狀態：</strong>
              {result.statusText}
            </p>
            <p className="mb-1">
              <strong>送出時間：</strong>
              {formatTime(result.submittedAt)}
            </p>
            {result.reviewedAt && (
              <p className="mb-1">
                <strong>審核時間：</strong>
                {formatTime(result.reviewedAt)}
              </p>
            )}
            {result.status === 4 && (
              <p className="mb-1">
                <strong>未通過原因：</strong>
                {result.rejectionReason || "未說明"}
              </p>
            )}
            {result.canLogin && (
              <p className="mb-0 mt-2">
                您可以使用註冊時填寫的信箱與密碼
                <Link href="/member/login" className="ms-1">
                  前往登入
                </Link>
                。
              </p>
            )}
            {result.status === 4 && (
              <p className="mb-0 mt-2">
                修正相關問題後，歡迎
                <Link href="/member/register" className="ms-1">
                  重新申請
                </Link>
                。
              </p>
            )}
            {(result.status === 1 || result.status === 2) && (
              <p className="mb-0 mt-2">審核通常需要 1-3 個工作日，結果也會寄到您的信箱。</p>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
