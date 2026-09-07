import type { ApplicationStatus } from '@/types/api';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  0: { label: '草稿', className: 'badge-ghost' }, // Draft
  1: { label: '待審核', className: 'badge-warning' }, // PendingReview
  2: { label: '審核中', className: 'badge-info' }, // UnderReview
  3: { label: '已通過', className: 'badge-success' }, // Approved
  4: { label: '已退回', className: 'badge-error' }, // Rejected
  6: { label: '已取消', className: 'badge-ghost' }, // Cancelled
};

export const ApplicationStatusBadge = ({ status }: ApplicationStatusBadgeProps) => {
  const config = statusConfig[status];

  return <span className={`badge ${config.className}`}>{config.label}</span>;
};
