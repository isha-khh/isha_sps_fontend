import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { Pagination } from '@/components/common/Pagination';
import { formatDate, formatDateTime } from '@/components/shared/DataTable';
import { licensesApi, licenseErrorMessage } from '@/lib/api/licenses';
import { LICENSE_EVENT_LABEL, LICENSE_STATUS_BADGE, LICENSE_STATUS_LABEL } from '@/types/license';
import type { LicenseDetail, LicenseEvent } from '@/types/license';
import { useNotify } from '@/hooks/useNotify';
import { useConfirm } from '@/hooks/useConfirm';

const EVENT_PAGE_SIZE = 30;
const DEVICE_STATUS_LABEL: Record<string, string> = { active: '使用中', deactivated: '已停用', revoked: '已被撤銷' };

/** yyyy-MM-dd（本地日期）給 <input type="date"> */
const toDateInput = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** 事件詳情是 JSON 字串，轉成一行好讀的文字 */
const formatEventDetail = (detail?: string) => {
  if (!detail) return '';
  try {
    const obj = JSON.parse(detail) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
      .join('、');
  } catch {
    return detail;
  }
};

/**
 * 單一授權的詳情：調整席次／租約／期限／備註、暫停・恢復・撤銷、作廢序號、遠端停用裝置，並列出事件紀錄。
 * 席次與租約天數填 0＝改回全域預設。授權期限預設隨會員資格滾動，這裡填日期＝設定上限，清除＝取消上限。
 */
