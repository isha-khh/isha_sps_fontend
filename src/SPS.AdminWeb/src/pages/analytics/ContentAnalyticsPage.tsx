import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { StatItem, DonutChart } from '@/components/analytics';
import { newsApi } from '@/lib/api/news';
import { filesManagementApi } from '@/lib/api/files-management';
import { mouApi } from '@/lib/api/mou';
import { successCasesApi } from '@/lib/api/success-cases';

type TabType = 'announcements' | 'successCases' | 'files' | 'mou';

interface NewsStats {
  totalNews: number;
  published: number;
  draft: number;
  scheduled: number;
  todayPublished: number;
  thisMonthPublished: number;
  totalViews: number;
}

interface SuccessCaseStats {
  totalCases: number;
  publishedCases: number;
  draftCases: number;
  totalViews: number;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  formattedTotalSize: string;
  usagePercentage: number;
  recycleBinCount: number;
  fileTypeDistribution: {
    images: number;
    videos: number;
    documents: number;
    others: number;
  };
}

interface MouStats {
  totalMous: number;
  activeMous: number;
  expiredMous: number;
  draftMous: number;
}

export const ContentAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>('announcements');
  const [isLoading, setIsLoading] = useState(true);

  const [newsStats, setNewsStats] = useState<NewsStats | null>(null);
  const [successCaseStats, setSuccessCaseStats] = useState<SuccessCaseStats | null>(null);
  const [fileStats, setFileStats] = useState<FileStats | null>(null);
  const [mouStats, setMouStats] = useState<MouStats | null>(null);

  useEffect(() => {
    const fetchAllStats = async () => {
      setIsLoading(true);
      try {
        const [news, successCases, files, mou] = await Promise.all([
          newsApi.getStatistics().catch(() => ({
            totalNews: 0,
            published: 0,
            draft: 0,
            scheduled: 0,
            todayPublished: 0,
            thisMonthPublished: 0,
            totalViews: 0,
          })),
          successCasesApi.getStatistics().catch(() => ({
            totalCases: 0,
            publishedCases: 0,
            draftCases: 0,
            totalViews: 0,
          })),
          filesManagementApi.getStatistics().catch(() => ({
            totalFiles: 0,
            totalSize: 0,
            formattedTotalSize: '0 B',
            usagePercentage: 0,
            recycleBinCount: 0,
            fileTypeDistribution: {
              images: 0,
              videos: 0,
              documents: 0,
              others: 0,
            },
          })),
          mouApi.getStatistics().catch(() => ({
            totalMous: 0,
            activeMous: 0,
            expiredMous: 0,
            draftMous: 0,
          })),
        ]);

        setNewsStats(news as NewsStats);
        setSuccessCaseStats(successCases as SuccessCaseStats);
        setFileStats(files as FileStats);
        setMouStats(mou as MouStats);
      } catch (error) {
        console.error('Failed to fetch content stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAllStats();
  }, []);

  const tabs = [
    { id: 'announcements' as const, label: '公告', icon: 'lucide--megaphone' },
    { id: 'successCases' as const, label: '成功案例', icon: 'lucide--trophy' },
    { id: 'files' as const, label: '檔案', icon: 'lucide--folder' },
    { id: 'mou' as const, label: 'MOU', icon: 'lucide--file-text' },
  ];

  const renderAnnouncementsTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="公告總數"
          amount={(newsStats?.totalNews ?? 0).toLocaleString()}
          icon="lucide--megaphone"
          showTrend={false}
        />
        <StatItem
          title="已發布"
          amount={(newsStats?.published ?? 0).toLocaleString()}
          icon="lucide--send"
          showTrend={false}
        />
        <StatItem
          title="草稿"
          amount={(newsStats?.draft ?? 0).toLocaleString()}
          icon="lucide--file-edit"
          showTrend={false}
        />
        <StatItem
          title="本月新增"
          amount={(newsStats?.thisMonthPublished ?? 0).toLocaleString()}
          icon="lucide--calendar-plus"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">公告發布狀態</h3>
          <DonutChart
            data={{
              '已發布': newsStats?.published ?? 0,
              '草稿': newsStats?.draft ?? 0,
              '排程中': newsStats?.scheduled ?? 0,
            }}
            height={300}
            colors={['#22c55e', '#9ca3af', '#167bff']}
          />
        </div>
      </div>
    </div>
  );

  const renderSuccessCasesTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="案例總數"
          amount={(successCaseStats?.totalCases ?? 0).toLocaleString()}
          icon="lucide--trophy"
          showTrend={false}
        />
        <StatItem
          title="已發布"
          amount={(successCaseStats?.publishedCases ?? 0).toLocaleString()}
          icon="lucide--check-circle"
          showTrend={false}
        />
        <StatItem
          title="草稿"
          amount={(successCaseStats?.draftCases ?? 0).toLocaleString()}
          icon="lucide--file-edit"
          showTrend={false}
        />
        <StatItem
          title="總瀏覽數"
          amount={(successCaseStats?.totalViews ?? 0).toLocaleString()}
          icon="lucide--eye"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">成功案例發布狀態</h3>
          <DonutChart
            data={{
              '已發布': successCaseStats?.publishedCases ?? 0,
              '草稿': successCaseStats?.draftCases ?? 0,
            }}
            height={300}
            colors={['#22c55e', '#9ca3af']}
          />
        </div>
      </div>
    </div>
  );

  const renderFilesTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="檔案總數"
          amount={(fileStats?.totalFiles ?? 0).toLocaleString()}
          icon="lucide--folder"
          showTrend={false}
        />
        <StatItem
          title="總容量"
          amount={fileStats?.formattedTotalSize ?? '0 B'}
          icon="lucide--hard-drive"
          showTrend={false}
        />
        <StatItem
          title="使用率"
          amount={`${(fileStats?.usagePercentage ?? 0).toFixed(1)}%`}
          icon="lucide--pie-chart"
          showTrend={false}
        />
        <StatItem
          title="回收站"
          amount={(fileStats?.recycleBinCount ?? 0).toLocaleString()}
          icon="lucide--trash-2"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">檔案類型分佈</h3>
          <DonutChart
            data={{
              '圖片': fileStats?.fileTypeDistribution.images ?? 0,
              '影片': fileStats?.fileTypeDistribution.videos ?? 0,
              '文件': fileStats?.fileTypeDistribution.documents ?? 0,
              '其他': fileStats?.fileTypeDistribution.others ?? 0,
            }}
            height={300}
            colors={['#167bff', '#FDA403', '#22c55e', '#9ca3af']}
          />
        </div>
      </div>
    </div>
  );

  const renderMouTab = () => (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatItem
          title="MOU 總數"
          amount={(mouStats?.totalMous ?? 0).toLocaleString()}
          icon="lucide--file-text"
          showTrend={false}
        />
        <StatItem
          title="有效中"
          amount={(mouStats?.activeMous ?? 0).toLocaleString()}
          icon="lucide--check-circle"
          showTrend={false}
        />
        <StatItem
          title="已過期"
          amount={(mouStats?.expiredMous ?? 0).toLocaleString()}
          icon="lucide--clock"
          showTrend={false}
        />
        <StatItem
          title="草稿"
          amount={(mouStats?.draftMous ?? 0).toLocaleString()}
          icon="lucide--file-edit"
          showTrend={false}
        />
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title text-base">MOU 狀態分佈</h3>
          <DonutChart
            data={{
              '有效中': mouStats?.activeMous ?? 0,
              '已過期': mouStats?.expiredMous ?? 0,
              '草稿': mouStats?.draftMous ?? 0,
            }}
            height={300}
            colors={['#22c55e', '#ef4444', '#9ca3af']}
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
        title="內容分析"
        items={[
          { label: '分析報表', path: '/analytics' },
          { label: '內容分析', active: true },
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
      {activeTab === 'announcements' && renderAnnouncementsTab()}
      {activeTab === 'successCases' && renderSuccessCasesTab()}
      {activeTab === 'files' && renderFilesTab()}
      {activeTab === 'mou' && renderMouTab()}
    </div>
  );
};
