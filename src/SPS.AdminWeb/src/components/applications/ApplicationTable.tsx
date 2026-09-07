import { Link } from 'react-router-dom';
import type { Application } from '@/types/api';
import { ApplicationStatus } from '@/types/api';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';

interface ApplicationTableProps {
  applications: Application[];
  onClaim?: (id: string) => void;
  onReview?: (id: string) => void;
  showActions?: boolean;
  showReviewer?: boolean;
  isLoading?: boolean;
}

export const ApplicationTable = ({
  applications,
  onClaim,
  onReview,
  showActions = false,
  showReviewer = false,
  isLoading = false,
}: ApplicationTableProps) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
        <span className="iconify lucide--inbox size-16 mb-4" />
        <p>暫無申請記錄</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>申請編號</th>
            <th>公司名稱</th>
            <th>聯絡人</th>
            <th>聯絡電話</th>
            <th>狀態</th>
            <th>提交時間</th>
            {showReviewer && <th>審核人</th>}
            {showReviewer && <th>審核時間</th>}
            {showActions && <th>操作</th>}
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id} className="hover">
              <td>
                <Link to={`/applications/${app.id}`} className="link link-primary">
                  {app.applicationNumber}
                </Link>
              </td>
              <td>{app.companyName}</td>
              <td>{app.contactName}</td>
              <td>{app.phone}</td>
              <td>
                <ApplicationStatusBadge status={app.status} />
              </td>
              <td className="text-sm">{formatDate(app.submittedAt)}</td>
              {showReviewer && <td>{app.reviewerName || '-'}</td>}
              {showReviewer && <td className="text-sm">{formatDate(app.reviewedAt)}</td>}
              {showActions && (
                <td>
                  <div className="flex gap-2">
                    {app.status === ApplicationStatus.PendingReview && onClaim && (
                      <button
                        onClick={() => onClaim(app.id)}
                        className="btn btn-primary btn-sm"
                      >
                        <span className="iconify lucide--hand size-4" />
                        領取
                      </button>
                    )}
                    {app.status === ApplicationStatus.UnderReview && onReview && (
                      <button
                        onClick={() => onReview(app.id)}
                        className="btn btn-success btn-sm"
                      >
                        <span className="iconify lucide--check-circle size-4" />
                        審核
                      </button>
                    )}
                    <Link
                      to={`/applications/${app.id}`}
                      className="btn btn-ghost btn-sm"
                    >
                      <span className="iconify lucide--eye size-4" />
                      查看
                    </Link>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
