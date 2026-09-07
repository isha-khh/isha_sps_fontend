import type { Mou } from '@/types/mou';
import { MouStatusBadge } from './MouStatusBadge';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { useConfirm } from '@/hooks/useConfirm';

interface MouTableProps {
  mous: Mou[];
  isLoading?: boolean;
  onDelete?: (id: number) => void;
}

// 計算剩餘天數
const getDaysRemaining = (endDate?: string) => {
  if (!endDate) return null;
  const days = Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return null;
  if (days <= 30) {
    return <span className="text-error text-xs">還有 {days} 天到期</span>;
  }
  if (days <= 90) {
    return <span className="text-warning text-xs">還有 {days} 天到期</span>;
  }
  return null;
};

export const MouTable = ({ mous, isLoading, onDelete }: MouTableProps) => {
  const { confirmDialog, ConfirmComponent } = useConfirm();

  const columns: Column<Mou>[] = [
    {
      key: 'title',
      title: '備忘錄標題',
      render: (mou) => (
        <div>
          <div className="font-semibold">{mou.title}</div>
          {mou.description && (
            <div className="text-sm text-base-content/60 line-clamp-1 max-w-md">
              {mou.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'companyName',
      title: '簽署公司',
      className: 'font-medium',
    },
    {
      key: 'signDate',
      title: '簽署日期',
      className: 'text-sm text-base-content/70',
      render: (mou) => formatDate(mou.signDate),
    },
    {
      key: 'startDate',
      title: '有效期限',
      className: 'text-sm text-base-content/70',
      render: (mou) => (
        <div>
          <div>{formatDate(mou.startDate)}</div>
          {mou.endDate && (
            <div className="text-xs text-base-content/50">至 {formatDate(mou.endDate)}</div>
          )}
          {getDaysRemaining(mou.endDate)}
        </div>
      ),
    },
    {
      key: 'status',
      title: '狀態',
      render: (mou) => <MouStatusBadge status={mou.status} />,
    },
  ];

  return (
    <>
      <DataTable
        data={mous}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        emptyIcon="lucide--file-text"
        emptyMessage="沒有找到備忘錄資料"
        confirmDialog={confirmDialog}
        primaryActions={[
          {
            label: '查看',
            icon: 'lucide--eye',
            to: (mou) => `/mou/${mou.id}`,
          },
        ]}
        dropdownActions={[
          {
            label: '編輯',
            icon: 'lucide--edit',
            to: (mou) => `/mou/${mou.id}/edit`,
          },
          ...(onDelete
            ? [
                {
                  label: '刪除',
                  icon: 'lucide--trash-2',
                  onClick: (mou: Mou) => onDelete(mou.id),
                  className: 'text-error',
                  divider: true,
                  confirm: '確定要刪除此備忘錄嗎？',
                },
              ]
            : []),
        ]}
      />
      {ConfirmComponent}
    </>
  );
};
