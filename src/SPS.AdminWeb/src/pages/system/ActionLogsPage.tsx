import { useState, useEffect } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { TabSelector } from '@/components/common/TabSelector';
import { StatusBadge, BounceStatusBadge } from '@/components/common/StatusBadge';
import { logsApi } from '@/lib/api/logs';
import { parseBounceCode } from '@/lib/bounce-codes';
import type { ActionLog, ApplicationLog, MailLog, MailLogDetail } from '@/types/logs';

type LogTab = 'action' | 'application' | 'mail';
type ExportFormat = 'json' | 'csv' | 'excel';

const LOG_TABS = [
  { value: 'action' as const, label: '操作日誌', icon: 'lucide--activity' },
  { value: 'application' as const, label: '申請日誌', icon: 'lucide--file-text' },
  { value: 'mail' as const, label: '郵件日誌', icon: 'lucide--mail' },
];

// 申請狀態對照表
const APPLICATION_STATUS: Record<number, { label: string; color: string }> = {
  0: { label: '草稿', color: 'ghost' },
  1: { label: '待審核', color: 'warning' },
  2: { label: '審核中', color: 'info' },
  3: { label: '已通過', color: 'success' },
  4: { label: '已拒絕', color: 'error' },
  5: { label: '需補件', color: 'warning' },
  6: { label: '已取消', color: 'ghost' },
};

// 郵件類型對照表
const MAIL_TYPE: Record<string, { label: string; color: string }> = {
  PasswordReset: { label: '密碼重置', color: 'warning' },
  Verification: { label: '驗證碼', color: 'info' },
  ApplicationSubmitted: { label: '申請提交', color: 'primary' },
  ApplicationApproved: { label: '申請通過', color: 'success' },
  ApplicationRejected: { label: '申請拒絕', color: 'error' },
  ApplicationDocumentRequired: { label: '補件通知', color: 'warning' },
  Notification: { label: '通知', color: 'ghost' },
};

