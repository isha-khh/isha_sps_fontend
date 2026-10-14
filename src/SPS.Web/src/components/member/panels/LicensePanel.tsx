"use client";

import { useEffect, useState } from "react";
import { getLicenseErrorMessage, memberLicenseApi, type MemberLicense } from "@/lib/api/member-license";

const STATUS_LABEL: Record<string, string> = { active: "使用中", suspended: "已暫停", revoked: "已撤銷", expired: "已過期" };
const DEVICE_STATUS_LABEL: Record<string, string> = { active: "使用中", deactivated: "已停用", revoked: "已被停用" };

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("zh-TW", { hour12: false });
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("zh-TW");
}

/**
 * 積木元件：會員中心「XR 授權」面板。XR 軟體本身可以公開下載，但要使用必須有授權序號；
 * 只有企業需求端（含兼營）會員能取得。這裡可以產生序號（序號只顯示一次，要自己存好）、
 * 查看目前啟用的裝置與剩餘席次、停用不用的裝置，序號遺失可重新產生（舊序號立即失效，已啟用裝置不受影響）。
 * 對應 `GET/POST /api/member/license`。
 */
export default function LicensePanel() {
  const [data, setData] = useState<MemberLicense>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();
  // 剛產生的序號只存在這個畫面的記憶體裡，離開面板就看不到了
  const [newKey, setNewKey] = useState<string>();

  useEffect(() => {
    let active = true;
    memberLicenseApi
      .get()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(getLicenseErrorMessage(err, "載入授權資訊失敗"));
      });
    return () => {
      active = false;
    };
  }, []);

  async function run(action: () => Promise<MemberLicense>, successMessage: string) {
    if (busy) return;
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const result = await action();
      setData(result);
      if (result.newKey) setNewKey(result.newKey);
      setMessage(successMessage);
    } catch (err) {
      setError(getLicenseErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function copyKey() {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setMessage("已複製序號");
    } catch {
      setError("複製失敗，請手動選取序號");
    }
  }

  function regenerate() {
    if (!window.confirm("重新產生後，舊序號會立即失效（已啟用的裝置不受影響）。確定要重新產生嗎？")) return;
    setNewKey(undefined);
    void run(() => memberLicenseApi.regenerate(), "已產生新序號，請立即複製保存。");
  }

  function deactivate(id: string, name: string) {
    if (!window.confirm(`確定要停用「${name}」嗎？停用後該裝置需重新輸入序號才能再使用，並會釋出一個席次。`)) return;
    void run(() => memberLicenseApi.deactivateDevice(id), "已停用裝置");
  }

  if (!data) {
    return error ? (
      <p className="text-danger" role="alert">
        <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
        {error}
      </p>
    ) : (
      <p className="text-muted">載入中…</p>
    );
  }

  if (!data.eligible) {
    return (
      <p className="text-muted">
        <i className="bi bi-info-circle-fill me-1" aria-hidden="true"></i>
        {data.ineligibleReason || "XR 僅提供企業需求端會員使用。"}
      </p>
    );
  }

  const devices = data.devices.filter((device) => device.status === "active");
  const usable = data.status === "active";

  return (
    <div>
      <p className="small text-muted">
        XR 訓練軟體可自由下載，但需要授權序號才能使用。請在軟體中輸入序號啟用；每份授權可同時啟用的裝置數有上限，不用的裝置可在下方停用以釋出席次。
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

      {!data.hasLicense ? (
        <div className="border rounded p-3 mb-4">
          <p className="mb-3">您尚未取得授權序號。</p>
          <button type="button" className="tier-submit-btn" onClick={() => void run(() => memberLicenseApi.create(), "已產生序號，請立即複製保存。")} disabled={busy}>
            <span>{busy ? "處理中…" : "取得授權序號"}</span>
          </button>
        </div>
      ) : (
        <>
          {newKey && (
            <div className="border border-warning rounded p-3 mb-4" role="status">
              <p className="mb-2">
                <strong>您的授權序號（只會顯示這一次，離開此頁就看不到了，請立即複製保存）</strong>
              </p>
              <code className="d-block mb-2 fs-5" style={{ wordBreak: "break-all", userSelect: "all" }}>
                {newKey}
              </code>
              <button type="button" className="tier-reset-btn" onClick={() => void copyKey()}>
                <i className="bi bi-clipboard me-1" aria-hidden="true"></i>
                複製序號
              </button>
            </div>
          )}

          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <div className="small text-muted">狀態</div>
              <strong>{STATUS_LABEL[data.status ?? ""] ?? data.status}</strong>
            </div>
            <div className="col-6 col-md-3">
              <div className="small text-muted">序號</div>
              <code>…{data.keyHint}</code>
            </div>
            <div className="col-6 col-md-3">
              <div className="small text-muted">裝置 / 席次</div>
              <strong>
                {data.activeDevices} / {data.seats}
              </strong>
            </div>
            <div className="col-6 col-md-3">
              <div className="small text-muted">授權期限</div>
              <strong>{formatDate(data.validUntil)}</strong>
            </div>
          </div>

          {!usable && (
            <p className="text-danger">
              <i className="bi bi-exclamation-circle-fill me-1" aria-hidden="true"></i>
              目前授權{STATUS_LABEL[data.status ?? ""] ?? ""}，軟體將無法續期；如有疑問請聯繫平台客服。
            </p>
          )}

          <h4 className="mb-3 fs-6">已啟用的裝置</h4>
          {devices.length === 0 ? (
            <p className="text-muted">尚未有裝置啟用。請在 XR 軟體中輸入序號。</p>
          ) : (
            <div className="d-grid gap-2 mb-4">
              {devices.map((device) => (
                <div key={device.id} className="border rounded p-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <strong>{device.deviceName || "未命名裝置"}</strong>
                    <span className="badge text-bg-light ms-2">{DEVICE_STATUS_LABEL[device.status] ?? device.status}</span>
                    <div className="small text-muted">
                      首次啟用 {formatDateTime(device.firstActivatedAt)}　最近連線 {formatDateTime(device.lastSeenAt)}
                    </div>
                    <div className="small text-muted">離線可用至 {formatDateTime(device.leaseUntil)}（連線時自動延長，租約 {data.leaseDays} 天）</div>
                  </div>
                  <button type="button" className="tier-reset-btn text-danger" onClick={() => deactivate(device.id, device.deviceName || "未命名裝置")} disabled={busy}>
                    停用
                  </button>
                </div>
              ))}
            </div>
          )}

          <button type="button" className="tier-reset-btn" onClick={regenerate} disabled={busy}>
            <i className="bi bi-arrow-repeat me-1" aria-hidden="true"></i>
            序號遺失／外流？重新產生序號
          </button>
        </>
      )}
    </div>
  );
}
