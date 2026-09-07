import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { logsApi } from '@/lib/api/logs';
import { parseBounceCode } from '@/lib/bounce-codes';
import type { MailLog, MailLogDetail, MailLogSearchParams } from '@/types/logs';

type BounceFilter = 'all' | 'hard' | 'soft';

const BOUNCE_TABS: Array<{ value: BounceFilter; label: string; icon: string }> = [
  { value: 'all', label: '全部退信', icon: 'lucide--mail-x' },
  { value: 'hard', label: '硬退信', icon: 'lucide--ban' },
  { value: 'soft', label: '軟退信', icon: 'lucide--alert-triangle' },
];

const renderBounceTypeBadge = (bounceStatus: number) => {
  if (bounceStatus === 1) return <span className="badge badge-error badge-sm">硬退信</span>;
  if (bounceStatus === 2) return <span className="badge badge-warning badge-sm">軟退信</span>;
  return <span className="badge badge-ghost badge-sm">-</span>;
};

export const MailBouncesPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [activeTab, setActiveTab] = useState<BounceFilter>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selected, setSelected] = useState<MailLogDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, activeTab]);

  const buildParams = (): MailLogSearchParams => {
    const params: MailLogSearchParams = {
      search: search.trim() || undefined,
      dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
      dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
    };
    if (activeTab === 'hard') params.bounceStatus = 1;
    else if (activeTab === 'soft') params.bounceStatus = 2;
    else params.bouncedOnly = true;
    return params;
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const result = await logsApi.getMailLogs(currentPage, 20, buildParams());
      setLogs(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (error) {
      console.error('Failed to fetch bounce logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApply = () => {
    setCurrentPage(1);
    void fetchLogs();
  };

  const handleClear = () => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
    setTimeout(() => void fetchLogs(), 0);
  };

  const handleViewDetail = async (id: number) => {
    setIsLoadingDetail(true);
    setIsDetailOpen(true);
    try {
      const detail = await logsApi.getMailLogById(id);
      setSelected(detail);
    } catch (error) {
      console.error('Failed to fetch bounce detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelected(null);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="退信管理"
        items={[
          { label: '郵件中心' },
          { label: '退信管理', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-4">
          {/* Tab */}
          <div role="tablist" className="tabs tabs-boxed w-fit">
            {BOUNCE_TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                className={`tab ${activeTab === t.value ? 'tab-active' : ''}`}
                onClick={() => {
                  setActiveTab(t.value);
                  setCurrentPage(1);
                }}
              >
                <span className={`iconify ${t.icon} size-4 mr-1`} />
                {t.label}
              </button>
            ))}
            <span className="ml-3 self-center text-sm text-base-content/60">
              共 {totalCount} 筆
            </span>
          </div>

          {/* 篩選 */}
          <div className="grid gap-3 md:grid-cols-3">
            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">關鍵字（收件人 / 主旨）</span>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApply()}
                placeholder="搜尋..."
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">起始日期</span>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </label>
            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">結束日期</span>
              <input
                type="date"
                className="input input-bordered input-sm w-full"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </label>
          </div>

          <div className="flex gap-2 justify-end">
            <button className="btn btn-ghost btn-sm" onClick={handleClear}>
              清除篩選
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleApply}>
              <span className="iconify lucide--search size-4" />
              查詢
            </button>
          </div>

          {/* 表格 */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-base-content/60">
              <span className="iconify lucide--mail-check size-16 mb-4 mx-auto" />
              <p>沒有退信記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>退信時間</th>
                    <th>退信類型</th>
                    <th>收件者</th>
                    <th>主旨</th>
                    <th>退信代碼</th>
                    <th>退信原因</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const info = parseBounceCode(log.bounceCode);
                    return (
                      <tr key={log.id}>
                        <td>
                          <div className="text-sm text-base-content/70">
                            {log.bounceTime
                              ? new Date(log.bounceTime).toLocaleString('zh-TW')
                              : '-'}
                          </div>
                        </td>
                        <td>{renderBounceTypeBadge(log.bounceStatus)}</td>
                        <td>
                          <div className="text-sm max-w-[200px] truncate" title={log.receivers}>
                            {log.receivers || '-'}
                          </div>
                        </td>
                        <td>
                          <div className="font-semibold max-w-xs line-clamp-1" title={log.subject}>
                            {log.subject || '-'}
                          </div>
                        </td>
                        <td>
                          <span className="font-mono bg-base-200 px-2 py-0.5 rounded text-xs">
                            {log.bounceCode || '-'}
                          </span>
                        </td>
                        <td>
                          <div className="text-xs max-w-xs line-clamp-2" title={log.bounceReason || info.description}>
                            {info.description || log.bounceReason || '-'}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-xs"
                            onClick={() => handleViewDetail(log.id)}
                            title="查看詳情"
                          >
                            <span className="iconify lucide--eye size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <div className="join">
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <span className="iconify lucide--chevron-left size-4" />
                </button>
                <button className="join-item btn btn-sm no-animation">
                  第 {currentPage} / {totalPages} 頁
                </button>
                <button
                  className="join-item btn btn-sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <span className="iconify lucide--chevron-right size-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 詳情 Modal（聚焦退信） */}
      <dialog className={`modal ${isDetailOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={closeDetail}
          >
            <span className="iconify lucide--x size-5" />
          </button>

          <h3 className="font-bold text-lg mb-4">
            <span className="iconify lucide--mail-x size-5 inline-block mr-2" />
            退信詳情
          </h3>

          {isLoadingDetail ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : selected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-base-content/60">原發送時間</label>
                  <p className="text-sm">
                    {new Date(selected.time || selected.createdTime).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">退信時間</label>
                  <p className="text-sm">
                    {selected.bounceTime
                      ? new Date(selected.bounceTime).toLocaleString('zh-TW')
                      : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">退信類型</label>
                  <p>{renderBounceTypeBadge(selected.bounceStatus)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">退信代碼</label>
                  <p className="text-sm">
                    <span className="font-mono bg-base-200 px-2 py-0.5 rounded">{selected.bounceCode || '-'}</span>
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-base-content/60">收件者</label>
                  <p className="text-sm bg-base-200 p-2 rounded">{selected.receivers || '-'}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-base-content/60">主旨</label>
                  <p className="text-sm bg-base-200 p-2 rounded font-medium">{selected.subject || '-'}</p>
                </div>
                {selected.remoteMta && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-base-content/60">遠端 MTA</label>
                    <p className="text-sm font-mono">{selected.remoteMta}</p>
                  </div>
                )}
                {selected.messageId && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-base-content/60">Message-ID</label>
                    <p className="text-sm bg-base-200 p-2 rounded font-mono text-xs break-all">{selected.messageId}</p>
                  </div>
                )}
              </div>

              {(() => {
                const info = parseBounceCode(selected.bounceCode);
                if (!info.code && !selected.bounceReason) return null;
                return (
                  <div className="border border-error/30 rounded-lg p-4 bg-error/5">
                    {info.code && (
                      <div className="flex items-start gap-2 mb-3">
                        <span className="iconify lucide--info size-4 mt-0.5 text-info" />
                        <div>
                          <p className="text-sm font-medium">{info.description}</p>
                          <p className="text-sm text-base-content/70 mt-1">{info.suggestion}</p>
                        </div>
                      </div>
                    )}
                    {selected.bounceReason && (
                      <div>
                        <label className="text-sm font-medium text-base-content/60">伺服器回應</label>
                        <p className="text-sm bg-base-200 p-2 rounded mt-1 font-mono text-xs break-all">
                          {selected.bounceReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/50">無法載入退信詳情</div>
          )}

          <div className="modal-action">
            <button className="btn" onClick={closeDetail}>關閉</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeDetail}>close</button>
        </form>
      </dialog>
    </div>
  );
};
