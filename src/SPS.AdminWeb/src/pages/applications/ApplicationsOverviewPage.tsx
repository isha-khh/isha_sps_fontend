import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageTitle } from '@/components/PageTitle';
import { adminApplicationsApi } from '@/lib/api/admin-applications.ts';
import type { ApplicationStatistics } from '@/types/api';

export const ApplicationsOverviewPage = () => {
  const [statistics, setStatistics] = useState<ApplicationStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true);
      try {
        const data = await adminApplicationsApi.getStatistics();
        setStatistics(data);
      } catch (error) {
        console.error('Failed to fetch statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatistics();
  }, []);

  if (isLoading || !statistics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="申請管理總覽"
        items={[{ label: '申請管理', active: true }]}
      />

      {/* 統計卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/applications/pending" className="stats shadow hover:shadow-lg transition-shadow">
          <div className="stat">
            <div className="stat-figure text-warning">
              <span className="iconify lucide--clock size-8" />
            </div>
            <div className="stat-title">待審核</div>
            <div className="stat-value text-warning">{statistics.pendingReview}</div>
            <div className="stat-desc">等待領取審核</div>
          </div>
        </Link>

        <Link to="/applications/under-review" className="stats shadow hover:shadow-lg transition-shadow">
          <div className="stat">
            <div className="stat-figure text-info">
              <span className="iconify lucide--file-search size-8" />
            </div>
            <div className="stat-title">審核中</div>
            <div className="stat-value text-info">{statistics.underReview}</div>
            <div className="stat-desc">正在審核處理</div>
          </div>
        </Link>

        <Link to="/applications/completed?status=Approved" className="stats shadow hover:shadow-lg transition-shadow">
          <div className="stat">
            <div className="stat-figure text-success">
              <span className="iconify lucide--check-circle size-8" />
            </div>
            <div className="stat-title">已通過</div>
            <div className="stat-value text-success">{statistics.approved}</div>
            <div className="stat-desc">審核通過</div>
          </div>
        </Link>

        <Link to="/applications/completed?status=Rejected" className="stats shadow hover:shadow-lg transition-shadow">
          <div className="stat">
            <div className="stat-figure text-error">
              <span className="iconify lucide--x-circle size-8" />
            </div>
            <div className="stat-title">已退回</div>
            <div className="stat-value text-error">{statistics.rejected}</div>
            <div className="stat-desc">審核退回</div>
          </div>
        </Link>
      </div>

      {/* 快速操作 */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">快速操作</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/applications/pending"
              className="btn btn-outline btn-warning justify-start h-auto py-4"
            >
              <span className="iconify lucide--clock size-6" />
              <div className="text-left">
                <div className="font-bold">查看待審核</div>
                <div className="text-sm opacity-70">領取並開始審核</div>
              </div>
            </Link>

            <Link
              to="/applications/under-review"
              className="btn btn-outline btn-info justify-start h-auto py-4"
            >
              <span className="iconify lucide--file-search size-6" />
              <div className="text-left">
                <div className="font-bold">我的審核</div>
                <div className="text-sm opacity-70">查看審核中的申請</div>
              </div>
            </Link>

            <Link
              to="/applications/completed"
              className="btn btn-outline btn-success justify-start h-auto py-4"
            >
              <span className="iconify lucide--archive size-6" />
              <div className="text-left">
                <div className="font-bold">歷史記錄</div>
                <div className="text-sm opacity-70">查看已完成的申請</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* 說明 */}
      <div className="alert alert-info">
        <span className="iconify lucide--info size-5" />
        <div>
          <h3 className="font-bold">申請審核流程</h3>
          <div className="text-sm mt-1">
            1. 從「待審核」列表中領取申請 → 2. 申請進入「審核中」狀態 → 3. 完成審核後，申請移至「已完成」
          </div>
        </div>
      </div>
    </div>
  );
};
