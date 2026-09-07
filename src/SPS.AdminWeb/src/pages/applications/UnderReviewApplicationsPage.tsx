import { useEffect, useState } from 'react';
import { PageTitle } from '@/components/PageTitle';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { ReviewModal } from '@/components/applications/ReviewModal';
import { Pagination } from '@/components/common/Pagination';
import { adminApplicationsApi } from '@/lib/api/admin-applications.ts';
import { useAuthStore } from '@/stores/auth-store';
import type { Application } from '@/types/api';

export const UnderReviewApplicationsPage = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const pageSize = 20;

  const fetchApplications = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await adminApplicationsApi.getUnderReviewApplications(page, pageSize);
      setApplications(response.items);
      setTotalPages(response.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Failed to fetch under review applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications(1);
  }, []);

  const handleReview = async (id: string) => {
    const app = applications.find((a) => a.id === id);
    if (app) {
      setSelectedApplication(app);
      setIsReviewModalOpen(true);
    }
  };

  const handleReviewSubmit = async (approved: boolean, reviewComment?: string | undefined, rejectionReason?: string | undefined) => {
    if (!selectedApplication || !user) return;

    await adminApplicationsApi.reviewApplication(selectedApplication.id, {
      applicationId: selectedApplication.id,
      reviewerId: user.id,
      isApproved: approved,
      rejectionReason: !approved ? rejectionReason : undefined,
      reviewComment: approved ?   reviewComment : undefined,
    });

    // 重新載入列表
   void fetchApplications(currentPage);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        title="審核中申請"
        items={[
          { label: '申請管理', path: '/applications' },
          { label: '審核中', active: true },
        ]}
      />

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-between mb-4">
            <h2 className="card-title">
              <span className="iconify lucide--file-search size-6" />
              審核中申請列表
            </h2>
            <div className="badge badge-info badge-lg">
              {!isLoading && `${applications.length} 筆`}
            </div>
          </div>

          <ApplicationTable
            applications={applications}
            onReview={handleReview}
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

      <ReviewModal
        application={selectedApplication}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setSelectedApplication(null);
        }}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
};
