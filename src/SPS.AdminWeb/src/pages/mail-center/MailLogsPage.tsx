import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { StatusBadge, BounceStatusBadge } from '@/components/common/StatusBadge';
import { logsApi } from '@/lib/api/logs';
import { parseBounceCode } from '@/lib/bounce-codes';
import type { MailLog, MailLogDetail, MailLogSearchParams } from '@/types/logs';

const MAIL_TYPE: Record<string, { label: string; color: string }> = {
  PasswordReset: { label: '密碼重置', color: 'warning' },
  Verification: { label: '驗證碼', color: 'info' },
  ApplicationSubmitted: { label: '申請提交', color: 'primary' },
  ApplicationApproved: { label: '申請通過', color: 'success' },
  ApplicationRejected: { label: '申請拒絕', color: 'error' },
  ApplicationDocumentRequired: { label: '補件通知', color: 'warning' },
  Notification: { label: '通知', color: 'ghost' },
};

const getMailTypeDisplay = (mailType?: string) => {
  if (!mailType) return { label: '一般', color: 'ghost' };
  return MAIL_TYPE[mailType] || { label: mailType, color: 'ghost' };
};

type SuccessFilter = '' | 'true' | 'false';

export const MailLogsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<MailLog[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState('');
  const [mailType, setMailType] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<SuccessFilter>('');
  const [bounceStatus, setBounceStatus] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selected, setSelected] = useState<MailLogDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const buildParams = (): MailLogSearchParams => ({
    search: search.trim() || undefined,
    mailType: mailType || undefined,
    isSuccess: isSuccess === '' ? undefined : isSuccess === 'true',
    bounceStatus: bounceStatus === '' ? undefined : Number(bounceStatus),
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const result = await logsApi.getMailLogs(currentPage, 20, buildParams());
      setLogs(result.items);
      setTotalPages(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch mail logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    void fetchLogs();
  };

  const handleClearFilters = () => {
    setSearch('');
    setMailType('');
    setIsSuccess('');
    setBounceStatus('');
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
      console.error('Failed to fetch mail detail:', error);
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
        title="寄信紀錄"
        items={[
          { label: '郵件中心' },
          { label: '寄信紀錄', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body space-y-4">
          {/* 篩選列 */}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">關鍵字（收件人 / 主旨）</span>
              <input
                type="text"
                className="input input-bordered input-sm w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                placeholder="搜尋..."
              />
            </label>

            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">郵件類型</span>
              <select
                className="select select-bordered select-sm w-full"
                value={mailType}
                onChange={(e) => setMailType(e.target.value)}
              >
                <option value="">全部</option>
                {Object.entries(MAIL_TYPE).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </label>

            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">發送狀態</span>
              <select
                className="select select-bordered select-sm w-full"
                value={isSuccess}
                onChange={(e) => setIsSuccess(e.target.value as SuccessFilter)}
              >
                <option value="">全部</option>
                <option value="true">成功</option>
                <option value="false">失敗</option>
              </select>
            </label>

            <label className="form-control">
              <span className="label-text text-xs text-base-content/60 mb-1">退信狀態</span>
              <select
                className="select select-bordered select-sm w-full"
                value={bounceStatus}
                onChange={(e) => setBounceStatus(e.target.value)}
              >
                <option value="">全部</option>
                <option value="0">無退信</option>
                <option value="1">硬退信</option>
                <option value="2">軟退信</option>
              </select>
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
            <button className="btn btn-ghost btn-sm" onClick={handleClearFilters}>
              清除篩選
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleApplyFilters}>
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
              <span className="iconify lucide--mail size-16 mb-4 mx-auto" />
              <p>查無郵件記錄</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>發送時間</th>
                    <th>類型</th>
                    <th>收件者</th>
                    <th>主旨</th>
                    <th>發送狀態</th>
                    <th>退信狀態</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="text-sm text-base-content/70">
                          {new Date(log.time || log.createdTime).toLocaleString('zh-TW')}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getMailTypeDisplay(log.mailType).color} badge-sm`}>
                          {getMailTypeDisplay(log.mailType).label}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm max-w-[200px] truncate" title={log.receivers}>
                          {log.receivers || '-'}
                        </div>
                        {log.receiverCount > 1 && (
                          <div className="text-xs text-base-content/50">共 {log.receiverCount} 位</div>
                        )}
                      </td>
                      <td>
                        <div className="font-semibold max-w-xs line-clamp-1" title={log.subject}>
                          {log.subject || '-'}
                        </div>
                      </td>
                      <td>
                        <StatusBadge isSuccess={log.isSuccess} errorMessage={log.errorMessage} />
                      </td>
                      <td>
                        <BounceStatusBadge bounceStatus={log.bounceStatus} bounceCode={log.bounceCode} />
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 分頁 */}
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

      {/* 詳情 Modal */}
      <dialog className={`modal ${isDetailOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={closeDetail}
          >
            <span className="iconify lucide--x size-5" />
          </button>

          <h3 className="font-bold text-lg mb-4">
            <span className="iconify lucide--mail size-5 inline-block mr-2" />
            郵件詳情
          </h3>

          {isLoadingDetail ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : selected ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-base-content/60">發送時間</label>
                  <p className="text-sm">
                    {new Date(selected.time || selected.createdTime).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">發送狀態</label>
                  <p>
                    {selected.isSuccess ? (
                      <span className="badge badge-success badge-sm">發送成功</span>
                    ) : (
                      <span className="badge badge-error badge-sm">發送失敗</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">郵件類型</label>
                  <p>
                    <span className={`badge badge-${getMailTypeDisplay(selected.mailType).color} badge-sm`}>
                      {getMailTypeDisplay(selected.mailType).label}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">收件者數量</label>
                  <p className="text-sm">{selected.receiverCount} 位</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-base-content/60">收件者</label>
                <p className="text-sm bg-base-200 p-2 rounded">{selected.receivers || '-'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-base-content/60">主旨</label>
                <p className="text-sm bg-base-200 p-2 rounded font-medium">{selected.subject || '-'}</p>
              </div>

              {selected.messageId && (
                <div>
                  <label className="text-sm font-medium text-base-content/60">Message-ID</label>
                  <p className="text-sm bg-base-200 p-2 rounded font-mono text-xs break-all">{selected.messageId}</p>
                </div>
              )}

              {selected.errorMessage && (() => {
                const errorInfo = parseBounceCode(selected.errorMessage);
                return (
                  <div className="border border-error/30 rounded-lg p-4 bg-error/5">
                    <h4 className="font-semibold text-error mb-3 flex items-center gap-2">
                      <span className="iconify lucide--alert-circle size-5" />
                      發送失敗
                    </h4>
                    <div>
                      <label className="text-sm font-medium text-base-content/60">伺服器回應</label>
                      <p className="text-sm bg-base-200 p-2 rounded mt-1 font-mono text-xs break-all">
                        {selected.errorMessage}
                      </p>
                    </div>
                    {errorInfo.code && (
                      <div className="mt-3 p-3 bg-base-100 rounded border">
                        <div className="flex items-start gap-2">
                          <span className="iconify lucide--info size-4 mt-0.5 text-info" />
                          <div>
                            <p className="text-sm">
                              <span className="font-mono bg-base-200 px-1.5 py-0.5 rounded text-xs mr-2">{errorInfo.code}</span>
                              <span className="font-medium">{errorInfo.description}</span>
                            </p>
                            <p className="text-sm text-base-content/70 mt-1">{errorInfo.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {selected.bounceStatus > 0 && (() => {
                const bounceInfo = parseBounceCode(selected.bounceCode);
                return (
                  <div className="border border-error/30 rounded-lg p-4 bg-error/5">
                    <h4 className="font-semibold text-error mb-3 flex items-center gap-2">
                      <span className="iconify lucide--mail-x size-5" />
                      退信資訊
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-base-content/60">退信類型</label>
                        <p>
                          {selected.bounceStatus === 1 ? (
                            <span className="badge badge-error badge-sm">硬退信 (Hard Bounce)</span>
                          ) : (
                            <span className="badge badge-warning badge-sm">軟退信 (Soft Bounce)</span>
                          )}
                        </p>
                      </div>
                      {selected.bounceTime && (
                        <div>
                          <label className="text-sm font-medium text-base-content/60">退信時間</label>
                          <p className="text-sm">{new Date(selected.bounceTime).toLocaleString('zh-TW')}</p>
                        </div>
                      )}
                      {selected.bounceCode && (
                        <div>
                          <label className="text-sm font-medium text-base-content/60">退信代碼</label>
                          <p className="text-sm">
                            <span className="font-mono bg-base-200 px-2 py-0.5 rounded">{selected.bounceCode}</span>
                          </p>
                        </div>
                      )}
                      {selected.remoteMta && (
                        <div>
                          <label className="text-sm font-medium text-base-content/60">遠端 MTA</label>
                          <p className="text-sm font-mono">{selected.remoteMta}</p>
                        </div>
                      )}
                    </div>

                    {bounceInfo.code && (
                      <div className="mt-3 p-3 bg-base-100 rounded border">
                        <div className="flex items-start gap-2">
                          <span className="iconify lucide--info size-4 mt-0.5 text-info" />
                          <div>
                            <p className="text-sm font-medium">{bounceInfo.description}</p>
                            <p className="text-sm text-base-content/70 mt-1">{bounceInfo.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {selected.bounceReason && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-base-content/60">伺服器回應</label>
                        <p className="text-sm bg-base-200 p-2 rounded mt-1 font-mono text-xs break-all">
                          {selected.bounceReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="text-sm font-medium text-base-content/60">郵件內容</label>
                <div className="border rounded-lg overflow-hidden mt-1">
                  {selected.content ? (
                    <iframe
                      srcDoc={selected.content}
                      className="w-full h-80 bg-white"
                      title="Email Content"
                      sandbox=""
                    />
                  ) : (
                    <div className="p-4 text-center text-base-content/50">無內容</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/50">無法載入郵件詳情</div>
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
