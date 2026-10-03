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
 * 所以不用登入就能查，兩種方式（對應後端 `POST /api/Applications/status`、`.../status/by-phone`）：
 * 1. 申請編號＋申請時填的信箱（編號可以從郵件連結預填 `?applicationNumber=`，信箱要自己輸入）
 * 2. 忘了申請編號／信根本沒收到：申請時填的信箱＋聯絡電話，列出該信箱符合的申請（含編號）
 *
 * 結果只顯示後端回的欄位（編號、狀態、送出／審核時間、未通過原因）。查不到、資料不符、查錯太多次，
 * 都直接顯示後端的 `error` 訊息——後端刻意不說是哪一項錯。
 */
type Mode = "number" | "phone";

const STATUS_PENDING = [1, 2];
const STATUS_APPROVED = 3;
const STATUS_REJECTED = 4;
const STATUS_CANCELLED = 6;

function formatTime(value?: string | null) {
  return value ? new Date(value).toLocaleString("zh-TW", { hour12: false }) : "—";
}

function StatusCard({ result }: { result: ApplicationStatusResponse }) {
  const tone =
    result.status === STATUS_APPROVED ? "success" : result.status === STATUS_REJECTED ? "danger" : result.status === STATUS_CANCELLED ? "secondary" : "primary";

  return (
    <div className={`alert alert-${tone} mt-4 mb-0`} role="status">
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
      {result.status === STATUS_REJECTED && (
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
      {result.status === STATUS_REJECTED && (
        <p className="mb-0 mt-2">
          修正相關問題後，歡迎
          <Link href="/member/register" className="ms-1">
            重新申請
          </Link>
          。
        </p>
      )}
      {STATUS_PENDING.includes(result.status) && <p className="mb-0 mt-2">審核通常需要 1-3 個工作日，結果也會寄到您的信箱。</p>}
    </div>
  );
}

export default function ApplicationStatusLookup({ initialApplicationNumber = "" }: { initialApplicationNumber?: string }) {
  const [mode, setMode] = useState<Mode>("number");
  const [applicationNumber, setApplicationNumber] = useState(initialApplicationNumber);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<ApplicationStatusResponse[]>([]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(undefined);
    setResults([]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    setResults([]);

    const second = mode === "number" ? applicationNumber.trim() : phone.trim();
    if (!second || !email.trim()) {
      setError(mode === "number" ? "請輸入申請編號與申請時填寫的電子信箱" : "請輸入申請時填寫的電子信箱與聯絡電話");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "number") {
        setResults([await applicationsApi.getStatus(second, email.trim())]);
      } else {
        setResults(await applicationsApi.findStatusByPhone(email.trim(), second));
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "查詢失敗，請稍後再試"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="melo_box d-flex">
      <form className="melo_box_left w-100" onSubmit={handleSubmit} noValidate>
        <div className="d-flex gap-2 mb-4" role="tablist" aria-label="查詢方式">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "number"}
            className={`btn btn-sm ${mode === "number" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => switchMode("number")}
          >
            用申請編號查詢
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "phone"}
            className={`btn btn-sm ${mode === "phone" ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => switchMode("phone")}
          >
            忘了申請編號
          </button>
        </div>

        {mode === "number" ? (
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
        ) : (
          <div className="form-group">
            <label htmlFor="statusPhone" className="mb-2">
              申請時填寫的聯絡電話<span className="text-danger" aria-hidden="true">*</span>
            </label>
            <input
              type="tel"
              id="statusPhone"
              className="form-control"
              placeholder="市話或手機都可以，例如 02-1234-5678 或 0912-345-678"
              required
              aria-required="true"
              maxLength={40}
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        )}

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

        <div aria-live="polite">
          {results.length > 1 && <p className="mt-4 mb-0">找到 {results.length} 筆申請：</p>}
          {results.map((r) => (
            <StatusCard key={r.applicationNumber} result={r} />
          ))}
        </div>
      </form>
    </div>
  );
}
