import { Fragment, useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { formatDateTime } from '@/components/shared/DataTable';
import { licensesApi, licenseErrorMessage } from '@/lib/api/licenses';
import { SIGNING_KEY_STATUS_LABEL } from '@/types/license';
import type { SigningKey, SigningKeyStatus } from '@/types/license';
import { useNotify } from '@/hooks/useNotify';
import { useConfirm } from '@/hooks/useConfirm';

const STATUS_BADGE: Record<SigningKeyStatus, string> = {
  active: 'badge-success',
  standby: 'badge-info',
  retiring: 'badge-warning',
  retired: 'badge-ghost',
};

/**
 * XR 授權簽章金鑰：私鑰只存在 Google Cloud KMS，後台只登錄「金鑰版本資源名稱」，不接受上傳私鑰。
 * 同一時間只有一把 active 簽發新授權；退役中（retiring）的仍保留在公鑰清單，讓舊授權可驗證。
 * kid 以 test-／prod- 開頭區分測試與正式環境（測試機登錄測試金鑰，正式機登錄正式金鑰）。
 */
export const LicenseKeysPage = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const [keys, setKeys] = useState<SigningKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [kid, setKid] = useState('');
  const [kmsKeyVersion, setKmsKeyVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      setKeys(await licensesApi.getKeys());
    } catch (error) {
      await notify.error(licenseErrorMessage(error, '載入簽章金鑰失敗'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const register = async () => {
    if (isBusy) return;
    if (!kid.trim() || !kmsKeyVersion.trim()) {
      await notify.error('請填寫 kid 與 KMS 金鑰版本');
      return;
    }
    const ok = await confirmDialog({
      cardTitle: '登錄簽章金鑰',
      message: '系統會向 Cloud KMS 取得公鑰並驗證可簽章。若目前沒有 active 的金鑰，這把會直接成為 active；否則先以「待命」登錄。確定登錄？',
      buttonConfirm: '登錄',
    });
    if (!ok) return;
    setIsBusy(true);
    try {
      await licensesApi.registerKey({ kid: kid.trim(), kmsKeyVersion: kmsKeyVersion.trim(), notes: notes.trim() || undefined });
      setKid('');
      setKmsKeyVersion('');
      setNotes('');
      setShowForm(false);
      await notify.success('已登錄簽章金鑰');
      await load();
    } catch (error) {
      await notify.error(licenseErrorMessage(error, '登錄失敗（請確認 KMS 權限與金鑰版本名稱）'));
    } finally {
      setIsBusy(false);
    }
  };

  const setStatus = async (key: SigningKey, status: SigningKeyStatus, title: string, message: string) => {
    const ok = await confirmDialog({ cardTitle: title, message, buttonConfirm: '確定' });
    if (!ok) return;
    setIsBusy(true);
    try {
      await licensesApi.updateKey(key.kid, { status });
      await notify.success('已更新金鑰狀態');
      await load();
    } catch (error) {
      await notify.error(licenseErrorMessage(error, '更新金鑰狀態失敗'));
    } finally {
      setIsBusy(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      await notify.success('已複製');
    } catch {
      await notify.error('複製失敗，請手動選取');
    }
  };

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      {ConfirmComponent}
      <div className="flex items-start justify-between gap-4">
        <PageTitle title="XR 簽章金鑰" items={[{ label: 'XR 授權', path: '/licenses' }, { label: '簽章金鑰', active: true }]} />
        <div className="flex gap-2 shrink-0">
          <button type="button" className="btn btn-sm btn-outline" onClick={() => navigate('/licenses')}>
            返回授權清單
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={() => setShowForm((v) => !v)}>
            <span className="iconify lucide--plus size-4" />
            登錄金鑰
          </button>
        </div>
      </div>

      <div role="alert" className="alert alert-info text-sm">
        <span>
          簽章私鑰存放在 Google Cloud KMS，後台不接受私鑰上傳。請先依文件在 GCP 建立 EC P-256 簽章金鑰並授權本系統的服務帳號（Cloud KMS CryptoKey Signer、Public Key Viewer），再在這裡登錄金鑰版本資源名稱。
        </span>
      </div>

      {showForm && (
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-3">
            <h3 className="font-medium">登錄新金鑰</h3>
            <label className="form-control">
              <span className="label-text mb-1 text-sm">kid（金鑰識別碼，測試環境用 test-，正式環境用 prod-，例如 test-2026-10）</span>
              <input className="input input-bordered input-sm" maxLength={64} value={kid} onChange={(e) => setKid(e.target.value)} placeholder="test-2026-10" />
            </label>
            <label className="form-control">
              <span className="label-text mb-1 text-sm">KMS 金鑰版本資源名稱</span>
              <input
                className="input input-bordered input-sm font-mono"
                value={kmsKeyVersion}
                onChange={(e) => setKmsKeyVersion(e.target.value)}
                placeholder="projects/<專案>/locations/<地區>/keyRings/<keyring>/cryptoKeys/<key>/cryptoKeyVersions/1"
              />
            </label>
            <label className="form-control">
              <span className="label-text mb-1 text-sm">備註（選填）</span>
              <input className="input input-bordered input-sm" maxLength={300} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-sm" disabled={isBusy} onClick={() => setShowForm(false)}>
                取消
              </button>
              <button type="button" className="btn btn-primary btn-sm" disabled={isBusy} onClick={() => void register()}>
                {isBusy ? <span className="loading loading-spinner loading-xs" /> : '登錄'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner" />
            </div>
          ) : keys.length === 0 ? (
            <p className="py-8 text-center text-base-content/60">尚未登錄任何簽章金鑰，授權功能無法簽發。</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>kid</th>
                    <th>狀態</th>
                    <th>KMS 金鑰版本</th>
                    <th>登錄時間</th>
                    <th>備註</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <Fragment key={k.kid}>
                      <tr>
                        <td className="font-mono text-sm">{k.kid}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[k.status]}`}>{SIGNING_KEY_STATUS_LABEL[k.status]}</span>
                        </td>
                        <td className="max-w-xs break-all font-mono text-xs">{k.kmsKeyVersion}</td>
                        <td className="whitespace-nowrap text-xs">{formatDateTime(k.createdTime)}</td>
                        <td className="text-xs">{k.notes || '-'}</td>
                        <td className="whitespace-nowrap text-right">
                          <button type="button" className="btn btn-xs btn-ghost" onClick={() => setExpanded(expanded === k.kid ? null : k.kid)}>
                            公鑰
                          </button>
                          {k.status === 'standby' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-success btn-outline ml-1"
                              disabled={isBusy}
                              onClick={() => void setStatus(k, 'active', '切換為簽發中', '這把金鑰會成為簽發新授權的金鑰，目前的 active 金鑰會改為「退役中」（舊授權仍可驗證）。確定切換？')}
                            >
                              設為簽發
                            </button>
                          )}
                          {k.status === 'retiring' && (
                            <button
                              type="button"
                              className="btn btn-xs btn-outline ml-1"
                              disabled={isBusy}
                              onClick={() => void setStatus(k, 'retired', '金鑰退役', '退役後公鑰清單不再包含此金鑰，用它簽的舊授權將無法驗證。請確認所有裝置都已續期換發。確定退役？')}
                            >
                              退役
                            </button>
                          )}
                        </td>
                      </tr>
                      {expanded === k.kid && (
                        <tr>
                          <td colSpan={6} className="bg-base-200">
                            <div className="flex items-start justify-between gap-2">
                              <pre className="whitespace-pre-wrap break-all text-xs">{k.publicKey}</pre>
                              <button type="button" className="btn btn-xs shrink-0" onClick={() => void copy(k.publicKey)}>
                                複製
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
