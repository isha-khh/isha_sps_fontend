import { useCallback, useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { StatItem, DateRangePicker, DonutChart, StackedBarChart } from '@/components/analytics';
import { analyticsApi } from '@/lib/api/analytics';
import type { AnalyticsReport } from '@/types/analytics';
import { AnalyticsDimensionType } from '@/types/analytics';
import type { DateRange } from '@/types/statistics';

export const TrafficAnalyticsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [report, setReport] = useState<AnalyticsReport | null>(null);
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
      const data = await analyticsApi.getReport(dateRange.startDate, dateRange.endDate);
      // 確保資料格式正確
      setReport({
        dailyMetrics: data?.dailyMetrics ?? [],
        distributions: data?.distributions ?? [],
      });
    } catch (error) {
      console.error('Failed to fetch traffic analytics:', error);
      setReport({ dailyMetrics: [], distributions: [] });
    } finally {
      setIsLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const handleSync = async (days: number) => {
    setIsSyncing(true);
    try {
      await analyticsApi.sync(days);
      await fetchData();
    } catch (error) {
      console.error('Failed to sync analytics:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // 計算核心指標
  const totalVisitors = report?.dailyMetrics.reduce((sum, m) => sum + m.activeUsers, 0) ?? 0;
  const totalPageViews = report?.dailyMetrics.reduce((sum, m) => sum + m.screenPageViews, 0) ?? 0;
  const avgBounceRate = report?.dailyMetrics.length
    ? (report.dailyMetrics.reduce((sum, m) => sum + m.bounceRate, 0) / report.dailyMetrics.length) * 100
    : 0;
  const avgDuration = report?.dailyMetrics.length
    ? report.dailyMetrics.reduce((sum, m) => sum + m.averageEngagementTime, 0) / report.dailyMetrics.length
    : 0;
  const avgPagesPerSession = report?.dailyMetrics.length
    ? report.dailyMetrics.reduce((sum, m) => sum + m.screenPageViewsPerSession, 0) / report.dailyMetrics.length
    : 0;

  // 分佈數據
  const getDistribution = (type: AnalyticsDimensionType): Record<string, number> => {
    if (!report) return {};
    return report.distributions
      .filter((d) => d.dimensionType === type)
      .reduce(
        (acc, d) => {
          acc[d.dimensionValue] = d.totalUsers;
          return acc;
        },
        {} as Record<string, number>
      );
  };

  const deviceDistribution = getDistribution(AnalyticsDimensionType.DeviceCategory);
  const browserDistribution = getDistribution(AnalyticsDimensionType.Browser);
  const countryDistribution = getDistribution(AnalyticsDimensionType.Country);
  const languageDistribution = getDistribution(AnalyticsDimensionType.Language);

  // 活躍用戶趨勢數據
  const trendCategories = report?.dailyMetrics.map((m) => m.date) ?? [];
  const trendSeries = [
    {
      name: '活躍用戶',
      data: report?.dailyMetrics.map((m) => m.activeUsers) ?? [],
    },
    {
      name: '瀏覽頁數',
      data: report?.dailyMetrics.map((m) => m.screenPageViews) ?? [],
    },
  ];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        title="流量分析"
        items={[
          { label: '分析報表', path: '/analytics' },
          { label: '流量分析', active: true },
        ]}
      />

      {/* 控制區 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleSync(30)}
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
              同步數據
            </>
          )}
        </button>
      </div>

      {/* 核心指標卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatItem
          title="總訪客數"
          amount={totalVisitors.toLocaleString()}
          icon="lucide--users"
          showTrend={false}
        />
        <StatItem
          title="總瀏覽數 (PV)"
          amount={totalPageViews.toLocaleString()}
          icon="lucide--eye"
          showTrend={false}
        />
        <StatItem
          title="平均跳出率"
          amount={`${avgBounceRate.toFixed(1)}%`}
          icon="lucide--arrow-left-right"
          showTrend={false}
        />
        <StatItem
          title="平均停留時間"
          amount={formatDuration(avgDuration)}
          icon="lucide--clock"
          showTrend={false}
        />
        <StatItem
          title="頁數/次"
          amount={avgPagesPerSession.toFixed(2)}
          icon="lucide--file-stack"
          showTrend={false}
        />
      </div>

      {/* 活躍用戶趨勢圖 */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">活躍用戶趨勢</h3>
          <StackedBarChart
            categories={trendCategories}
            series={trendSeries}
            height={320}
            stacked={false}
            colors={['#167bff', '#22c55e']}
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
            <h3 className="card-title text-base">裝置分佈</h3>
            <DonutChart data={deviceDistribution} height={280} />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">瀏覽器分佈</h3>
            <DonutChart data={browserDistribution} height={280} />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">國家/地區 Top 10</h3>
            <DonutChart
              data={Object.fromEntries(
                Object.entries(countryDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 10)
              )}
              height={280}
            />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">語言分佈</h3>
            <DonutChart data={languageDistribution} height={280} />
          </div>
        </div>
      </div>
    </div>
  );
};
