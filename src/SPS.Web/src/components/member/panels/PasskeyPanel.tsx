"use client";

import { useEffect, useState } from "react";
import { authApi } from "@/lib/api/auth";
import { fromAttestationResponse, toCreationOptions } from "@/lib/webauthn";
import type { Fido2CredentialInfo } from "@/types/fido2";
import { getApiErrorMessage } from "@/lib/error-utils";

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-TW", { hour12: false });
}

/**
 * 積木元件：會員中心「Passkey 管理」面板。Passkey 是用裝置的指紋、臉部辨識或安全金鑰登入，不用輸入密碼；
 * 這裡可以替目前的帳號新增（`POST /api/Auth/fido2/register/*`）、查看與刪除已註冊的裝置
 * （`GET/DELETE /api/Auth/fido2/credentials`），登入頁有「使用 Passkey 登入」按鈕。
 *
 * 功能要在後台系統設定開啟 FIDO2（`GET /api/Auth/fido2/status`），沒開啟時顯示說明；瀏覽器不支援 WebAuthn 時
 * 也顯示說明。註冊必須在 HTTPS（或 localhost）下才能用，且網域要跟後台設定的 FIDO2 伺服器網域一致。
 */
export default function PasskeyPanel() {
  const [enabled, setEnabled] = useState<boolean>();
  // 這個面板只在登入後的會員中心（瀏覽器端）渲染，不會在伺服器端渲染，所以可以直接讀瀏覽器能力
  const [supported] = useState(() => typeof window !== "undefined" && "PublicKeyCredential" in window && Boolean(navigator.credentials));
  const [credentials, setCredentials] = useState<Fido2CredentialInfo[]>([]);
  const [deviceName, setDeviceName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  useEffect(() => {
    let active = true;
    authApi
      .fido2GetStatus()
      .then(async (status) => {
        if (!active) return;
        setEnabled(status.enabled);
        if (status.enabled) {
          const list = await authApi.fido2GetCredentials();
          if (active) setCredentials(list);
        }
      })
      .catch((err) => {
        if (!active) return;
        setEnabled(false);
        setError(getApiErrorMessage(err, "載入 Passkey 失敗"));
      });
    return () => {
      active = false;
    };
  }, []);

  async function register() {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const options = await authApi.fido2RegisterStart();
      const credential = (await navigator.credentials.create({ publicKey: toCreationOptions(options) })) as PublicKeyCredential | null;
      if (!credential) throw new Error("cancelled");
      await authApi.fido2RegisterComplete({ attestationResponse: fromAttestationResponse(credential), deviceName: deviceName.trim() || undefined });
      setDeviceName("");
      setMessage("已新增 Passkey，下次可以在登入頁用它登入。");
      setCredentials(await authApi.fido2GetCredentials());
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === "NotAllowedError" || (err as Error).message === "cancelled") setError("已取消，或裝置沒有完成驗證。");
      else if (name === "InvalidStateError") setError("這個裝置已經註冊過 Passkey。");
      else if (name === "SecurityError") setError("Passkey 的網域設定與目前網站網址不一致，無法註冊，請通知管理員檢查系統設定中的 FIDO2 伺服器網域。");
      else setError(getApiErrorMessage(err, "新增 Passkey 失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(credential: Fido2CredentialInfo) {
    if (!window.confirm(`確定要刪除「${credential.deviceName || "未命名裝置"}」嗎？刪除後這個裝置就不能再用 Passkey 登入。`)) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await authApi.fido2DeleteCredential(credential.id);
      setMessage("已刪除");
      setCredentials(await authApi.fido2GetCredentials());
    } catch (err) {
      setError(getApiErrorMessage(err, "刪除失敗，請稍後再試"));
    } finally {
      setBusy(false);
    }
  }

  if (enabled === undefined) return <p className="text-muted">載入中…</p>;

  if (!enabled) {
    return (
      <p className="text-muted">
        <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
        Passkey 功能目前未開放。{error}
      </p>
    );
  }

  return (
    <div>
      <p className="small text-muted">Passkey 讓您用手機或電腦的指紋、臉部辨識或安全金鑰登入，不必輸入密碼。每個裝置各註冊一次。</p>

      {!supported && (
        <p className="text-danger">
          <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
          這個瀏覽器不支援 Passkey，請改用較新的瀏覽器，並確認網址是 https。
        </p>
      )}

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

      <div className="d-flex flex-wrap gap-2 align-items-end mb-4">
        <div style={{ minWidth: 240, flex: "1 1 240px" }}>
          <label className="mb-2" htmlFor="passkey-name">
            裝置名稱（選填，方便辨識）
          </label>
          <input id="passkey-name" type="text" className="form-control" maxLength={100} placeholder="例如：辦公室筆電" value={deviceName} onChange={(e) => setDeviceName(e.target.value)} />
        </div>
        <button type="button" className="tier-submit-btn" onClick={() => void register()} disabled={busy || !supported}>
          <span>{busy ? "處理中…" : "新增 Passkey"}</span>
        </button>
      </div>

      {credentials.length === 0 ? (
        <p className="text-muted">尚未註冊任何 Passkey。</p>
      ) : (
        <div className="d-grid gap-2">
          {credentials.map((credential) => (
            <div key={credential.id} className="border rounded p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <strong>{credential.deviceName || "未命名裝置"}</strong>
                <div className="small text-muted">
                  建立於 {formatDateTime(credential.createdTime)}　最近使用 {formatDateTime(credential.lastUsedAt)}
                </div>
              </div>
              <button type="button" className="tier-reset-btn text-danger" onClick={() => void remove(credential)} disabled={busy}>
                刪除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
