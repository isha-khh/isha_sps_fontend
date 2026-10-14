import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { Pagination } from '@/components/common/Pagination';
import { ListToolbar } from '@/components/common/ListToolbar';
import { DataTable, formatDate, formatDateTime } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { licensesApi, licenseErrorMessage } from '@/lib/api/licenses';
import { LICENSE_STATUS_BADGE, LICENSE_STATUS_LABEL } from '@/types/license';
import type { LicenseListItem, LicenseSettings, LicenseStats } from '@/types/license';
import { useNotify } from '@/hooks/useNotify';
import { useConfirm } from '@/hooks/useConfirm';

const PAGE_SIZE = 20;

/**
 * XR 軟體授權清單：每位符合資格的會員（企業需求端）在會員中心產生序號後，會出現在這裡。
 * 也在這裡設定全域預設席次與租約天數（個別授權可在詳情頁覆寫）。
 */
export const LicensesListPage = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const [items, setItems] = useState<LicenseListItem[]>([]);
  const [stats, setStats] = useState<LicenseStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [settings, setSettings] = useState<LicenseSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const load = useCallback(
    async (targetPage: number) => {
      setIsLoading(true);
      try {
        const [list, summary] = await Promise.all([
          licensesApi.list(targetPage, PAGE_SIZE, { search: search || undefined, status: status || undefined }),
          licensesApi.getStats(),
        ]);
        setItems(list.items);
        setTotalPages(Math.max(1, Math.ceil(list.totalCount / PAGE_SIZE)));
        setPage(targetPage);
        setStats(summary);
      } catch (error) {
        await notify.error(licenseErrorMessage(error, '載入授權清單失敗'));
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, status],
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useEffect(() => {
    licensesApi
      .getSettings()
      .then(setSettings)
      .catch(() => undefined);
  }, []);

  const saveSettings = async () => {
    if (!settings || isSavingSettings) return;
    if (!Number.isInteger(settings.defaultSeats) || settings.defaultSeats < 1 || settings.defaultSeats > 100) {
      await notify.error('預設席次需為 1～100 的整數');
      return;
    }
    if (!Number.isInteger(settings.leaseDays) || settings.leaseDays < 1 || settings.leaseDays > 365) {
      await notify.error('租約天數需為 1～365 的整數');
      return;
    }
    if (!Number.isInteger(settings.offlineLeaseDays) || settings.offlineLeaseDays < 1 || settings.offlineLeaseDays > 365) {
      await notify.error('離線租約天數需為 1～365 的整數');
      return;
    }
    const ok = await confirmDialog({
      cardTitle: '儲存授權設定',
      message: '預設席次與租約天數會套用到沒有個別覆寫的授權。調降席次不會踢掉已啟用的裝置，但超額者將無法再啟用新裝置。確定儲存？',
      buttonConfirm: '儲存',
    });
    if (!ok) return;
    setIsSavingSettings(true);
    try {
      setSettings(await licensesApi.updateSettings(settings));
      await notify.success('已儲存授權設定');
      void load(page);
    } catch (error) {
      await notify.error(licenseErrorMessage(error, '儲存授權設定失敗'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const columns: Column<LicenseListItem>[] = [
    {
      key: 'member',
      title: '會員',
      render: (item) => (
        <div>
          <div className="font-medium">{item.companyName || item.memberName}</div>
          <div className="text-xs text-base-content/60">
            {item.memberName} · {item.memberEmail}
          </div>
        </div>
      ),
    },
    { key: 'keyHint', title: '序號', render: (item) => <code className="text-xs">…{item.keyHint}</code> },
    { key: 'status', title: '狀態', render: (item) => <span className={`badge ${LICENSE_STATUS_BADGE[item.status]}`}>{LICENSE_STATUS_LABEL[item.status]}</span> },
    {
      key: 'seats',
      title: '裝置／席次',
      render: (item) => (
        <span>
          {item.activeDevices} / {item.seats}
          {item.seatsOverridden && <span className="badge badge-outline badge-xs ml-1">個別</span>}
        </span>
      ),
    },
    { key: 'validUntil', title: '授權期限', className: 'text-sm', render: (item) => formatDate(item.validUntil) },
    { key: 'lastSeenAt', title: '最後連線', className: 'text-sm text-base-content/70', render: (item) => formatDateTime(item.lastSeenAt) },
  ];

  const hasFilters = !!search || !!status;

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      {ConfirmComponent}
      <div className="flex items-start justify-between gap-4">
        <PageTitle title="XR 授權" items={[{ label: '人才培育' }, { label: 'XR 授權', active: true }]} />
        <button type="button" className="btn btn-sm btn-outline shrink-0" onClick={() => navigate('/licenses/keys')}>
          <span className="iconify lucide--key-round size-4" />
          簽章金鑰
        </button>
      </div>

      {stats && (
        <div className="stats shadow bg-base-100 w-full overflow-x-auto">
          <div className="stat">
            <div className="stat-title">授權總數</div>
            <div className="stat-value">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="stat-title">使用中</div>
            <div className="stat-value text-success">{stats.active}</div>
          </div>
          <div className="stat">
            <div className="stat-title">已暫停</div>
            <div className="stat-value text-warning">{stats.suspended}</div>
          </div>
          <div className="stat">
            <div className="stat-title">已撤銷</div>
            <div className="stat-value text-error">{stats.revoked}</div>
          </div>
          <div className="stat">
            <div className="stat-title">啟用中裝置</div>
            <div className="stat-value text-info">{stats.activeDevices}</div>
          </div>
        </div>
      )}

      {settings && (
        <div className="card bg-base-100 shadow">
          <div className="card-body gap-3">
            <h3 className="font-medium">全域授權設定</h3>
            <div className="flex flex-wrap items-end gap-4">
              <label className="form-control">
                <span className="label-text text-sm mb-1">每份授權預設席次（可同時啟用的裝置數）</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="input input-bordered input-sm w-40"
                  value={settings.defaultSeats}
                  onChange={(e) => setSettings({ ...settings, defaultSeats: Number(e.target.value) })}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-sm mb-1">租約天數（離線可用期限，到期前需連線續期）</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="input input-bordered input-sm w-40"
                  value={settings.leaseDays}
                  onChange={(e) => setSettings({ ...settings, leaseDays: Number(e.target.value) })}
                />
              </label>
              <label className="form-control">
                <span className="label-text text-sm mb-1">離線租約天數（離線電腦需在期限內帶回平台換發）</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  className="input input-bordered input-sm w-40"
                  value={settings.offlineLeaseDays}
                  onChange={(e) => setSettings({ ...settings, offlineLeaseDays: Number(e.target.value) })}
                />
              </label>
              <label className="label cursor-pointer gap-2 pb-1">
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={settings.offlineEnabled}
                  onChange={(e) => setSettings({ ...settings, offlineEnabled: e.target.checked })}
                />
                <span className="label-text text-sm">開放離線啟用</span>
              </label>
              <button type="button" className="btn btn-primary btn-sm" disabled={isSavingSettings} onClick={() => void saveSettings()}>
                {isSavingSettings ? <span className="loading loading-spinner loading-xs" /> : '儲存設定'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <ListToolbar
            searchPlaceholder="搜尋會員姓名、信箱、公司、序號末碼..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={() => setSearch(searchInput.trim())}
            isLoading={isLoading}
            showClearFilter={hasFilters}
            onClearFilter={() => {
              setSearch('');
              setSearchInput('');
              setStatus('');
            }}
            filters={
              <select className="select select-bordered select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">全部狀態</option>
                <option value="active">使用中</option>
                <option value="suspended">已暫停</option>
                <option value="revoked">已撤銷</option>
              </select>
            }
          />

          <DataTable
            data={items}
            columns={columns}
            keyField="id"
            isLoading={isLoading}
            emptyIcon="lucide--key-round"
            emptyMessage="目前沒有授權（會員在會員中心產生序號後會出現在這裡）"
            confirmDialog={confirmDialog}
            primaryActions={[{ label: '詳情', icon: 'lucide--eye', onClick: (item) => navigate(`/licenses/${item.id}`) }]}
          />
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(p) => void load(p)} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};
