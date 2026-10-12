import { useCallback, useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { Pagination } from '@/components/common/Pagination';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { chatReportsApi } from '@/lib/api/chat-reports';
import { ChatReportReasonLabels } from '@/types/chat-report';
import type { ChatReport, ChatReportDetail } from '@/types/chat-report';
import { useNotify } from '@/hooks/useNotify';

const getServerError = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error;

type Filter = 'new' | 'reviewed' | 'all';
const FILTER_VALUE: Record<Filter, boolean | undefined> = { new: false, reviewed: true, all: undefined };

/**
 * 會員檢舉：會員檢舉「會員之間的對話」後出現在這裡。承辦人員平常看不到會員之間的對話內容，
 * 只有被檢舉的對話才能由檢舉單打開審閱；處理後標為已處理，可選擇同時關閉該對話（雙方都不能再傳訊息），檢舉人會在收件匣收到「檢舉已處理」。
 * 需要「客服服務」權限。
 */
export const ChatReportsPage = () => {
  const notify = useNotify();
  const [items, setItems] = useState<ChatReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<Filter>('new');
  const [selected, setSelected] = useState<ChatReportDetail | null>(null);
  const [note, setNote] = useState('');
  const [closeChat, setCloseChat] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const pageSize = 20;

  const load = useCallback(
    async (page: number, value: Filter) => {
      setIsLoading(true);
      try {
        const response = await chatReportsApi.getReports(page, pageSize, FILTER_VALUE[value]);
        setItems(response.items);
        setTotalPages(response.totalPages);
        setCurrentPage(page);
      } catch {
        await notify.error('載入檢舉失敗');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    void load(1, filter);
  }, [filter, load]);

  const open = async (item: ChatReport) => {
    try {
      const detail = await chatReportsApi.getReport(item.id);
      setSelected(detail);
      setNote(detail.handlerNote ?? '');
      setCloseChat(false);
    } catch (error) {
      await notify.error(getServerError(error) || '載入檢舉詳情失敗');
    }
  };

  const submit = async (reviewed: boolean) => {
    if (!selected || isBusy) return;
    setIsBusy(true);
    try {
      const updated = await chatReportsApi.update(selected.id, { reviewed, handlerNote: note.trim() || undefined, closeChat });
      setSelected(updated);
      await notify.success(reviewed ? '已標為已處理' : '已改回未處理');
      await load(currentPage, filter);
    } catch (error) {
      await notify.error(getServerError(error) || '操作失敗');
    } finally {
      setIsBusy(false);
    }
  };

  const person = (name?: string | null, company?: string | null) => [company, name].filter(Boolean).join('　') || '-';

  const columns: Column<ChatReport>[] = [
    { key: 'reason', title: '原因', render: (item) => <span className="badge badge-outline whitespace-nowrap">{ChatReportReasonLabels[item.reason] ?? item.reason}</span> },
    {
      key: 'people',
      title: '檢舉人 → 被檢舉人',
      render: (item) => (
        <div className="text-sm">
          <div>{person(item.reporterName, item.reporterCompany)}</div>
          <div className="text-base-content/60">→ {person(item.reportedName, item.reportedCompany)}</div>
        </div>
      ),
    },
    { key: 'demand', title: '需求', render: (item) => <span className="text-sm line-clamp-2 max-w-xs">{item.demandName || '-'}</span> },
    {
      key: 'status',
      title: '狀態',
      render: (item) => (
        <div className="flex flex-col gap-1">
          <span className={`badge ${item.status === 'New' ? 'badge-warning' : 'badge-success'}`}>{item.status === 'New' ? '未處理' : '已處理'}</span>
          {item.chatClosed && <span className="badge badge-ghost badge-sm">對話已關閉</span>}
        </div>
      ),
    },
    { key: 'createdTime', title: '檢舉時間', className: 'text-sm text-base-content/70', render: (item) => formatDate(item.createdTime) },
  ];

  const tabs: { value: Filter; label: string }[] = [
    { value: 'new', label: '未處理' },
    { value: 'reviewed', label: '已處理' },
    { value: 'all', label: '全部' },
  ];

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle title="會員檢舉" items={[{ label: '會員檢舉', active: true }]} />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div role="tablist" className="tabs tabs-bordered mb-2">
            {tabs.map((tab) => (
              <button key={tab.value} type="button" role="tab" className={`tab ${filter === tab.value ? 'tab-active font-semibold' : ''}`} onClick={() => setFilter(tab.value)}>
                {tab.label}
              </button>
            ))}
          </div>

          <DataTable
            data={items}
            columns={columns}
            keyField="id"
            isLoading={isLoading}
            emptyIcon="lucide--shield-alert"
            emptyMessage="目前沒有檢舉"
            primaryActions={[{ label: '審閱', icon: 'lucide--eye', onClick: (item) => void open(item) }]}
          />

          {!isLoading && items.length > 0 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => void load(page, filter)} isLoading={isLoading} />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-2xl space-y-4">
            <h3 className="text-lg font-bold">
              檢舉：{ChatReportReasonLabels[selected.reason] ?? selected.reason}
              <span className={`badge ml-2 ${selected.status === 'New' ? 'badge-warning' : 'badge-success'}`}>{selected.status === 'New' ? '未處理' : '已處理'}</span>
              {selected.chatClosed && <span className="badge badge-ghost ml-2">對話已關閉</span>}
            </h3>

            <div className="grid grid-cols-[6rem_1fr] gap-x-2 gap-y-1 text-sm">
              <span className="text-base-content/60">檢舉人</span>
              <span>{person(selected.reporterName, selected.reporterCompany)}</span>
              <span className="text-base-content/60">被檢舉人</span>
              <span>{person(selected.reportedName, selected.reportedCompany)}</span>
              <span className="text-base-content/60">需求</span>
              <span>{selected.demandName || '-'}</span>
              <span className="text-base-content/60">檢舉時間</span>
              <span>{formatDate(selected.createdTime)}</span>
              {selected.detail && (
                <>
                  <span className="text-base-content/60">檢舉說明</span>
                  <span className="whitespace-pre-wrap break-all">{selected.detail}</span>
                </>
              )}
            </div>

            <div>
              <div className="text-sm font-medium mb-1">對話內容（只有被檢舉的對話才開放審閱，請勿外流）</div>
              <div className="border rounded-lg p-3 max-h-80 overflow-y-auto space-y-2 bg-base-200/40">
                {selected.messages.length === 0 && <p className="text-sm text-base-content/60">這個對話沒有訊息。</p>}
                {selected.messages.map((message) => {
                  const fromReported = message.senderMemberName && message.senderMemberName === selected.reportedName;
                  return (
                    <div key={message.id} className="text-sm">
                      <div className="text-xs text-base-content/60">
                        <span className={fromReported ? 'text-error font-medium' : ''}>{message.senderMemberName || '會員'}</span>　{formatDate(message.createdTime)}
                      </div>
                      <div className="whitespace-pre-wrap break-all">{message.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-control">
              <label className="label" htmlFor="report-note">
                <span className="label-text font-medium">處理備註（只有後台看得到）</span>
              </label>
              <textarea id="report-note" className="textarea textarea-bordered" rows={2} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            {!selected.chatClosed && (
              <label className="label cursor-pointer justify-start gap-2">
                <input type="checkbox" className="checkbox checkbox-sm" checked={closeChat} onChange={(e) => setCloseChat(e.target.checked)} />
                <span className="label-text text-sm">同時關閉這個對話（雙方都不能再傳訊息）</span>
              </label>
            )}

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                關閉
              </button>
              {selected.status === 'Reviewed' && (
                <button type="button" className="btn btn-outline" disabled={isBusy} onClick={() => void submit(false)}>
                  改回未處理
                </button>
              )}
              <button type="button" className="btn btn-primary" disabled={isBusy} onClick={() => void submit(true)}>
                {isBusy ? <span className="loading loading-spinner loading-sm" /> : selected.status === 'Reviewed' ? '更新處理結果' : '標為已處理'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelected(null)} />
        </dialog>
      )}
    </div>
  );
};
