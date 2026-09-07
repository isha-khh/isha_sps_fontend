import { useCallback, useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { StatItem, DateRangePicker, DonutChart, StackedBarChart } from '@/components/analytics';
import { statisticsApi } from '@/lib/api/statistics';
import type { ActionLogStatistics, DateRange } from '@/types/statistics';

export const SystemAnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<ActionLogStatistics | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    return {
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0],
    };
  });

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await statisticsApi.getActionLogStatistics(
        dateRange.startDate,
        dateRange.endDate
      );
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch action log statistics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // 格式化執行時間
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  };

  // 計算成功率
  const successRate = stats?.totalCount
    ? ((stats.successCount / stats.totalCount) * 100).toFixed(1)
    : '0';

  // 轉換每日趨勢數據為圖表格式
  const trendCategories = stats?.dailyTrend.map((d) => d.date) ?? [];
  const trendSeries = [
    {
      name: '成功',
      data: stats?.dailyTrend.map((d) => d.success) ?? [],
    },
    {
      name: '失敗',
      data: stats?.dailyTrend.map((d) => d.failure) ?? [],
    },
  ];

  // 操作類型中文對照
  const actionTypeLabels: Record<string, string> = {
    Create: '新增',
    Update: '更新',
    Delete: '刪除',
    Login: '登入',
    Logout: '登出',
    View: '查看',
    Export: '匯出',
    Import: '匯入',
    Approve: '審核通過',
    Reject: '審核拒絕',
    PasswordReset:"密碼重設",
    Auth:"前台認證",
    Admin:"後台認證",
    captcha:"驗證碼",
    analytics:"Google 分析",
    FileManagement:"檔案操作",
    setting:"設置"
  };

  // 轉換操作類型分佈為中文
  const actionTypeDistribution = Object.entries(stats?.actionTypeDistribution ?? {}).reduce(
    (acc, [key, value]) => {
      acc[actionTypeLabels[key] || key] = value;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="系統分析"
        items={[
          { label: '分析報表', path: '/analytics' },
          { label: '系統分析', active: true },
        ]}
      />

      {/* 日期範圍選擇器 */}
      <div className="flex justify-end">
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </div>

      {/* 統計卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="總操作數"
          amount={stats?.totalCount.toLocaleString() ?? '0'}
          icon="lucide--activity"
          showTrend={false}
        />
        <StatItem
          title="成功操作"
          amount={stats?.successCount.toLocaleString() ?? '0'}
          icon="lucide--check-circle"
          showTrend={false}
        />
        <StatItem
          title="失敗操作"
          amount={stats?.failureCount.toLocaleString() ?? '0'}
          icon="lucide--x-circle"
          showTrend={false}
        />
        <StatItem
          title="平均執行時間"
          amount={formatDuration(stats?.avgExecutionDuration ?? 0)}
          icon="lucide--clock"
          showTrend={false}
        />
      </div>

      {/* 成功率 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <h3 className="card-title text-base">操作成功率</h3>
            <span className="text-2xl font-bold text-success">{successRate}%</span>
          </div>
          <progress
            className="progress progress-success w-full"
            value={parseFloat(successRate)}
            max={100}
          />
        </div>
      </div>

      {/* 每日操作趨勢圖 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">每日操作趨勢</h3>
          <StackedBarChart
            categories={trendCategories}
            series={trendSeries}
            height={320}
            stacked={true}
            colors={['#22c55e', '#ef4444']}
            xAxisFormatter={(val) => {
              const date = new Date(val);
              return `${date.getMonth() + 1}/${date.getDate()}`;
            }}
          />
        </div>
      </div>

      {/* 分佈圖表 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">操作類型分佈</h3>
            <DonutChart
              data={actionTypeDistribution}
              height={300}
            />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">實體類型分佈</h3>
            <DonutChart
              data={stats?.entityTypeDistribution ?? {}}
              height={300}
            />
          </div>
        </div>
      </div>

      {/* 詳細數據表格 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">操作類型詳細統計</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>操作類型</th>
                  <th className="text-right">次數</th>
                  <th className="text-right">佔比</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(actionTypeDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <tr key={type}>
                      <td>{type}</td>
                      <td className="text-right">{count.toLocaleString()}</td>
                      <td className="text-right">
                        {stats?.totalCount
                          ? ((count / stats.totalCount) * 100).toFixed(1)
                          : '0'}
                        %
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
