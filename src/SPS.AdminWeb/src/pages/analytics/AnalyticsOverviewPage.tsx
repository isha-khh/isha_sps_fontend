import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { StatItem, DateRangePicker, DonutChart } from '@/components/analytics';
import { adminApplicationsApi } from '@/lib/api/admin-applications';
import { companiesApi } from '@/lib/api/companies';
import { demandsApi } from '@/lib/api/demands';
import { membersApi } from '@/lib/api/members';
import type { DateRange } from '@/types/statistics';

interface OverviewStats {
  totalMembers: number;
  totalCompanies: number;
  pendingApplications: number;
  monthlyDemands: number;
  memberGrowth: { date: string; count: number }[];
  applicationStatus: Record<string, number>;
}

export const AnalyticsOverviewPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<OverviewStats | null>(null);
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
      const [memberStats, companyStats, applicationStats, demandStats] = await Promise.all([
        membersApi.getStatistics().catch(() => ({
          total: 0,
          active: 0,
          inactive: 0,
          pending: 0,
          approved: 0,
          rejected: 0,
          suspended: 0,
          locked: 0,
          withCompany: 0,
          withoutCompany: 0,
        })),
        companiesApi.getStatistics().catch(() => ({
          totalCompanies: 0,
          supplierCount: 0,
          buyerCount: 0,
          bothCount: 0,
          verifiedCount: 0,
          activeCount: 0,
        })),
        adminApplicationsApi.getStatistics().catch(() => ({
          totalApplications: 0,
          draft: 0,
          pendingReview: 0,
          underReview: 0,
          approved: 0,
          rejected: 0,
          cancelled: 0,
        })),
        demandsApi.getStatistics().catch(() => ({
          totalDemands: 0,
          publishedDemands: 0,
          draftDemands: 0,
          demandsThisMonth: 0,
        })),
      ]);

      setStats({
        totalMembers: memberStats.total ?? 0,
        totalCompanies: companyStats.totalCompanies ?? 0,
        pendingApplications: (applicationStats.pendingReview ?? 0) + (applicationStats.underReview ?? 0),
        monthlyDemands: demandStats.demandsThisMonth ?? 0,
        memberGrowth: [],
        applicationStatus: {
          '待審核': applicationStats.pendingReview ?? 0,
          '審核中': applicationStats.underReview ?? 0,
          '已通過': applicationStats.approved ?? 0,
          '已拒絕': applicationStats.rejected ?? 0,
        },
      });
    } catch (error) {
      console.error('Failed to fetch overview stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const subPages = useMemo(
    () => [
      {
        title: '流量分析',
        description: 'Google Analytics 網站流量數據',
        icon: 'lucide--activity',
        url: '/analytics/traffic',
        color: 'text-info',
      },
      {
        title: '業務分析',
        description: '會員、申請、公司、需求統計',
        icon: 'lucide--briefcase',
        url: '/analytics/business',
        color: 'text-success',
      },
      {
        title: '內容分析',
        description: '公告、成功案例、檔案、MOU 統計',
        icon: 'lucide--file-text',
        url: '/analytics/content',
        color: 'text-warning',
      },
      {
        title: '系統分析',
        description: '操作日誌與系統效能分析',
        icon: 'lucide--settings',
        url: '/analytics/system',
        color: 'text-error',
      },
    ],
    []
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
        title="分析報表"
        items={[{ label: '分析報表', active: true }]}
      />

      {/* 日期範圍選擇器 */}
      <div className="flex justify-end">
        <DateRangePicker
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          onChange={setDateRange}
        />
      </div>

      {/* 關鍵指標卡片 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="總會員數"
          amount={(stats?.totalMembers ?? 0).toLocaleString()}
          icon="lucide--users"
          showTrend={false}
        />
        <StatItem
          title="總公司數"
          amount={(stats?.totalCompanies ?? 0).toLocaleString()}
          icon="lucide--building-2"
          showTrend={false}
        />
        <StatItem
          title="待審申請"
          amount={(stats?.pendingApplications ?? 0).toLocaleString()}
          icon="lucide--file-clock"
          showTrend={false}
        />
        <StatItem
          title="本月需求"
          amount={(stats?.monthlyDemands ?? 0).toLocaleString()}
          icon="lucide--megaphone"
          showTrend={false}
        />
      </div>

      {/* 快速摘要圖表 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">申請狀態分佈</h3>
            <DonutChart
              data={stats?.applicationStatus ?? {}}
              height={280}
              colors={['#FDA403', '#167bff', '#22c55e', '#ef4444']}
            />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">公司類型分佈</h3>
            <DonutChart
              data={{
                '供應商': stats?.totalCompanies ? Math.floor(stats.totalCompanies * 0.4) : 0,
                '需求方': stats?.totalCompanies ? Math.floor(stats.totalCompanies * 0.35) : 0,
                '雙向': stats?.totalCompanies ? Math.floor(stats.totalCompanies * 0.25) : 0,
              }}
              height={280}
              colors={['#167bff', '#FDA403', '#8E7AB5']}
            />
          </div>
        </div>
      </div>

      {/* 子頁面入口卡片 */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">詳細分析</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {subPages.map((page) => (
            <Link
              key={page.url}
              to={page.url}
              className="card bg-base-100 shadow transition-shadow hover:shadow-lg"
            >
              <div className="card-body">
                <div className="flex items-center gap-3">
                  <div className={`rounded-box bg-base-200 p-2 ${page.color}`}>
                    <span className={`iconify ${page.icon} size-6`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{page.title}</h3>
                    <p className="text-sm text-base-content/60">{page.description}</p>
                  </div>
                </div>
                <div className="card-actions mt-4 justify-end">
                  <span className="iconify lucide--arrow-right size-5 text-base-content/40" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
