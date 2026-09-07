import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { Pagination } from '@/components/common/Pagination';
import { adminApplicationsApi } from '@/lib/api/admin-applications.ts';
import type { Application } from '@/types/api';

export const CompletedApplicationsPage = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const pageSize = 20;

  const fetchApplications = async (page: number, status?: string) => {
    setIsLoading(true);
    try {
      const response = await adminApplicationsApi.getCompletedApplications(page, pageSize, status);
      setApplications(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch completed applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications(1, statusFilter);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <PageTitle
        title="已完成申請"
        items={[
          { label: '申請管理', path: '/applications' },
          { label: '已完成', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">
              <span className="iconify lucide--check-circle-2 size-6" />
              已完成申請列表
            </h2>
            <div className="flex items-center gap-2">
              <select
                className="select select-bordered select-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">全部狀態</option>
                <option value="Approved">已通過</option>
                <option value="Rejected">已退回</option>
              </select>
              <div className="badge badge-success badge-lg">
                {!isLoading && `${applications.length} 筆`}
              </div>
            </div>
          </div>

          <ApplicationTable
            applications={applications}
            isLoading={isLoading}
            showReviewer
          />

          {!isLoading && applications.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => fetchApplications(page, statusFilter)}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