export const ActionLogsPage = () => {
  const [activeTab, setActiveTab] = useState<LogTab>('action');
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Action logs state
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [selectedActionType, setSelectedActionType] = useState<string>('');

  // Application logs state
  const [applicationLogs, setApplicationLogs] = useState<ApplicationLog[]>([]);

  // Mail logs state
  const [mailLogs, setMailLogs] = useState<MailLog[]>([]);
  const [selectedMailLog, setSelectedMailLog] = useState<MailLogDetail | null>(null);
  const [isMailDetailOpen, setIsMailDetailOpen] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Export state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState('');
  const [exportEndDate, setExportEndDate] = useState('');
  const [exportLimit, setExportLimit] = useState(1000);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    void fetchLogs();
  }, [activeTab, currentPage, selectedActionType]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'action') {
        const result = await logsApi.getActionLogs(currentPage, 20, {
          search: searchTerm || undefined,
          actionType: selectedActionType || undefined,
        });
        setActionLogs(result.items);
        setTotalPages(result.totalPages);
      } else if (activeTab === 'application') {
        const result = await logsApi.getApplicationLogs(currentPage, 20, {
          search: searchTerm || undefined,
        });
        setApplicationLogs(result.items);
        setTotalPages(result.totalPages);
      } else if (activeTab === 'mail') {
        const result = await logsApi.getMailLogs(currentPage, 20, {
          search: searchTerm || undefined,
        });
        setMailLogs(result.items);
        setTotalPages(result.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    void fetchLogs();
  };

  const handleViewMailDetail = async (mailId: number) => {
    setIsLoadingDetail(true);
    setIsMailDetailOpen(true);
    try {
      const detail = await logsApi.getMailLogById(mailId);
      setSelectedMailLog(detail);
    } catch (error) {
      console.error('Failed to fetch mail detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await logsApi.exportActionLogs({
        startDate: exportStartDate || undefined,
        endDate: exportEndDate || undefined,
        limit: exportLimit,
        format: exportFormat,
        actionType: selectedActionType || undefined,
      });
      setIsExportOpen(false);
    } catch (error) {
      console.error('Failed to export logs:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const actionTypes = [
    { value: '', label: '全部動作' },
    { value: 'Create', label: '新增', color: 'success' },
    { value: 'Update', label: '更新', color: 'info' },
    { value: 'Delete', label: '刪除', color: 'error' },
    { value: 'Login', label: '登入', color: 'primary' },
    { value: 'Logout', label: '登出', color: 'ghost' },
    { value: 'PasswordReset', label: '密碼重設', color: 'ghost' }
  ];

  const getActionBadgeColor = (action: string) => {
    const actionType = actionTypes.find((t) => t.value.toLowerCase() === action?.toLowerCase());
    return actionType?.color || 'neutral';
  };

  const getStatusDisplay = (status: number) => {
    const statusInfo = APPLICATION_STATUS[status];
    return statusInfo || { label: `狀態 ${status}`, color: 'ghost' };
  };

  const getMailTypeDisplay = (mailType?: string) => {
    if (!mailType) return { label: '一般', color: 'ghost' };
    return MAIL_TYPE[mailType] || { label: mailType, color: 'ghost' };
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="系統日誌"
        items={[
          { label: '系統管理', path: '/system' },
          { label: '系統日誌', active: true },
        ]}
      />

      <TabSelector
        tabs={LOG_TABS}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setCurrentPage(1);
          setSearchTerm('');
        }}
      />

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          {/* 搜尋與篩選區塊 */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="join flex-1 max-w-xl">
              <input
                type="text"
                placeholder={`搜尋${
                  activeTab === 'action'
                    ? '使用者、動作或實體'
                    : activeTab === 'application'
                    ? '動作或備註'
                    : '收件者或主旨'
                }...`}
                className="input input-bordered join-item w-full focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <button
                className="btn btn-primary join-item px-6"
                onClick={handleSearch}
              >
                <span className="iconify lucide--search size-5" />
              </button>
            </div>

            {activeTab === 'action' && (
              <select
                className="select select-bordered"
                value={selectedActionType}
                onChange={(e) => {
                  setSelectedActionType(e.target.value);
                  setCurrentPage(1);
                }}
              >
                {actionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            )}

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedActionType('');
                setCurrentPage(1);
                void fetchLogs();
              }}
            >
              <span className="iconify lucide--refresh-cw size-4" />
              重新整理
            </button>

            {activeTab === 'action' && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setIsExportOpen(true)}
              >
                <span className="iconify lucide--download size-4" />
                導出
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : (
            <>
              {/* Action Logs Table */}
              {activeTab === 'action' && (
                <>
                  {actionLogs.length === 0 ? (
                    <div className="text-center py-12 text-base-content/60">
                      <span className="iconify lucide--activity size-16 mb-4 mx-auto" />
                      <p>尚無操作記錄</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th>時間</th>
                            <th>使用者</th>
                            <th>動作</th>
                            <th>實體</th>
                            <th>狀態</th>
                            <th>執行時間</th>
                            <th>IP 位址</th>
                            <th>詳細資訊</th>
                          </tr>
                        </thead>
                        <tbody>
                          {actionLogs.map((log) => (
                            <tr key={log.id}>
                              <td>
                                <div className="text-sm text-base-content/70">
                                  {new Date(log.createdTime).toLocaleString('zh-TW')}
                                </div>
                              </td>
                              <td>
                                <div className="font-semibold">{log.userName || '-'}</div>
                                {log.userType && (
                                  <div className="text-xs text-base-content/50">{log.userType}</div>
                                )}
                              </td>
                              <td>
                                <span className={`badge badge-${getActionBadgeColor(log.actionType || '')}`}>
                                  {log.actionName || log.actionType || '-'}
                                </span>
                              </td>
                              <td>
                                <div className="text-sm">
                                  {log.entityTypeName || log.entityName || '-'}
                                  {log.entityId && (
                                    <span className="text-base-content/60 block text-xs font-mono">
                                      {log.entityId.length > 20 ? log.entityId.slice(0, 20) + '...' : log.entityId}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td>
                                {log.isSuccess ? (
                                  <span className="badge badge-success badge-sm">成功</span>
                                ) : (
                                  <span className="badge badge-error badge-sm">失敗</span>
                                )}
                              </td>
                              <td>
                                {log.executionDuration !== undefined && log.executionDuration !== null ? (
                                  <span className="text-sm font-mono">{log.executionDuration}ms</span>
                                ) : (
                                  '-'
                                )}
                              </td>
                              <td>
                                <div className="font-mono text-sm">{log.ipAddress || '-'}</div>
                              </td>
                              <td>
                                <div className="text-sm text-base-content/70 max-w-xs line-clamp-2">
                                  {log.errorMessage || log.description || '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Application Logs Table */}
              {activeTab === 'application' && (
                <>
                  {applicationLogs.length === 0 ? (
                    <div className="text-center py-12 text-base-content/60">
                      <span className="iconify lucide--file-text size-16 mb-4 mx-auto" />
                      <p>尚無申請記錄</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra">
                        <thead>
                          <tr>
                            <th>操作時間</th>
                            <th>申請 ID</th>
                            <th>操作員</th>
                            <th>動作</th>
                            <th>狀態變更</th>
                            <th>IP 位址</th>
                            <th>備註</th>
                          </tr>
                        </thead>
                        <tbody>
                          {applicationLogs.map((log) => (
                            <tr key={log.id}>
                              <td>
                                <div className="text-sm text-base-content/70">
                                  {new Date(log.operatedAt).toLocaleString('zh-TW')}
                                </div>
                              </td>
                              <td>
                                <div className="font-mono text-xs">
                                  {log.applicationId.slice(0, 8)}...
                                </div>
                              </td>
                              <td>
                                <div className="font-semibold">{log.operatorName || '-'}</div>
                              </td>
                              <td>
                                <span className="badge badge-primary badge-sm">{log.action || '-'}</span>
                              </td>
                              <td>
                                <div className="flex items-center gap-1 text-sm">
                                  {log.previousStatus !== undefined && log.previousStatus !== null && (
                                    <>
                                      <span className={`badge badge-${getStatusDisplay(log.previousStatus).color} badge-xs`}>
                                        {getStatusDisplay(log.previousStatus).label}
                                      </span>
                                      <span className="iconify lucide--arrow-right size-3 text-base-content/50" />
                                    </>
                                  )}
                                  <span className={`badge badge-${getStatusDisplay(log.newStatus).color} badge-xs`}>
                                    {getStatusDisplay(log.newStatus).label}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <div className="font-mono text-sm">{log.ipAddress || '-'}</div>
                              </td>
                              <td>
                                <div className="text-sm text-base-content/70 max-w-xs line-clamp-2">
                                  {log.comment || '-'}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* Mail Logs Table */}
              {activeTab === 'mail' && (
                <>
                  {mailLogs.length === 0 ? (
                    <div className="text-center py-12 text-base-content/60">
                      <span className="iconify lucide--mail size-16 mb-4 mx-auto" />
                      <p>尚無郵件記錄</p>
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
                          {mailLogs.map((log) => (
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
                                  <div className="text-xs text-base-content/50">
                                    共 {log.receiverCount} 位收件者
                                  </div>
                                )}
                              </td>
                              <td>
                                <div className="font-semibold max-w-xs line-clamp-1" title={log.subject}>
                                  {log.subject || '-'}
                                </div>
                              </td>
                              <td>
                                <StatusBadge
                                  isSuccess={log.isSuccess}
                                  errorMessage={log.errorMessage}
                                />
                              </td>
                              <td>
                                <BounceStatusBadge
                                  bounceStatus={log.bounceStatus}
                                  bounceCode={log.bounceCode}
                                />
                              </td>
                              <td>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleViewMailDetail(log.id)}
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
                </>
              )}

              {/* 分頁控制 */}
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
            </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <dialog className={`modal ${isExportOpen ? 'modal-open' : ''}`}>
        <div className="modal-box">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => setIsExportOpen(false)}
          >
            <span className="iconify lucide--x size-5" />
          </button>

          <h3 className="font-bold text-lg mb-4">
            <span className="iconify lucide--download size-5 inline-block mr-2" />
            導出操作日誌
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">開始日期</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">結束日期</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">筆數限制</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={exportLimit}
                  onChange={(e) => setExportLimit(Math.min(10000, Math.max(1, parseInt(e.target.value) || 1000)))}
                  min={1}
                  max={10000}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/50">最多 10,000 筆</span>
                </label>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">檔案格式</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                >
                  <option value="excel">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="json">JSON (.json)</option>
                </select>
              </div>
            </div>

            {selectedActionType && (
              <div className="alert alert-info">
                <span className="iconify lucide--info size-4" />
                <span>將套用目前篩選條件：操作類型 = {actionTypes.find(t => t.value === selectedActionType)?.label}</span>
              </div>
            )}
          </div>

          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setIsExportOpen(false)}>
              取消
            </button>
            <button
              className="btn btn-primary"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <span className="loading loading-spinner loading-sm" />
                  導出中...
                </>
              ) : (
                <>
                  <span className="iconify lucide--download size-4" />
                  導出
                </>
              )}
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => setIsExportOpen(false)}>close</button>
        </form>
      </dialog>

      {/* Mail Detail Modal */}
      <dialog className={`modal ${isMailDetailOpen ? 'modal-open' : ''}`}>
        <div className="modal-box max-w-3xl">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            onClick={() => {
              setIsMailDetailOpen(false);
              setSelectedMailLog(null);
            }}
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
          ) : selectedMailLog ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-base-content/60">發送時間</label>
                  <p className="text-sm">
                    {new Date(selectedMailLog.time || selectedMailLog.createdTime).toLocaleString('zh-TW')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">發送狀態</label>
                  <p>
                    {selectedMailLog.isSuccess ? (
                      <span className="badge badge-success badge-sm">發送成功</span>
                    ) : (
                      <span className="badge badge-error badge-sm">發送失敗</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">郵件類型</label>
                  <p>
                    <span className={`badge badge-${getMailTypeDisplay(selectedMailLog.mailType).color} badge-sm`}>
                      {getMailTypeDisplay(selectedMailLog.mailType).label}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/60">收件者數量</label>
                  <p className="text-sm">{selectedMailLog.receiverCount} 位</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-base-content/60">收件者</label>
                <p className="text-sm bg-base-200 p-2 rounded">{selectedMailLog.receivers || '-'}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-base-content/60">主旨</label>
                <p className="text-sm bg-base-200 p-2 rounded font-medium">{selectedMailLog.subject || '-'}</p>
              </div>

              {selectedMailLog.messageId && (
                <div>
                  <label className="text-sm font-medium text-base-content/60">Message-ID</label>
                  <p className="text-sm bg-base-200 p-2 rounded font-mono text-xs break-all">{selectedMailLog.messageId}</p>
                </div>
              )}

              {selectedMailLog.errorMessage && (() => {
                const errorInfo = parseBounceCode(selectedMailLog.errorMessage);
                return (
                  <div className="border border-error/30 rounded-lg p-4 bg-error/5">
                    <h4 className="font-semibold text-error mb-3 flex items-center gap-2">
                      <span className="iconify lucide--alert-circle size-5" />
                      發送失敗
                    </h4>
                    <div>
                      <label className="text-sm font-medium text-base-content/60">伺服器回應</label>
                      <p className="text-sm bg-base-200 p-2 rounded mt-1 font-mono text-xs break-all">
                        {selectedMailLog.errorMessage}
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

              {/* 退信資訊區塊 */}
              {selectedMailLog.bounceStatus > 0 && (() => {
                const bounceInfo = parseBounceCode(selectedMailLog.bounceCode);
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
                          {selectedMailLog.bounceStatus === 1 ? (
                            <span className="badge badge-error badge-sm">硬退信 (Hard Bounce)</span>
                          ) : (
                            <span className="badge badge-warning badge-sm">軟退信 (Soft Bounce)</span>
                          )}
                        </p>
                      </div>
                      {selectedMailLog.bounceTime && (
                        <div>
                          <label className="text-sm font-medium text-base-content/60">退信時間</label>
                          <p className="text-sm">
                            {new Date(selectedMailLog.bounceTime).toLocaleString('zh-TW')}
                          </p>
                        </div>
                      )}
                      {selectedMailLog.bounceCode && (
                        <div>
                          <label className="text-sm font-medium text-base-content/60">退信代碼</label>
                          <p className="text-sm">
                            <span className="font-mono bg-base-200 px-2 py-0.5 rounded">{selectedMailLog.bounceCode}</span>
                          </p>
                        </div>
                      )}
                      {selectedMailLog.remoteMta && (
                        <div>
                          <label className="text-sm font-medium text-base-content/60">遠端 MTA</label>
                          <p className="text-sm font-mono">{selectedMailLog.remoteMta}</p>
                        </div>
                      )}
                    </div>

                    {/* 代碼解析 */}
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

                    {selectedMailLog.bounceReason && (
                      <div className="mt-3">
                        <label className="text-sm font-medium text-base-content/60">伺服器回應</label>
                        <p className="text-sm bg-base-200 p-2 rounded mt-1 font-mono text-xs break-all">
                          {selectedMailLog.bounceReason}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="text-sm font-medium text-base-content/60">郵件內容</label>
                <div className="border rounded-lg overflow-hidden mt-1">
                  {selectedMailLog.content ? (
                    <iframe
                      srcDoc={selectedMailLog.content}
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
            <button
              className="btn"
              onClick={() => {
                setIsMailDetailOpen(false);
                setSelectedMailLog(null);
              }}
            >
              關閉
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={() => {
            setIsMailDetailOpen(false);
            setSelectedMailLog(null);
          }}>close</button>
        </form>
      </dialog>
    </div>
  );
};
