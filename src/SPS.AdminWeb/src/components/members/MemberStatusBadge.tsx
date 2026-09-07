import { MemberStatus } from '@/types/member';

interface MemberStatusBadgeProps {
  status: MemberStatus;
}

export const MemberStatusBadge = ({ status }: MemberStatusBadgeProps) => {
  const statusConfig: Record<MemberStatus, { label: string; className: string }> = {
    [MemberStatus.Active]: { label: '啟用', className: 'badge-success' },
    [MemberStatus.Inactive]: { label: '未啟用', className: 'badge-warning' },
    [MemberStatus.Suspended]: { label: '停用', className: 'badge-error' },
    [MemberStatus.Locked]: { label: '鎖定', className: 'badge-error' },
    [MemberStatus.PendingApproval]: { label: '待審核', className: 'badge-info' },
    [MemberStatus.Approved]: { label: '已審核', className: 'badge-success' },
    [MemberStatus.Rejected]: { label: '已拒絕', className: 'badge-error' },
  };

  const config = statusConfig[status] || { label: '未知', className: 'badge-ghost' };

  return <span className={`badge badge-sm whitespace-nowrap ${config.className}`}>{config.label}</span>;
};
