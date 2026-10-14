"use client";

import { useRef, useState } from "react";
import { getLicenseErrorMessage, memberLicenseApi, type MemberLicense } from "@/lib/api/member-license";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("zh-TW");
}

/** 把文字存成檔案讓瀏覽器下載 */
function downloadText(fileName: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** 文字輸入框＋選檔案：使用者可以直接貼上內容，或選擇離線電腦存出來的檔案（讀成文字填進輸入框） */
function TextOrFileInput({ id, label, accept, value, onChange, disabled }: { id: string; label: string; accept: string; value: string; onChange: (v: string) => void; disabled: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  async function pick(file?: File) {
    if (!file) return;
    onChange(await file.text());
    if (fileRef.current) fileRef.current.value = "";
  }
  return (
    <div className="mb-2">
      <label className="mb-1" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="form-control" rows={3} style={{ fontFamily: "monospace", fontSize: "0.8rem" }} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder="貼上檔案內容，或點下方「選擇檔案」" />
      <input ref={fileRef} type="file" accept={accept} className="form-control form-control-sm mt-1" onChange={(e) => void pick(e.target.files?.[0])} disabled={disabled} />
    </div>
  );
}

/**
 * 積木元件：會員中心「XR 授權」的離線區塊——給沒有網路的電腦使用。
 *  - 離線啟用／續期：離線電腦的 XR 軟體產生「請求檔」（.req），帶到有網路的電腦在這裡上傳，換回「離線授權檔」（license.lic）帶回離線電腦匯入。
 *    同一台電腦再次上傳是換發新的授權檔（不多佔席次）。離線授權的租約比線上長，到期前要重新換發。
 *  - 離線停用：離線電腦產生「停用憑證」（.deact，產生後軟體會清除本機授權），在這裡上傳才會釋放席次。
 * 對應 `POST /api/member/license/offline/activate`、`/offline/deactivate`。
 */
export default function OfflineLicenseSection({ data, onChanged }: { data: MemberLicense; onChanged: (next: MemberLicense) => void }) {
  const [request, setRequest] = useState("");
  const [certificate, setCertificate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function activate() {
    if (busy) return;
    if (!request.trim()) {
      setError("請貼上或選擇離線電腦產生的請求檔（.req）");
      return;
    }
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const result = await memberLicenseApi.offlineActivate(request);
      downloadText("license.lic", result.license);
      setRequest("");
      setMessage(`${result.renewed ? "已換發" : "已產生"}「${result.deviceName}」的離線授權檔（license.lic，已下載），有效至 ${formatDate(result.leaseUntil)}。請把它帶回離線電腦，在 XR 軟體匯入。`);
      onChanged(await memberLicenseApi.get());
    } catch (err) {
      setError(getLicenseErrorMessage(err, "產生離線授權檔失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  async function deactivate() {
    if (busy) return;
    if (!certificate.trim()) {
      setError("請貼上或選擇離線電腦產生的停用憑證（.deact）");
      return;
    }
    if (!window.confirm("確定要上傳停用憑證嗎？該裝置的離線授權會立即失效，並釋放一個席次。")) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      onChanged(await memberLicenseApi.offlineDeactivate(certificate));
      setCertificate("");
      setMessage("已停用該離線裝置，席次已釋放。");
    } catch (err) {
      setError(getLicenseErrorMessage(err, "停用失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border rounded p-3 mb-4">
      <h4 className="fs-6 mb-2">離線啟用／續期（沒有網路的電腦）</h4>
      <ol className="small text-muted ps-3">
        <li>在離線電腦的 XR 軟體選「離線啟用」，輸入序號，產生請求檔（.req），存到隨身碟。</li>
        <li>用有網路的電腦登入這裡，上傳或貼上請求檔，下載離線授權檔（license.lic）。</li>
        <li>把 license.lic 帶回離線電腦，在 XR 軟體選「匯入授權檔」。</li>
      </ol>
      <p className="small text-muted">
        離線授權有效 {data.offlineLeaseDays} 天，到期前請重複以上步驟換發（同一台電腦不會多佔席次）。請求檔產生後 24 小時內有效，且只能使用一次。
      </p>

      {message && (
        <p className="text-success">
          <i className="bi bi-check-circle-fill me-1" aria-hidden="true"></i>
          {message}
        </p>
      )}
      {error && (
        <p className="text-danger" role="alert">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          {error}
        </p>
      )}

      <TextOrFileInput id="offline-request" label="離線啟用請求檔（.req）" accept=".req,.txt,text/plain" value={request} onChange={setRequest} disabled={busy} />
      <button type="button" className="tier-submit-btn mb-4" onClick={() => void activate()} disabled={busy}>
        <span>{busy ? "處理中…" : "產生離線授權檔"}</span>
      </button>

      <h4 className="fs-6 mb-2">離線停用</h4>
      <p className="small text-muted">
        要把授權換到別台電腦時，在舊的離線電腦的 XR 軟體選「離線停用」產生停用憑證（.deact，產生後軟體會清除本機授權），在這裡上傳才會釋放席次。若電腦已遺失或損壞，請聯絡客服由管理員停用。
      </p>
      <TextOrFileInput id="offline-deact" label="離線停用憑證（.deact）" accept=".deact,.txt,text/plain" value={certificate} onChange={setCertificate} disabled={busy} />
      <button type="button" className="tier-reset-btn text-danger" onClick={() => void deactivate()} disabled={busy}>
        上傳停用憑證
      </button>
    </div>
  );
}
