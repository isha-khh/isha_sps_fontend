import { COMPANY_LEVEL_LABELS, type CompanyType, type CompanyLevel, type Status } from '@/types/company';

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
  // 卓越/新興只是審查路徑紀錄（見 types/company.ts 的 CompanyLevel 說明），
  // 不是等級高低，所以兩個用中性的同色徽章、不放獎牌類 icon，避免暗示誰比較高級。
  const levelConfig: Record<CompanyLevel, { label: string; className: string }> = {
    0: { label: COMPANY_LEVEL_LABELS[0], className: 'badge-ghost' },
    1: { label: COMPANY_LEVEL_LABELS[1], className: 'badge-info' },
    2: { label: COMPANY_LEVEL_LABELS[2], className: 'badge-info' },
  };

  const config = levelConfig[level] ?? { label: '未設定', className: 'badge-ghost' };
  return <span className={`badge ${config.className}`}>{config.label}</span>;
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
