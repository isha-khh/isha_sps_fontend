import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { StatItem, DonutChart } from '@/components/analytics';
import { adminApplicationsApi } from '@/lib/api/admin-applications';
import { companiesApi } from '@/lib/api/companies';
import { demandsApi } from '@/lib/api/demands';
import { membersApi } from '@/lib/api/members';

type TabType = 'members' | 'applications' | 'companies' | 'demands';

interface MemberStats {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  approved: number;
  rejected: number;
  suspended: number;
  locked: number;
  withCompany: number;
  withoutCompany: number;
}

interface ApplicationStats {
  totalApplications: number;
  draft: number;
  pendingReview: number;
  underReview: number;
  approved: number;
  rejected: number;
  cancelled: number;
}

interface CompanyStats {
  totalCompanies: number;
  supplierCount: number;
  buyerCount: number;
  bothCount: number;
  verifiedCount: number;
  activeCount: number;
}

interface DemandStats {
  totalDemands: number;
  publishedDemands: number;
  draftDemands: number;
  demandsThisMonth: number;
}

export const BusinessAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [isLoading, setIsLoading] = useState(true);

  const [memberStats, setMemberStats] = useState<MemberStats | null>(null);
  const [applicationStats, setApplicationStats] = useState<ApplicationStats | null>(null);
  const [companyStats, setCompanyStats] = useState<CompanyStats | null>(null);
  const [demandStats, setDemandStats] = useState<DemandStats | null>(null);

  useEffect(() => {
    const fetchAllStats = async () => {
      setIsLoading(true);
      try {
        const [members, applications, companies, demands] = await Promise.all([
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
          adminApplicationsApi.getStatistics().catch(() => ({
            totalApplications: 0,
            draft: 0,
            pendingReview: 0,
            underReview: 0,
            approved: 0,
            rejected: 0,
            cancelled: 0,
          })),
          companiesApi.getStatistics().catch(() => ({
            totalCompanies: 0,
            supplierCount: 0,
            buyerCount: 0,
            bothCount: 0,
            verifiedCount: 0,
            activeCount: 0,
          })),
          demandsApi.getStatistics().catch(() => ({
            totalDemands: 0,
            publishedDemands: 0,
            draftDemands: 0,
            demandsThisMonth: 0,
          })),
        ]);

        setMemberStats(members);
        setApplicationStats(applications);
        setCompanyStats(companies);
        setDemandStats(demands);
      } catch (error) {
        console.error('Failed to fetch business stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAllStats();
  }, []);

  const tabs = [
    { id: 'members' as const, label: '會員', icon: 'lucide--users' },
    { id: 'applications' as const, label: '申請', icon: 'lucide--file-text' },
    { id: 'companies' as const, label: '公司', icon: 'lucide--building-2' },
    { id: 'demands' as const, label: '需求', icon: 'lucide--megaphone' },
  ];

  const renderMembersTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="會員總數"
          amount={(memberStats?.total ?? 0).toLocaleString()}
          icon="lucide--users"
          showTrend={false}
        />
        <StatItem
          title="活躍會員"
          amount={(memberStats?.active ?? 0).toLocaleString()}
          icon="lucide--user-check"
          showTrend={false}
        />
        <StatItem
          title="非活躍會員"
          amount={(memberStats?.inactive ?? 0).toLocaleString()}
          icon="lucide--user-x"
          showTrend={false}
        />
        <StatItem
          title="待審核"
          amount={(memberStats?.pending ?? 0).toLocaleString()}
          icon="lucide--user-plus"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">會員狀態分佈</h3>
          <DonutChart
            data={{
              '活躍': memberStats?.active ?? 0,
              '非活躍': memberStats?.inactive ?? 0,
              '待審核': memberStats?.pending ?? 0,
              '已鎖定': memberStats?.locked ?? 0,
            }}
            height={300}
            colors={['#22c55e', '#9ca3af', '#FDA403', '#ef4444']}
          />
        </div>
      </div>
    </div>
  );

  const renderApplicationsTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatItem
          title="申請總數"
          amount={(applicationStats?.totalApplications ?? 0).toLocaleString()}
          icon="lucide--file-text"
          showTrend={false}
        />
        <StatItem
          title="待審核"
          amount={(applicationStats?.pendingReview ?? 0).toLocaleString()}
          icon="lucide--clock"
          showTrend={false}
        />
        <StatItem
          title="審核中"
          amount={(applicationStats?.underReview ?? 0).toLocaleString()}
          icon="lucide--loader"
          showTrend={false}
        />
        <StatItem
          title="已通過"
          amount={(applicationStats?.approved ?? 0).toLocaleString()}
          icon="lucide--check-circle"
          showTrend={false}
        />
        <StatItem
          title="已拒絕"
          amount={(applicationStats?.rejected ?? 0).toLocaleString()}
          icon="lucide--x-circle"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">申請狀態分佈</h3>
          <DonutChart
            data={{
              '待審核': applicationStats?.pendingReview ?? 0,
              '審核中': applicationStats?.underReview ?? 0,
              '已通過': applicationStats?.approved ?? 0,
              '已拒絕': applicationStats?.rejected ?? 0,
            }}
            height={300}
            colors={['#FDA403', '#167bff', '#22c55e', '#ef4444']}
          />
        </div>
      </div>
    </div>
  );

  const renderCompaniesTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatItem
          title="公司總數"
          amount={(companyStats?.totalCompanies ?? 0).toLocaleString()}
          icon="lucide--building-2"
          showTrend={false}
        />
        <StatItem
          title="已驗證"
          amount={(companyStats?.verifiedCount ?? 0).toLocaleString()}
          icon="lucide--badge-check"
          showTrend={false}
        />
        <StatItem
          title="活躍公司"
          amount={(companyStats?.activeCount ?? 0).toLocaleString()}
          icon="lucide--activity"
          showTrend={false}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">公司類型分佈</h3>
            <DonutChart
              data={{
                '供應商': companyStats?.supplierCount ?? 0,
                '需求方': companyStats?.buyerCount ?? 0,
                '雙向': companyStats?.bothCount ?? 0,
              }}
              height={280}
              colors={['#167bff', '#FDA403', '#8E7AB5']}
            />
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">驗證狀態分佈</h3>
            <DonutChart
              data={{
                '已驗證': companyStats?.verifiedCount ?? 0,
                '未驗證': (companyStats?.totalCompanies ?? 0) - (companyStats?.verifiedCount ?? 0),
              }}
              height={280}
              colors={['#22c55e', '#9ca3af']}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderDemandsTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="需求總數"
          amount={(demandStats?.totalDemands ?? 0).toLocaleString()}
          icon="lucide--megaphone"
          showTrend={false}
        />
        <StatItem
          title="已發布"
          amount={(demandStats?.publishedDemands ?? 0).toLocaleString()}
          icon="lucide--send"
          showTrend={false}
        />
        <StatItem
          title="草稿"
          amount={(demandStats?.draftDemands ?? 0).toLocaleString()}
          icon="lucide--file-edit"
          showTrend={false}
        />
        <StatItem
          title="本月新增"
          amount={(demandStats?.demandsThisMonth ?? 0).toLocaleString()}
          icon="lucide--calendar-plus"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">需求狀態分佈</h3>
          <DonutChart
            data={{
              '已發布': demandStats?.publishedDemands ?? 0,
              '草稿': demandStats?.draftDemands ?? 0,
            }}
            height={300}
            colors={['#22c55e', '#9ca3af']}
          />
        </div>
      </div>
    </div>
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
        title="業務分析"
        items={[
          { label: '分析報表', path: '/analytics' },
          { label: '業務分析', active: true },
        ]}
      />

      {/* Tab 切換 */}
      <div role="tablist" className="tabs tabs-boxed w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            className={`tab gap-2 ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className={`iconify ${tab.icon} size-4`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 內容 */}
      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'applications' && renderApplicationsTab()}
      {activeTab === 'companies' && renderCompaniesTab()}
      {activeTab === 'demands' && renderDemandsTab()}
    </div>
  );
};