export const LicenseDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const [detail, setDetail] = useState<LicenseDetail | null>(null);
  const [events, setEvents] = useState<LicenseEvent[]>([]);
  const [eventPage, setEventPage] = useState(1);
  const [eventPages, setEventPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  // 表單
  const [seats, setSeats] = useState('');
  const [leaseDays, setLeaseDays] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  // 撤銷原因
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeReason, setRevokeReason] = useState('');

  const fillForm = (d: LicenseDetail) => {
    setSeats(d.seatsOverride ? String(d.seatsOverride) : '0');
    setLeaseDays(d.leaseDaysOverride ? String(d.leaseDaysOverride) : '0');
    setValidUntil(toDateInput(d.validUntil));
    setNotes(d.notes ?? '');
  };

  const loadEvents = useCallback(
    async (page: number) => {
      if (!id) return;
      try {
        const res = await licensesApi.events(id, page, EVENT_PAGE_SIZE);
        setEvents(res.items);
        setEventPage(page);
        setEventPages(Math.max(1, Math.ceil(res.totalCount / EVENT_PAGE_SIZE)));
      } catch (error) {
        await notify.error(licenseErrorMessage(error, '載入事件紀錄失敗'));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  const load = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const d = await licensesApi.get(id);
      setDetail(d);
      fillForm(d);
      await loadEvents(1);
    } catch (error) {
      await notify.error(licenseErrorMessage(error, '載入授權失敗'));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, loadEvents]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyResult = async (d: LicenseDetail, message: string) => {
    setDetail(d);
    fillForm(d);
    await loadEvents(1);
    await notify.success(message);
  };

  const run = async (action: () => Promise<void>) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      await action();
    } catch (error) {
      await notify.error(licenseErrorMessage(error, '操作失敗'));
    } finally {
      setIsBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      if (!id || !detail) return;
      const seatsNum = Number(seats);
      const leaseNum = Number(leaseDays);
      if (!Number.isInteger(seatsNum) || seatsNum < 0 || seatsNum > 100) throw { response: { data: { error: '席次需為 0～100 的整數（0＝使用預設）' } } };
      if (!Number.isInteger(leaseNum) || leaseNum < 0 || leaseNum > 365) throw { response: { data: { error: '租約天數需為 0～365 的整數（0＝使用預設）' } } };
      const hadCap = !!detail.validUntil;
      // 日期沒動就不送，避免把原本精確到秒的期限改成當天 23:59:59
      const capChanged = validUntil !== toDateInput(detail.validUntil);
      const d = await licensesApi.update(id, {
        seatsOverride: seatsNum,
        leaseDaysOverride: leaseNum,
        validUntil: capChanged && validUntil ? new Date(`${validUntil}T23:59:59`).toISOString() : undefined,
        clearValidUntil: capChanged && !validUntil && hadCap,
        notes,
      });
      await applyResult(d, '已儲存');
    });

  const changeStatus = async (action: 'suspend' | 'restore') => {
    if (!id) return;
    const ok = await confirmDialog({
      cardTitle: action === 'suspend' ? '暫停授權' : '恢復授權',
      message: action === 'suspend' ? '暫停後，所有裝置在下次續期時會被拒絕（租約內仍可離線使用）。確定暫停？' : '確定恢復此授權？',
      buttonConfirm: action === 'suspend' ? '暫停' : '恢復',
    });
    if (!ok) return;
    await run(async () => applyResult(await licensesApi.setStatus(id, action), action === 'suspend' ? '已暫停授權' : '已恢復授權'));
  };

  const revoke = () =>
    run(async () => {
      if (!id) return;
      if (!revokeReason.trim()) throw { response: { data: { error: '請輸入撤銷原因' } } };
      const d = await licensesApi.setStatus(id, 'revoke', revokeReason.trim());
      setRevokeOpen(false);
      setRevokeReason('');
      await applyResult(d, '已撤銷授權');
    });

  const invalidateKey = async () => {
    if (!id) return;
    const ok = await confirmDialog({
      cardTitle: '作廢序號',
      message: '舊序號會立即失效，無法再用來啟用新裝置（已啟用的裝置不受影響）。會員可在會員中心重新產生新序號。確定作廢？',
      buttonConfirm: '作廢序號',
      confirmStyle: 'btn-error',
    });
    if (!ok) return;
    await run(async () => applyResult(await licensesApi.invalidateKey(id), '已作廢序號'));
  };

  const revokeDevice = async (activationId: string, name: string) => {
    if (!id) return;
    const ok = await confirmDialog({
      cardTitle: '停用裝置',
      message: `停用「${name}」後，該裝置下次續期會被拒絕，並釋出一個席次。確定停用？`,
      buttonConfirm: '停用裝置',
      confirmStyle: 'btn-error',
    });
    if (!ok) return;
    await run(async () => applyResult(await licensesApi.revokeDevice(id, activationId), '已停用裝置'));
  };

  if (isLoading && !detail) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }
  if (!detail) {
    return (
      <div className="space-y-4">
        {notify.NotifyComponent}
        <PageTitle title="XR 授權" items={[{ label: 'XR 授權', path: '/licenses' }, { label: '找不到授權', active: true }]} />
        <button type="button" className="btn btn-sm" onClick={() => navigate('/licenses')}>
          返回清單
        </button>
      </div>
    );
  }

  const terminal = detail.status === 'revoked';

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      {ConfirmComponent}
      <PageTitle
        title="XR 授權詳情"
        items={[{ label: 'XR 授權', path: '/licenses' }, { label: detail.companyName || detail.memberName, active: true }]}
      />

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{detail.companyName || detail.memberName}</h2>
              <p className="text-sm text-base-content/60">
                {detail.memberName} · {detail.memberEmail}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`badge ${LICENSE_STATUS_BADGE[detail.status]}`}>{LICENSE_STATUS_LABEL[detail.status]}</span>
              {!detail.memberEligible && <span className="badge badge-error badge-outline">會員無資格</span>}
            </div>
          </div>

          {!detail.memberEligible && (
            <div role="alert" className="alert alert-warning text-sm">
              <span>{detail.ineligibleReason || '此會員目前不符合 XR 使用資格，續期將被拒絕。'}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div>
              <div className="text-base-content/60">序號</div>
              <code>…{detail.keyHint}</code>
            </div>
            <div>
              <div className="text-base-content/60">裝置／席次</div>
              {detail.activeDevices} / {detail.seats}
              {detail.seatsOverridden ? '（個別）' : `（預設 ${detail.defaultSeats}）`}
            </div>
            <div>
              <div className="text-base-content/60">租約天數</div>
              {detail.leaseDays}
              {detail.leaseDaysOverride ? '（個別）' : '（預設）'}
            </div>
            <div>
              <div className="text-base-content/60">授權期限</div>
              {formatDate(detail.validUntil)}
            </div>
            <div>
              <div className="text-base-content/60">建立時間</div>
              {formatDateTime(detail.createdTime)}
            </div>
            <div>
              <div className="text-base-content/60">最後連線</div>
              {formatDateTime(detail.lastSeenAt)}
            </div>
          </div>

          <div className="divider my-0" />

          <h3 className="font-medium">調整</h3>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="form-control">
              <span className="label-text mb-1 text-sm">席次（0＝使用預設 {detail.defaultSeats}）</span>
              <input type="number" min={0} max={100} className="input input-bordered input-sm" value={seats} disabled={terminal} onChange={(e) => setSeats(e.target.value)} />
            </label>
            <label className="form-control">
              <span className="label-text mb-1 text-sm">租約天數（0＝使用預設）</span>
              <input type="number" min={0} max={365} className="input input-bordered input-sm" value={leaseDays} disabled={terminal} onChange={(e) => setLeaseDays(e.target.value)} />
            </label>
            <label className="form-control md:col-span-2">
              <span className="label-text mb-1 text-sm">授權期限上限（空白＝隨會員資格滾動）</span>
              <input type="date" className="input input-bordered input-sm" value={validUntil} disabled={terminal} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
            <label className="form-control md:col-span-4">
              <span className="label-text mb-1 text-sm">備註（僅後台可見）</span>
              <textarea className="textarea textarea-bordered text-sm" rows={2} maxLength={500} value={notes} disabled={terminal} onChange={(e) => setNotes(e.target.value)} />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary btn-sm" disabled={isBusy || terminal} onClick={() => void save()}>
              儲存調整
            </button>
            {detail.status === 'active' && (
              <button type="button" className="btn btn-warning btn-sm btn-outline" disabled={isBusy} onClick={() => void changeStatus('suspend')}>
                暫停授權
              </button>
            )}
            {detail.status === 'suspended' && (
              <button type="button" className="btn btn-success btn-sm btn-outline" disabled={isBusy} onClick={() => void changeStatus('restore')}>
                恢復授權
              </button>
            )}
            {!terminal && (
              <>
                <button type="button" className="btn btn-sm btn-outline" disabled={isBusy} onClick={() => void invalidateKey()}>
                  作廢序號
                </button>
                <button type="button" className="btn btn-error btn-sm btn-outline" disabled={isBusy} onClick={() => setRevokeOpen(true)}>
                  撤銷授權
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-3">
          <h3 className="font-medium">裝置（{detail.devices.length}）</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>名稱</th>
                  <th>狀態</th>
                  <th>方式</th>
                  <th>首次啟用</th>
                  <th>最後連線</th>
                  <th>租約到期</th>
                  <th>版本／IP</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {detail.devices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-base-content/60">
                      尚無裝置啟用
                    </td>
                  </tr>
                )}
                {detail.devices.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div>{d.deviceName}</div>
                      <code className="text-xs text-base-content/50">{d.deviceHashPreview}</code>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${d.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>{DEVICE_STATUS_LABEL[d.status] ?? d.status}</span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${d.activationMode === 'offline' ? 'badge-info' : 'badge-ghost'}`}>{d.activationMode === 'offline' ? '離線' : '線上'}</span>
                    </td>
                    <td className="text-xs">{formatDateTime(d.firstActivatedAt)}</td>
                    <td className="text-xs">{formatDateTime(d.lastSeenAt)}</td>
                    <td className="text-xs">{formatDateTime(d.leaseUntil)}</td>
                    <td className="text-xs">
                      {d.clientVersion || '-'}
                      <br />
                      {d.lastIp || '-'}
                    </td>
                    <td className="text-right">
                      {d.status === 'active' && (
                        <button type="button" className="btn btn-xs btn-error btn-outline" disabled={isBusy} onClick={() => void revokeDevice(d.id, d.deviceName)}>
                          停用
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body gap-3">
          <h3 className="font-medium">事件紀錄</h3>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>時間</th>
                  <th>事件</th>
                  <th>操作者</th>
                  <th>內容</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-base-content/60">
                      沒有紀錄
                    </td>
                  </tr>
                )}
                {events.map((e) => (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap text-xs">{formatDateTime(e.at)}</td>
                    <td>{LICENSE_EVENT_LABEL[e.eventType] ?? e.eventType}</td>
                    <td className="text-xs">{e.actor}</td>
                    <td className="max-w-md break-all text-xs text-base-content/70">{formatEventDetail(e.detail)}</td>
                    <td className="text-xs">{e.ip || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={eventPage} totalPages={eventPages} onPageChange={(p) => void loadEvents(p)} />
        </div>
      </div>

      {revokeOpen && (
        <dialog className="modal modal-open">
          <div className="modal-box">
            <h3 className="text-lg font-bold">撤銷授權</h3>
            <p className="py-2 text-sm text-base-content/70">撤銷後所有裝置立即停用，且無法恢復（會員需由後台另行處理）。請輸入撤銷原因，會記錄在事件紀錄。</p>
            <textarea className="textarea textarea-bordered w-full" rows={3} maxLength={300} placeholder="撤銷原因（必填）" value={revokeReason} onChange={(e) => setRevokeReason(e.target.value)} />
            <div className="modal-action">
              <button type="button" className="btn btn-sm" disabled={isBusy} onClick={() => setRevokeOpen(false)}>
                取消
              </button>
              <button type="button" className="btn btn-error btn-sm" disabled={isBusy} onClick={() => void revoke()}>
                確定撤銷
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !isBusy && setRevokeOpen(false)} />
        </dialog>
      )}
    </div>
  );
};
