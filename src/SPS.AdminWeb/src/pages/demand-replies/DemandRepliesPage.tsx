import { useCallback, useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { demandRepliesApi } from '@/lib/api/demand-replies';
import { DemandReplyStatusLabels } from '@/types/demand-reply';
import type { DemandReply, DemandReplyCounts, DemandReplyStatus } from '@/types/demand-reply';
import { useNotify } from '@/hooks/useNotify';

const STATUS_BADGE: Record<DemandReplyStatus, string> = {
  Pending: 'badge-warning',
  Approved: 'badge-success',
  Rejected: 'badge-ghost',
};

const getServerError = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error;

/**
 * 需求回應審核：供應業者在媒合對接的需求頁送出的回應先到這裡待審，承辦人員確認內容後按「通過」，
 * 系統才會寄信給這筆需求的刊登者與當下所有追蹤者；「退回」要填原因，會寄信通知供應業者。
 * 需要「客服服務」權限。有新回應時，也會依「詢問單 → 通知設定」寄信提醒承辦人員。
 */
export const DemandRepliesPage = () => {
  const notify = useNotify();
  const [items, setItems] = useState<DemandReply[]>([]);
  const [counts, setCounts] = useState<DemandReplyCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState<DemandReplyStatus | undefined>('Pending');
  const [selected, setSelected] = useState<DemandReply | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const pageSize = 20;

  const load = useCallback(
    async (page: number, filter?: DemandReplyStatus) => {
      setIsLoading(true);
      try {
        const [response, summary] = await Promise.all([demandRepliesApi.getReplies(page, pageSize, filter), demandRepliesApi.getCounts()]);
        setItems(response.items);
        setTotalPages(response.totalPages);
        setCurrentPage(page);
        setCounts(summary);
      } catch {
        await notify.error('載入需求回應失敗');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    void load(1, status);
  }, [status, load]);

  const open = (item: DemandReply) => {
    setSelected(item);
    setRejectReason('');
    setIsRejecting(false);
  };

  const approve = async () => {
    if (!selected || isBusy) return;
    setIsBusy(true);
    try {
      await demandRepliesApi.approve(selected.id);
      setSelected(null);
      await notify.success('已通過，系統會寄信給刊登者與追蹤者');
      await load(currentPage, status);
    } catch (error) {
      await notify.error(getServerError(error) || '操作失敗');
    } finally {
      setIsBusy(false);
    }
  };

  const reject = async () => {
    if (!selected || isBusy) return;
    if (!rejectReason.trim()) {
      await notify.error('請填寫退回原因');
      return;
    }
    setIsBusy(true);
    try {
      await demandRepliesApi.reject(selected.id, rejectReason.trim());
      setSelected(null);
      await notify.success('已退回，系統會寄信通知供應業者');
      await load(currentPage, status);
    } catch (error) {
      await notify.error(getServerError(error) || '操作失敗');
    } finally {
      setIsBusy(false);
    }
  };

  const columns: Column<DemandReply>[] = [
    {
      key: 'demand',
      title: '需求',
      render: (item) => (
        <div className="text-sm max-w-xs">
          <div className="font-semibold line-clamp-2">{item.demandName}</div>
          <div className="text-base-content/60">{item.demandNumber}</div>
        </div>
      ),
    },
    {
      key: 'contact',
      title: '回應者',
      render: (item) => (
        <div className="text-sm">
          <div className="font-semibold">{[item.companyName, item.contactName].filter(Boolean).join('　') || '-'}</div>
          <div className="text-base-content/60">{[item.contactEmail, item.contactPhone].filter(Boolean).join(' / ')}</div>
        </div>
      ),
    },
    {
      key: 'content',
      title: '回應內容',
      render: (item) => <span className="text-sm line-clamp-2 max-w-xs">{item.content}</span>,
    },
    {
      key: 'status',
      title: '狀態',
      render: (item) => <span className={`badge ${STATUS_BADGE[item.status]}`}>{DemandReplyStatusLabels[item.status]}</span>,
    },
    { key: 'createdTime', title: '送出時間', className: 'text-sm text-base-content/70', render: (item) => formatDate(item.createdTime) },
  ];

  const detailRow = (label: string, value?: string | null) =>
    value ? (
      <div className="grid grid-cols-[6rem_1fr] gap-2 text-sm">
        <span className="text-base-content/60">{label}</span>
        <span className="break-all whitespace-pre-wrap">{value}</span>
      </div>
    ) : null;

  const tabs: { value: DemandReplyStatus | undefined; label: string; count?: number }[] = [
    { value: 'Pending', label: '待審核', count: counts?.pending },
    { value: 'Approved', label: '已通過', count: counts?.approved },
    { value: 'Rejected', label: '已退回', count: counts?.rejected },
    { value: undefined, label: '全部' },
  ];

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle title="需求回應" items={[{ label: '需求回應', active: true }]} />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div role="tablist" className="tabs tabs-bordered mb-2">
            {tabs.map((tab) => (
              <button key={tab.label} type="button" role="tab" className={`tab ${status === tab.value ? 'tab-active font-semibold' : ''}`} onClick={() => setStatus(tab.value)}>
                {tab.label}
                {tab.count !== undefined && <span className="badge badge-sm ml-2">{tab.count}</span>}
              </button>
            ))}
          </div>

          <DataTable
            data={items}
            columns={columns}
            keyField="id"
            isLoading={isLoading}
            emptyIcon="lucide--message-square"
            emptyMessage="目前沒有符合的回應"
            primaryActions={[{ label: '審核', icon: 'lucide--eye', onClick: open }]}
          />

          {!isLoading && items.length > 0 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => void load(page, status)} isLoading={isLoading} />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-xl space-y-4">
            <h3 className="text-lg font-bold">
              需求回應
              <span className={`badge ml-2 ${STATUS_BADGE[selected.status]}`}>{DemandReplyStatusLabels[selected.status]}</span>
            </h3>

            <div className="space-y-2">
              {detailRow('需求', `${selected.demandNumber} ${selected.demandName}`)}
              {detailRow('公司', selected.companyName)}
              {detailRow('聯絡人', selected.contactName)}
              {detailRow('信箱', selected.contactEmail)}
              {detailRow('電話', selected.contactPhone)}
              {detailRow('送出時間', formatDate(selected.createdTime))}
              {detailRow('回應內容', selected.content)}
              {selected.status === 'Rejected' && detailRow('退回原因', selected.rejectReason)}
              {selected.status === 'Approved' && detailRow('已寄出', selected.sentCount != null ? `${selected.sentCount} 位收件人` : '寄信處理中或郵件服務未啟用')}
            </div>

            {selected.status === 'Pending' && (
              <>
                <div className="alert alert-info text-sm">
                  <span className="iconify lucide--info size-4" />
                  通過後會寄給這筆需求的刊登者與目前 {selected.followerCount} 位追蹤者，內容含回應者的公司與聯絡資訊。
                </div>

                {isRejecting && (
                  <div className="form-control">
                    <label className="label" htmlFor="reject-reason">
                      <span className="label-text font-medium">退回原因（會寄給供應業者）</span>
                    </label>
                    <textarea id="reject-reason" className="textarea textarea-bordered" rows={3} maxLength={500} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
                  </div>
                )}
              </>
            )}

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                關閉
              </button>
              {selected.status === 'Pending' &&
                (isRejecting ? (
                  <button type="button" className="btn btn-error" disabled={isBusy} onClick={() => void reject()}>
                    {isBusy ? <span className="loading loading-spinner loading-sm" /> : '確認退回'}
                  </button>
                ) : (
                  <>
                    <button type="button" className="btn btn-outline btn-error" disabled={isBusy} onClick={() => setIsRejecting(true)}>
                      退回
                    </button>
                    <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => void approve()}>
                      {isBusy ? <span className="loading loading-spinner loading-sm" /> : '通過並寄出'}
                    </button>
                  </>
                ))}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelected(null)} />
        </dialog>
      )}
    </div>
  );
};
