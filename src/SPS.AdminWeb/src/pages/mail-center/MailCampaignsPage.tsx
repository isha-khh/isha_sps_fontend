import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { mailCampaignsApi } from '@/lib/api/mailCampaigns';
import { useConfirm } from '@/hooks/useConfirm';
import { useNotify } from '@/hooks/useNotify';
import type {
  CampaignDetail,
  CampaignListItem,
  EmailCampaignStatus as Status,
} from '@/types/mailCampaign';
import { EmailCampaignStatus, EmailSendMode } from '@/types/mailCampaign';

const STATUS_META: Record<number, { label: string; color: string }> = {
  [EmailCampaignStatus.Draft]: { label: '草稿', color: 'ghost' },
  [EmailCampaignStatus.Queued]: { label: '排隊中', color: 'info' },
  [EmailCampaignStatus.Sending]: { label: '寄送中', color: 'warning' },
  [EmailCampaignStatus.Completed]: { label: '已完成', color: 'success' },
  [EmailCampaignStatus.Failed]: { label: '失敗', color: 'error' },
  [EmailCampaignStatus.Cancelled]: { label: '已取消', color: 'ghost' },
};

const MODE_LABEL: Record<number, string> = {
  [EmailSendMode.Bcc]: 'BCC',
  [EmailSendMode.PerRecipient]: '每人一封',
};

