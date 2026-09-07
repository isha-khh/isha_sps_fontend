import type { CompanyType, CompanyLevel, Status } from '@/types/company';

interface CompanyTypeBadgeProps {
  type: CompanyType;
}

export const CompanyTypeBadge = ({ type }: CompanyTypeBadgeProps) => {
  const typeConfig: Record<CompanyType, { label: string; className: string }> = {
    1: { label: '供給端', className: 'badge-info' },
    2: { label: '需求端', className: 'badge-warning' },
    3: { label: '供需雙方', className: 'badge-secondary' },
  };

  const config = typeConfig[type] ?? { label: '未設定', className: 'badge-ghost' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};

interface CompanyLevelBadgeProps {
  level: CompanyLevel;
}

export const CompanyLevelBadge = ({ level }: CompanyLevelBadgeProps) => {
  const levelConfig: Record<CompanyLevel, { label: string; className: string; icon: string }> = {
    0: { label: '普通', className: 'badge-ghost', icon: '' },
    1: { label: '銀牌', className: 'badge-neutral', icon: '🥈' },
    2: { label: '金牌', className: 'badge-warning', icon: '🥇' },
    3: { label: '鑽石', className: 'badge-primary', icon: '💎' },
  };

  const config = levelConfig[level];
  return (
    <span className={`badge ${config.className}`}>
      {config.icon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
};

interface CompanyStatusBadgeProps {
  status: Status;
}

export const CompanyStatusBadge = ({ status }: CompanyStatusBadgeProps) => {
  const statusConfig: Record<Status, { label: string; className: string }> = {
    0: { label: '停用', className: 'badge-error' },
    1: { label: '啟用', className: 'badge-success' },
  };

  const config = statusConfig[status];
  return <span className={`badge ${config.className}`}>{config.label}</span>;
};
