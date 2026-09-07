import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { StatCard } from '@/components/dashboard/StatCard';
import { ActiveAccountsChart } from '@/components/dashboard/ActiveAccountsChart';
import { DeviceDistributionChart } from '@/components/dashboard/DeviceDistributionChart';
import { BrowserDistributionChart } from '@/components/dashboard/BrowserDistributionChart';
import { CountryDistributionChart } from '@/components/dashboard/CountryDistributionChart';
import type { DashboardData } from '@/types/dashboard';
import { analyticsApi } from '@/lib/api/analytics';
import { adminApplicationsApi } from '@/lib/api/admin-applications';
import { chatApi } from '@/lib/api/chat';
import { companiesApi } from '@/lib/api/companies';
import { filesManagementApi } from '@/lib/api/files-management';
import { AnalyticsDimensionType, type AnalyticsReport, type AnalyticsMetric, type AnalyticsDistribution } from '@/types/analytics';
import { usePermission, Permission } from '@/hooks/usePermission';

// 安全呼叫 API，失敗時返回預設值
async function safeApiCall<T>(apiCall: () => Promise<T>, defaultValue: T): Promise<T> {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API call failed, using default value:', error);
    return defaultValue;
  }
}

export const DashboardPage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDays, setSyncDays] = useState(1);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const { has } = usePermission();

  // 預設的空 Analytics Report
  const emptyAnalyticsReport: AnalyticsReport = {
    dailyMetrics: [],
    distributions: [],
  };

  // 預設統計數據
  const emptyApplicationStats = { totalApplications: 0, draft: 0, pendingReview: 0, underReview: 0, approved: 0, rejected: 0, cancelled: 0, todayApplications: 0 };
  const emptyChatStats = { onlineSessions: 0, totalSessions: 0, totalMessages: 0, unreadMessages: 0 };
  const emptyCompanyStats = { totalCompanies: 0, supplierCount: 0, buyerCount: 0, bothCount: 0, verifiedCount: 0, activeCount: 0, companiesThisMonth: 0, companiesToday: 0 };
  const emptyFileStats = { totalFiles: 0 };

  // 獲取 Dashboard 數據
  const fetchData = async () => {
      try {
        // 根據權限決定要呼叫哪些 API，並行獲取數據
        const [
          analyticsReport,
          applicationStats,
          chatStats,
          onlineVisitors,
          companyStats,
          fileStats,
        ] = await Promise.all([
          // Analytics - 需要 ViewAnalytics 權限
          has(Permission.ViewAnalytics)
            ? safeApiCall(() => analyticsApi.getReport() as Promise<AnalyticsReport>, emptyAnalyticsReport)
            : Promise.resolve(emptyAnalyticsReport),
          // Applications - 需要 ManageApplications 權限
          has(Permission.ManageApplications)
            ? safeApiCall(() => adminApplicationsApi.getStatistics(), emptyApplicationStats)
            : Promise.resolve(emptyApplicationStats),
          // Chat - 不需特別權限，但可能失敗
          safeApiCall(() => chatApi.getStatistics(), emptyChatStats),
          safeApiCall(() => chatApi.getOnlineVisitors(), []),
          // Companies - 需要 ManageCompanies 權限
          has(Permission.ManageCompanies)
            ? safeApiCall(() => companiesApi.getStatistics(), emptyCompanyStats)
            : Promise.resolve(emptyCompanyStats),
          // Files - 檔案統計
          safeApiCall(() => filesManagementApi.getStatistics(), emptyFileStats),
        ]);

        // 轉換數據格式
        const transformedData: DashboardData = {
          // 即時狀態
          realtime: {
            chatUpdates: (onlineVisitors ?? []).reduce(
              (sum: number, visitor: any) => sum + (visitor.unreadMessageCount ?? 0),
              0
            ),
            onlineMembers: chatStats.onlineSessions ?? 0,
          },

          // 總量統計
          total: {
            totalFiles: fileStats.totalFiles ?? 0,
            totalApplications: applicationStats.totalApplications ?? 0,
            todayApplications: applicationStats.todayApplications ?? 0,
            totalCompanies: companyStats.totalCompanies ?? 0,
            todayCompanies: companyStats.companiesToday ?? 0,
          },

          // 供需概況（需求端 = Buyer + Both，供給端 = Supplier + Both）
          supplyDemand: {
            demandCount: (companyStats.buyerCount ?? 0) + (companyStats.bothCount ?? 0),
            supplyCount: (companyStats.supplierCount ?? 0) + (companyStats.bothCount ?? 0),
          },

          // 流量分析（使用最近一天的數據）
          traffic: (() => {
            const latestMetric =
              analyticsReport.dailyMetrics[analyticsReport.dailyMetrics.length - 1];
            if (!latestMetric) {
              return {
                visitors: 0,
                pageViews: 0,
                bounceRate: 0,
                avgSessionDuration: 0,
                pagesPerSession: 0,
              };
            }
            return {
              visitors: latestMetric.activeUsers,
              pageViews: latestMetric.screenPageViews,
              bounceRate: latestMetric.bounceRate * 100,
              avgSessionDuration: latestMetric.averageEngagementTime,
              pagesPerSession: latestMetric.screenPageViewsPerSession,
            };
          })(),

          // 活躍帳號數據（轉換每日指標）
          activeAccounts: analyticsReport.dailyMetrics.map((metric: AnalyticsMetric) => ({
            date: metric.date,
            count: metric.activeUsers,
          })),

          // 裝置分佈
          deviceDistribution: (() => {
            const devices = analyticsReport.distributions.filter(
              (d: AnalyticsDistribution) => d.dimensionType === AnalyticsDimensionType.DeviceCategory
            );
            const desktop =
              devices.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase() === 'desktop')
                ?.totalUsers || 0;
            const mobile =
              devices.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase() === 'mobile')
                ?.totalUsers || 0;
            const tablet =
              devices.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase() === 'tablet')
                ?.totalUsers || 0;
            const total = desktop + mobile + tablet || 1;
            return {
              desktop: Math.round((desktop / total) * 100),
              mobile: Math.round((mobile / total) * 100),
              tablet: Math.round((tablet / total) * 100),
            };
          })(),

          // 瀏覽器分佈
          browserDistribution: (() => {
            const browsers = analyticsReport.distributions.filter(
              (d: AnalyticsDistribution) => d.dimensionType === AnalyticsDimensionType.Browser
            );
            const chrome =
              browsers.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase().includes('chrome'))
                ?.totalUsers || 0;
            const firefox =
              browsers.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase().includes('firefox'))
                ?.totalUsers || 0;
            const safari =
              browsers.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase().includes('safari'))
                ?.totalUsers || 0;
            const edge =
              browsers.find((d: AnalyticsDistribution) => d.dimensionValue.toLowerCase().includes('edge'))
                ?.totalUsers || 0;
            const totalBrowsers = browsers.reduce((sum: number, b: AnalyticsDistribution) => sum + b.totalUsers, 0) || 1;
            const other = Math.max(0, totalBrowsers - chrome - firefox - safari - edge);
            return {
              chrome: Math.round((chrome / totalBrowsers) * 100),
              firefox: Math.round((firefox / totalBrowsers) * 100),
              safari: Math.round((safari / totalBrowsers) * 100),
              edge: Math.round((edge / totalBrowsers) * 100),
              other: Math.round((other / totalBrowsers) * 100),
            };
          })(),

          // 國家分佈
          countryDistribution: analyticsReport.distributions
            .filter((d: AnalyticsDistribution) => d.dimensionType === AnalyticsDimensionType.Country)
            .map((d: AnalyticsDistribution) => ({
              country: d.dimensionValue,
              count: d.totalUsers,
            }))
            .sort((a: { count: number }, b: { count: number }) => b.count - a.count)
            .slice(0, 10),

          // 語言分佈
          languageDistribution: analyticsReport.distributions
            .filter((d: AnalyticsDistribution) => d.dimensionType === AnalyticsDimensionType.Language)
            .map((d: AnalyticsDistribution) => ({
              language: d.dimensionValue,
              count: d.totalUsers,
            }))
            .sort((a: { count: number }, b: { count: number }) => b.count - a.count),
        };

        setData(transformedData);

        // 設置最後同步日期（取最新的 metric 日期）
        if (analyticsReport.dailyMetrics.length > 0) {
          const latestMetric = analyticsReport.dailyMetrics[analyticsReport.dailyMetrics.length - 1];
          setLastSyncDate(latestMetric.date);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
  };

  // 同步 Google Analytics 數據
  const handleSync = async (days: number) => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      await analyticsApi.sync(days);
      setSyncMessage({ type: 'success', text: `✅ 已成功同步 ${days} 天數據` });

      // 3秒後清除訊息
      setTimeout(() => setSyncMessage(null), 3000);

      // 重新獲取數據
      await fetchData();
    } catch (error) {
      console.error('Failed to sync analytics:', error);
      setSyncMessage({ type: 'error', text: `❌ 同步失敗：${error}` });
    } finally {
      setIsSyncing(false);
    }
  };

  // 計算數據是否過期（>24小時）
  const isDataStale = () => {
    if (!lastSyncDate) return true;
    const lastSync = new Date(lastSyncDate);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24;
  };

  // 計算最後同步時間的相對描述
  const getLastSyncTimeText = () => {
    if (!lastSyncDate) return '從未同步';
    const lastSync = new Date(lastSyncDate);
    const now = new Date();
    const hoursDiff = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60));

    if (hoursDiff < 1) return '不到1小時前';
    if (hoursDiff < 24) return `${hoursDiff}小時前`;
    const daysDiff = Math.floor(hoursDiff / 24);
    return `${daysDiff}天前`;
  };

  useEffect(() => {
    void fetchData();
    // 每 30 秒刷新一次數據
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <span className="iconify lucide--alert-circle size-16 text-warning mb-4" />
          <p className="text-lg font-semibold">無法載入儀表板數據</p>
          <p className="text-base-content/60">請稍後再試或聯繫系統管理員</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="儀表板"
        items={[{ label: '儀表板', active: true }]}
      />

      {/* Google Analytics 同步控制 - 需要 ViewAnalytics 權限 */}
      {has(Permission.ViewAnalytics) && (
        <div className="card bg-base-100 shadow">
          <div className="card-body p-4">
            {/* 同步訊息 */}
            {syncMessage && (
              <div className={`alert ${syncMessage.type === 'success' ? 'alert-success' : 'alert-error'} mb-4`}>
                <span>{syncMessage.text}</span>
              </div>
            )}

            {/* 數據狀態提示 */}
            {isDataStale() ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="iconify lucide--alert-triangle text-warning size-6" />
                  <div>
                    <p className="font-semibold">數據已過期</p>
                    <p className="text-sm text-base-content/70">
                      最後更新：{getLastSyncTimeText()} ({lastSyncDate})
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className={`btn btn-sm ${syncDays === 1 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSyncDays(1)}
                    disabled={isSyncing}
                  >
                    1天
                  </button>
                  <button
                    className={`btn btn-sm ${syncDays === 7 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSyncDays(7)}
                    disabled={isSyncing}
                  >
                    7天
                  </button>
                  <button
                    className={`btn btn-sm ${syncDays === 30 ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setSyncDays(30)}
                    disabled={isSyncing}
                  >
                    30天
                  </button>
                  <button
                    className="btn btn-sm btn-success"
                    onClick={() => handleSync(syncDays)}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <span className="loading loading-spinner loading-xs" />
                        同步中...
                      </>
                    ) : (
                      <>
                        <span className="iconify lucide--refresh-cw size-4" />
                        立即同步 {syncDays} 天
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="iconify lucide--check-circle text-success size-6" />
                  <div>
                    <p className="font-semibold">數據已是最新</p>
                    <p className="text-sm text-base-content/70">
                      最後更新：{getLastSyncTimeText()} ({lastSyncDate})
                    </p>
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-ghost"
                  onClick={() => handleSync(1)}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      同步中...
                    </>
                  ) : (
                    <>
                      <span className="iconify lucide--refresh-cw size-4" />
                      重新同步
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 即時狀態 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">即時狀態</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="聊天室更新數"
            value={data.realtime.chatUpdates}
            icon="lucide--message-circle"
            description="即時訊息數量"
            colorClass="text-info"
          />
          <StatCard
            title="會員在線數量"
            value={data.realtime.onlineMembers}
            icon="lucide--user-check"
            description="當前在線會員"
            colorClass="text-success"
          />
        </div>
      </div>

      {/* 總量統計 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">總量統計</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="檔案總數"
            value={data.total.totalFiles.toLocaleString()}
            icon="lucide--folder"
            description="系統檔案總數"
            colorClass="text-primary"
          />
          <StatCard
            title="申請文件數"
            value={data.total.totalApplications.toLocaleString()}
            icon="lucide--file-text"
            description={`今日新增 ${data.total.todayApplications} 筆`}
            colorClass="text-secondary"
          />
          <StatCard
            title="公司總數"
            value={data.total.totalCompanies.toLocaleString()}
            icon="lucide--building-2"
            description={`今日新增 ${data.total.todayCompanies} 家`}
            colorClass="text-accent"
          />
        </div>
      </div>

      {/* 供需概況 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">供需概況</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <StatCard
            title="需求端數量"
            value={data.supplyDemand.demandCount}
            icon="lucide--megaphone"
            description="平台需求發布數"
            colorClass="text-warning"
          />
          <StatCard
            title="供給端數量"
            value={data.supplyDemand.supplyCount}
            icon="lucide--package"
            description="平台供給提供數"
            colorClass="text-success"
          />
        </div>
      </div>

      {/* 流量分析 - 需要 ViewAnalytics 權限 */}
      {has(Permission.ViewAnalytics) && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">流量分析</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <StatCard
              title="訪客人數"
              value={data.traffic.visitors.toLocaleString()}
              icon="lucide--users"
              description="總訪客數"
              colorClass="text-info"
            />
            <StatCard
              title="瀏覽數 (PV)"
              value={data.traffic.pageViews.toLocaleString()}
              icon="lucide--eye"
              description="總瀏覽頁次"
              colorClass="text-primary"
            />
            <StatCard
              title="跳出率"
              value={`${data.traffic.bounceRate.toFixed(1)}%`}
              icon="lucide--arrow-left-right"
              description="單頁訪問比例"
              colorClass="text-warning"
            />
            <StatCard
              title="平均停留時間"
              value={`${Math.floor(data.traffic.avgSessionDuration / 60)}:${Math.floor(data.traffic.avgSessionDuration % 60).toString().padStart(2, '0')}`}
              icon="lucide--clock"
              description="每次訪問時長"
              colorClass="text-secondary"
            />
            <StatCard
              title="單次連結瀏覽頁數"
              value={data.traffic.pagesPerSession.toFixed(1)}
              icon="lucide--file-stack"
              description="平均瀏覽頁數"
              colorClass="text-accent"
            />
          </div>
        </div>
      )}

      {/* 視覺化圖表 - 需要 ViewAnalytics 權限 */}
      {has(Permission.ViewAnalytics) && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">數據分析圖表</h2>

          {/* 活躍帳號報告 */}
          <div className="mb-4">
            <ActiveAccountsChart data={data.activeAccounts} />
          </div>

          {/* 使用者分佈 */}
          <div className="grid gap-4 lg:grid-cols-2">
            <DeviceDistributionChart data={data.deviceDistribution} />
            <BrowserDistributionChart data={data.browserDistribution} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <CountryDistributionChart data={data.countryDistribution} />

            {/* 語言分佈表格 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">語言分佈</h2>
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>語言</th>
                        <th>使用者數</th>
                        <th>比例</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.languageDistribution.map((item, index) => {
                        const total = data.languageDistribution.reduce(
                          (sum, i) => sum + i.count,
                          0
                        );
                        const percentage = ((item.count / total) * 100).toFixed(1);
                        return (
                          <tr key={index}>
                            <td>{item.language}</td>
                            <td>{item.count}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <progress
                                  className="progress progress-primary w-20"
                                  value={item.count}
                                  max={total}
                                />
                                <span className="text-sm">{percentage}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