export const MailCampaignsPage = () => {
  const navigate = useNavigate();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const notify = useNotify();

  const [items, setItems] = useState<CampaignListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    void fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchList = async () => {
    setIsLoading(true);
    try {
      const res = await mailCampaignsApi.list({
        page,
        pageSize: 20,
        status: statusFilter === '' ? undefined : (Number(statusFilter) as Status),
        search: search.trim() || undefined,
      });
      setItems(res.items);
      setTotalPages(res.totalPages);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    setPage(1);
    void fetchList();
  };

  const handleClear = () => {
    setStatusFilter('');
    setSearch('');
    setPage(1);
    setTimeout(() => void fetchList(), 0);
  };

  const handleViewDetail = async (id: string) => {
    setIsDetailOpen(true);
    setIsLoadingDetail(true);
    try {
      const d = await mailCampaignsApi.getById(id);
      setDetail(d);
    } catch (err) {
      console.error('Failed to fetch campaign detail:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCancel = async (item: CampaignListItem) => {
    const ok = await confirmDialog({
      cardTitle: '取消活動',
      message: `確定要取消「${item.subject}」？取消後無法復原。`,
      buttonConfirm: '取消活動',
      buttonCancel: '保留',
    });
    if (!ok) return;
    try {
      await mailCampaignsApi.cancel(item.id);
      notify.success('活動已取消');
      void fetchList();
    } catch (err) {
      const msg = err instanceof Error ? err.message : '取消失敗';
      notify.error(msg);
    }
  };

  const renderStatus = (s: number) => {
    const m = STATUS_META[s] ?? { label: `狀態 ${s}`, color: 'ghost' };
    return <span className={`badge badge-${m.color} badge-sm`}>{m.label}</span>;
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="郵件活動"
        items={[
          { label: '郵件中心' },
          { label: '郵件活動', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-4">
          {/* 篩選列 */}
          <div className="flex flex-wrap gap-3 items-end">
            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">主旨關鍵字</span>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                placeholder="搜尋..."
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">狀態</span>
              <select
                className="select select-bordered select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">全部</option>
                <option value={EmailCampaignStatus.Queued}>排隊中</option>
                <option value={EmailCampaignStatus.Sending}>寄送中</option>
                <option value={EmailCampaignStatus.Completed}>已完成</option>
                <option value={EmailCampaignStatus.Failed}>失敗</option>
                <option value={EmailCampaignStatus.Cancelled}>已取消</option>
              </select>
            </label>
            <button className="btn btn-primary btn-sm" onClick={handleApply}>
              <span className="iconify lucide--search size-4" />
              查詢
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              清除
            </button>
            <span className="ml-auto self-center text-sm text-base-content/60">共 {totalCount} 筆</span>
          </div>

          {/* 表格 */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--inbox size-16 mb-4 mx-auto" />
              <p>尚無活動</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>建立時間</th>
                    <th>主旨</th>
                    <th>狀態</th>
                    <th>模式</th>
                    <th>排程</th>
                    <th>進度</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <div className="text-sm">
                          {new Date(c.createdTime).toLocaleString('zh-TW')}
                        </div>
                      </td>
                      <td>
                        <button
                          className="link link-hover font-medium max-w-xs line-clamp-1 text-left"
                          onClick={() => handleViewDetail(c.id)}
                          title={c.subject}
                        >
                          {c.subject}
                        </button>
                      </td>
                      <td>{renderStatus(c.status)}</td>
                      <td>
                        <span className="badge badge-ghost badge-sm">
                          {MODE_LABEL[c.sendMode] ?? c.sendMode}
                        </span>
                      </td>
                      <td>
                        <div className="text-xs text-base-content/70">
                          {c.scheduleAt
                            ? new Date(c.scheduleAt).toLocaleString('zh-TW')
                            : '-'}
                        </div>
                      </td>
                      <td>
                        <div className="text-xs font-mono">
                          <span className="text-success">{c.successCount}</span>
                          {' / '}
                          <span className="text-error">{c.failedCount}</span>
                          {' / '}
                          <span>{c.totalCount}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleViewDetail(c.id)}
                            title="詳情"
                          >
                            <span className="iconify lucide--eye size-4" />
                          </button>
                          {c.status === EmailCampaignStatus.Queued && (
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleCancel(c)}
                              title="取消"
                            >
                              <span className="iconify lucide--x-circle size-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <span className="iconify lucide--chevron-left size-4" />
                </button>
                <button className="join-item btn btn-sm no-animation">
                  第 {page} / {totalPages} 頁
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <span className="iconify lucide--chevron-right size-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/mail-center/compose')}
            >
              <span className="iconify lucide--plus size-4" />
              新增活動
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <dialog className={`modal ${isDetailOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setIsDetailOpen(false)}
          >
            <span className="iconify lucide--x size-5" />
          </button>
          <h3 className="font-bold text-lg mb-4">活動詳情</h3>

          {isLoadingDetail ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : detail ? (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-base-content/60">活動 ID</label>
                  <p className="font-mono text-xs break-all">{detail.id}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">狀態</label>
                  <p>{renderStatus(detail.status)}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">模式</label>
                  <p>{MODE_LABEL[detail.sendMode] ?? detail.sendMode}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">建立者</label>
                  <p className="font-mono text-xs">{detail.createdBy || '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">建立時間</label>
                  <p>{new Date(detail.createdTime).toLocaleString('zh-TW')}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">排程時間</label>
                  <p>{detail.scheduleAt ? new Date(detail.scheduleAt).toLocaleString('zh-TW') : '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">開始</label>
                  <p>{detail.startedTime ? new Date(detail.startedTime).toLocaleString('zh-TW') : '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">完成</label>
                  <p>{detail.completedTime ? new Date(detail.completedTime).toLocaleString('zh-TW') : '-'}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">總收件人</label>
                  <p className="font-mono">{detail.totalCount}</p>
                </div>
                <div>
                  <label className="text-xs text-base-content/60">成功 / 失敗</label>
                  <p className="font-mono">
                    <span className="text-success">{detail.successCount}</span>
                    {' / '}
                    <span className="text-error">{detail.failedCount}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-base-content/60">主旨</label>
                <p className="bg-base-200 p-2 rounded font-medium">{detail.subject}</p>
              </div>

              <div>
                <label className="text-xs text-base-content/60">內容</label>
                <div className="border rounded overflow-hidden mt-1">
                  <iframe
                    srcDoc={detail.body}
                    className="w-full h-60 bg-white"
                    title="Campaign Body"
                    sandbox=""
                  />
                </div>
              </div>

              {detail.errorMessage && (
                <div className="border border-error/30 rounded p-3 bg-error/5">
                  <label className="text-xs font-semibold text-error">處理錯誤</label>
                  <p className="font-mono text-xs mt-1 break-all">{detail.errorMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/50">無法載入詳情</div>
          )}

          <div className="modal-action">
            <button className="btn btn-sm" onClick={() => setIsDetailOpen(false)}>關閉</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsDetailOpen(false)}>close</button>
        </form>
      </dialog>

      {ConfirmComponent}
    </div>
  );
};
