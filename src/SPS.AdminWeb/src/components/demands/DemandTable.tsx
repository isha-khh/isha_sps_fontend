import type { Demand } from '@/types/demand';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { useConfirm } from '@/hooks/useConfirm';

interface DemandTableProps {
  demands: Demand[];
  isLoading?: boolean;
  onTogglePublish?: (id: string, published: boolean) => void;
  onDelete?: (id: string) => void;
}

export const DemandTable = ({ demands, isLoading, onTogglePublish, onDelete }: DemandTableProps) => {
  const { confirmDialog, ConfirmComponent } = useConfirm();

  const columns: Column<Demand>[] = [
    {
      key: 'name',
      title: '需求名稱',
      render: (demand) => (
        <div>
          <div className="font-semibold">{demand.name}</div>
          {demand.introduction && (
            <div className="text-sm text-base-content/60 line-clamp-2 max-w-md">
              {demand.introduction}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'companyName',
      title: '發布公司',
      render: (demand) =>
        demand.companyName ? (
          <div className="flex items-center gap-1">
            <span className="iconify lucide--building-2 size-4" />
            {demand.companyName}
          </div>
        ) : (
          <span className="text-base-content/50">-</span>
        ),
    },
    {
      key: 'createdByName',
      title: '發布人',
      render: (demand) => demand.createdByName || '-',
    },
    {
      key: 'published',
      title: '狀態',
      render: (demand) =>
        demand.published ? (
          <span className="badge badge-success">
            <span className="iconify lucide--eye size-3 mr-1" />
            已發布
          </span>
        ) : (
          <span className="badge badge-warning">
            <span className="iconify lucide--eye-off size-3 mr-1" />
            草稿
          </span>
        ),
    },
    {
      key: 'createdAt',
      title: '建立時間',
      className: 'text-sm text-base-content/70',
      render: (demand) => formatDate(demand.createdAt),
    },
  ];

  return (
    <>
      <DataTable
        data={demands}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        emptyIcon="lucide--megaphone"
        emptyMessage="沒有找到需求資料"
        confirmDialog={confirmDialog}
        primaryActions={[
          {
            label: '查看',
            icon: 'lucide--eye',
            to: (demand) => `/demands/${demand.id}`,
          },
        ]}
        dropdownActions={[
          {
            label: '編輯',
            icon: 'lucide--edit',
            to: (demand) => `/demands/${demand.id}/edit`,
          },
          ...(onTogglePublish
            ? [
                {
                  label: (demand: Demand) => (demand.published ? '取消發布' : '發布'),
                  icon: (demand: Demand) => (demand.published ? 'lucide--eye-off' : 'lucide--eye'),
                  onClick: (demand: Demand) => onTogglePublish(demand.id, !demand.published),
                },
              ]
            : []),
          ...(onDelete
            ? [
                {
                  label: '刪除',
                  icon: 'lucide--trash-2',
                  onClick: (demand: Demand) => onDelete(demand.id),
                  className: 'text-error',
                  divider: true,
                  confirm: (demand: Demand) => `確定要刪除「${demand.name}」嗎？`,
                },
              ]
            : []),
        ]}
      />
      {ConfirmComponent}
    </>
  );
};
