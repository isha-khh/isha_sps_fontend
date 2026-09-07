import type { MouStatusType } from '@/types/mou';
import { MouStatus } from '@/types/mou';

interface MouStatusBadgeProps {
  status: MouStatusType;
  size?: 'sm' | 'md' | 'lg';
}

export const MouStatusBadge = ({ status, size = 'md' }: MouStatusBadgeProps) => {
  const sizeClass = size === 'sm' ? 'badge-sm' : size === 'lg' ? 'badge-lg' : '';

  switch (status) {
    case MouStatus.Draft:
      return (
        <span className={`badge badge-warning gap-2 ${sizeClass}`}>
          <span className="iconify lucide--file-edit size-3" />
          草稿
        </span>
      );
    case MouStatus.Active:
      return (
        <span className={`badge badge-success gap-2 ${sizeClass}`}>
          <span className="iconify lucide--check-circle size-3" />
          有效
        </span>
      );
    case MouStatus.Expired:
      return (
        <span className={`badge badge-error gap-2 ${sizeClass}`}>
          <span className="iconify lucide--calendar-x size-3" />
          已過期
        </span>
      );
    case MouStatus.Terminated:
      return (
        <span className={`badge badge-neutral gap-2 ${sizeClass}`}>
          <span className="iconify lucide--x-circle size-3" />
          已終止
        </span>
      );
    default:
      return <span className={`badge ${sizeClass}`}>未知</span>;
  }
};
