import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { Pagination } from '@/components/common/Pagination';
import { adminApplicationsApi } from '@/lib/api/admin-applications.ts';
import type { Application } from '@/types/api';
import { useNotify } from '@/hooks/useNotify';

export const PendingApplicationsPage = () => {
  const notify = useNotify();
  const [applications, setApplications] = useState<Application[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;

  const fetchApplications = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await adminApplicationsApi.getPendingApplications(page, pageSize);
      setApplications(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch pending applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
   void fetchApplications(1);
  }, []);

  const handleClaim = async (id: string) => {
    try {
      await adminApplicationsApi.claimApplication(id);
      // 重新載入列表
      void fetchApplications(currentPage);
    } catch (error) {
      console.error('Failed to claim application:', error);
      await notify.error('領取申請失敗，請稍後再試');
    }
  };

  return (
    <div className="space-y-6">
      {notify.NotifyComponent}
      <PageTitle
        title="待審核申請"
        items={[
          { label: '申請管理', path: '/applications' },
          { label: '待審核', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">
              <span className="iconify lucide--clock size-6" />
              待審核申請列表
            </h2>
            <div className="badge badge-warning badge-lg">
              {!isLoading && `${applications.length} 筆`}
            </div>
          </div>

          <ApplicationTable
            applications={applications}
            onClaim={handleClaim}
            showActions
            isLoading={isLoading}
          />

          {!isLoading && applications.length > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={fetchApplications}
                isLoading={isLoading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
