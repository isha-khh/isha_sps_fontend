import { useCallback, useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { Pagination } from '@/components/common/Pagination';
import { ListToolbar } from '@/components/common/ListToolbar';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { inquiriesApi } from '@/lib/api/inquiries';
import { InquiryStatus, InquiryStatusLabels, InquiryTypeLabels } from '@/types/inquiry';
import type { Inquiry, InquiryCounts, InquirySearchParams } from '@/types/inquiry';
import { useNotify } from '@/hooks/useNotify';
import { useConfirm } from '@/hooks/useConfirm';

const STATUS_BADGE: Record<number, string> = {
  [InquiryStatus.New]: 'badge-warning',
  [InquiryStatus.InProgress]: 'badge-info',
  [InquiryStatus.Closed]: 'badge-ghost',
};

/**
 * 詢問單收件匣：前台各個「留下資料等人回覆」的表單（我要提案、訂閱解方、服務專區下載申請、索取補助資料、訂閱電子報）
 * 送出後都存在這裡，承辦人員在這裡檢視內容、標記處理進度（新進／處理中／已結案）並留處理備註。
 * 需要「客服服務」權限。要回覆請依單上留的信箱或電話自行聯繫（系統不會代寄）。
 */
export const InquiriesPage = () => {
  const notify = useNotify();
  const { confirmDialog, ConfirmComponent } = useConfirm();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState<InquiryCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [params, setParams] = useState<InquirySearchParams>({});
  const [searchInput, setSearchInput] = useState('');
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [status, setStatus] = useState<number>(InquiryStatus.New);
  const [note, setNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pageSize = 20;

  const load = useCallback(
    async (page: number, query: InquirySearchParams) => {
      setIsLoading(true);
      try {
        const [response, summary] = await Promise.all([inquiriesApi.getInquiries(page, pageSize, query), inquiriesApi.getCounts()]);
        setItems(response.items);
        setTotalPages(response.totalPages);
        setCurrentPage(page);
        setCounts(summary);
      } catch {
        await notify.error('載入詢問單失敗');
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    void load(1, params);
  }, [params, load]);

  const open = (item: Inquiry) => {
    setSelected(item);
    setStatus(item.status);
    setNote(item.handlerNote ?? '');
  };

  const save = async () => {
    if (!selected) return;
    setIsSaving(true);
    try {
      await inquiriesApi.update(selected.id, { status: status as 0 | 1 | 2, handlerNote: note });
      setSelected(null);
      await notify.success('已儲存');
      await load(currentPage, params);
    } catch {
      await notify.error('儲存失敗');
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (item: Inquiry) => {
    const ok = await confirmDialog({ message: `確定要刪除這筆「${item.typeName}」嗎？刪除後無法復原。`, buttonConfirm: '刪除', confirmStyle: 'btn-error' });
    if (!ok) return;
    try {
      await inquiriesApi.remove(item.id);
      setSelected(null);
      await load(currentPage, params);
    } catch {
      await notify.error('刪除失敗');
    }
  };

  const columns: Column<Inquiry>[] = [
    {
      key: 'type',
      title: '種類',
      render: (item) => <span className="badge badge-outline whitespace-nowrap">{item.typeName}</span>,
    },
    {
      key: 'contact',
      title: '聯絡資料',
      render: (item) => (
        <div className="text-sm">
          <div className="font-semibold">{[item.name, item.companyName].filter(Boolean).join('　') || '-'}</div>
          <div className="text-base-content/60">{[item.email, item.phone].filter(Boolean).join(' / ') || '-'}</div>
        </div>
      ),
    },
    {
      key: 'target',
      title: '針對',
      render: (item) => <span className="text-sm line-clamp-2 max-w-xs">{item.targetTitle || (item.industry ? `產業代碼 ${item.industry}` : '-')}</span>,
    },
    {
      key: 'status',
      title: '狀態',
      render: (item) => <span className={`badge ${STATUS_BADGE[item.status]}`}>{InquiryStatusLabels[item.status]}</span>,
    },
    { key: 'createdTime', title: '送出時間', className: 'text-sm text-base-content/70', render: (item) => formatDate(item.createdTime) },
  ];

  const hasFilters = params.type !== undefined || params.status !== undefined || !!params.search;

  const detailRow = (label: string, value?: string | null) =>
    value ? (
      <div className="grid grid-cols-[6rem_1fr] gap-2 text-sm">
        <span className="text-base-content/60">{label}</span>
        <span className="break-all whitespace-pre-wrap">{value}</span>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle title="詢問單" items={[{ label: '詢問單', active: true }]} />

      {counts && (
        <div className="stats shadow bg-base-100">
          <div className="stat">
            <div className="stat-title">新進</div>
            <div className="stat-value text-warning">{counts.new}</div>
          </div>
          <div className="stat">
            <div className="stat-title">處理中</div>
            <div className="stat-value text-info">{counts.inProgress}</div>
          </div>
          <div className="stat">
            <div className="stat-title">已結案</div>
            <div className="stat-value">{counts.closed}</div>
          </div>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <ListToolbar
            searchPlaceholder="搜尋姓名、信箱、電話、公司、針對項目..."
            searchValue={searchInput}
            onSearchChange={setSearchInput}
            onSearch={() => setParams((prev) => ({ ...prev, search: searchInput.trim() || undefined }))}
            isLoading={isLoading}
            showClearFilter={hasFilters}
            onClearFilter={() => {
              setParams({});
              setSearchInput('');
            }}
            filters={
              <div className="flex gap-2">
                <select
                  className="select select-bordered select-sm"
                  value={params.type ?? ''}
                  onChange={(e) => setParams((prev) => ({ ...prev, type: e.target.value === '' ? undefined : (Number(e.target.value) as 1) }))}
                >
                  <option value="">全部種類</option>
                  {Object.entries(InquiryTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  className="select select-bordered select-sm"
                  value={params.status ?? ''}
                  onChange={(e) => setParams((prev) => ({ ...prev, status: e.target.value === '' ? undefined : (Number(e.target.value) as 0) }))}
                >
                  <option value="">全部狀態</option>
                  {Object.entries(InquiryStatusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            }
          />

          <DataTable
            data={items}
            columns={columns}
            keyField="id"
            isLoading={isLoading}
            emptyIcon="lucide--inbox"
            emptyMessage="目前沒有詢問單"
            confirmDialog={confirmDialog}
            primaryActions={[{ label: '查看', icon: 'lucide--eye', onClick: open }]}
            dropdownActions={[{ label: '刪除', icon: 'lucide--trash-2', onClick: (item) => void remove(item), className: 'text-error' }]}
          />

          {!isLoading && items.length > 0 && (
            <div className="mt-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => void load(page, params)} isLoading={isLoading} />
            </div>
          )}
        </div>
      </div>

      {selected && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-xl space-y-4">
            <h3 className="text-lg font-bold">
              {selected.typeName}
              <span className="text-sm font-normal text-base-content/60 ml-2">{formatDate(selected.createdTime)}</span>
            </h3>

            <div className="space-y-2">
              {detailRow('針對', selected.targetTitle)}
              {detailRow('姓名', selected.name)}
              {detailRow('公司', selected.companyName)}
              {detailRow('單位', selected.unit)}
              {detailRow('職稱', selected.jobTitle)}
              {detailRow('信箱', selected.email)}
              {detailRow('電話', selected.phone)}
              {detailRow('產業代碼', selected.industry)}
              {detailRow('補充說明', selected.message)}
              {detailRow('會員', selected.memberId ? '登入會員送出' : '訪客送出')}
            </div>

            <div className="divider my-1" />

            <div className="form-control">
              <label className="label" htmlFor="inquiry-status">
                <span className="label-text font-medium">處理狀態</span>
              </label>
              <select id="inquiry-status" className="select select-bordered" value={status} onChange={(e) => setStatus(Number(e.target.value))}>
                {Object.entries(InquiryStatusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-control">
              <label className="label" htmlFor="inquiry-note">
                <span className="label-text font-medium">處理備註</span>
              </label>
              <textarea id="inquiry-note" className="textarea textarea-bordered" rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(null)}>
                取消
              </button>
              <button type="button" className="btn btn-primary" disabled={isSaving} onClick={() => void save()}>
                {isSaving ? <span className="loading loading-spinner loading-sm" /> : '儲存'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelected(null)} />
        </dialog>
      )}
      {ConfirmComponent}
    </div>
  );
};
