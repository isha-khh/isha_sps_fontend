import type { News } from '@/types/news';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { useConfirm } from '@/hooks/useConfirm';

interface NewsTableProps {
  news: News[];
  isLoading?: boolean;
  onTogglePublish?: (id: number, published: boolean) => void;
  onDelete?: (id: number) => void;
}

export const NewsTable = ({ news, isLoading, onTogglePublish, onDelete }: NewsTableProps) => {
  const { confirmDialog, ConfirmComponent } = useConfirm();

  const columns: Column<News>[] = [
    {
      key: 'title',
      title: '標題',
      render: (item) => (
        <div>
          <div className="font-semibold">{item.title}</div>
          {item.introduction && (
            <div className="text-sm text-base-content/60 line-clamp-1 max-w-md">
              {item.introduction}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'categoryName',
      title: '分類',
      render: (item) =>
        item.categoryName ? (
          <span className="badge badge-sm badge-outline whitespace-nowrap">{item.categoryName}</span>
        ) : (
          <span className="text-base-content/50">未分類</span>
        ),
    },
    {
      key: 'tags',
      title: '標籤',
      render: (item) =>
        item.tags && item.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.tags.map((tag, index) => (
              <span key={index} className="badge badge-sm badge-ghost">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-base-content/50">-</span>
        ),
    },
    {
      key: 'startDate',
      title: '發布日期',
      className: 'text-sm text-base-content/70',
      render: (item) => (
        <div>
          {formatDate(item.startDate)}
          {item.endDate && (
            <div className="text-xs text-base-content/50">至 {formatDate(item.endDate)}</div>
          )}
        </div>
      ),
    },
    {
      key: 'viewCount',
      title: '瀏覽次數',
      className: 'text-center',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <span className="iconify lucide--bar-chart-2 size-4 text-base-content/50" />
          <span className="font-medium">{item.viewCount?.toLocaleString() ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'published',
      title: '狀態',
      render: (item) =>
        item.published ? (
          <span className="badge badge-sm badge-success whitespace-nowrap">
            <span className="iconify lucide--eye size-3 mr-1" />
            已發布
          </span>
        ) : (
          <span className="badge badge-sm badge-warning whitespace-nowrap">
            <span className="iconify lucide--eye-off size-3 mr-1" />
            草稿
          </span>
        ),
    },
  ];

  return (
    <>
      <DataTable
        data={news}
        columns={columns}
        keyField="id"
        isLoading={isLoading}
        emptyIcon="lucide--newspaper"
        emptyMessage="沒有找到公告資料"
        confirmDialog={confirmDialog}
        primaryActions={[
          {
            label: '查看',
            icon: 'lucide--eye',
            to: (item) => `/announcements/${item.id}`,
          },
        ]}
        dropdownActions={[
          {
            label: '編輯',
            icon: 'lucide--edit',
            to: (item) => `/announcements/${item.id}/edit`,
          },
          ...(onTogglePublish
            ? [
                {
                  label: (item: News) => (item.published ? '取消發布' : '發布'),
                  icon: (item: News) => (item.published ? 'lucide--eye-off' : 'lucide--eye'),
                  onClick: (item: News) => onTogglePublish(item.id, !item.published),
                },
              ]
            : []),
          ...(onDelete
            ? [
                {
                  label: '刪除',
                  icon: 'lucide--trash-2',
                  onClick: (item: News) => onDelete(item.id),
                  className: 'text-error',
                  divider: true,
                  confirm: '確定要刪除此公告嗎？',
                },
              ]
            : []),
        ]}
      />
      {ConfirmComponent}
    </>
  );
};
