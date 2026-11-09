import type { News } from '@/types/news';
import { DataTable, formatDate } from '@/components/shared/DataTable';
import type { Column } from '@/components/shared/DataTable';
import { useConfirm } from '@/hooks/useConfirm';
import { useState } from 'react';

interface NewsTableProps {
  news: News[];
  isLoading?: boolean;
  onTogglePublish?: (id: number, published: boolean) => void;
  onDelete?: (id: number) => void;
  /** 列表所在路徑（檢視與編輯連結掛在底下），預設是公告 */
  basePath?: string;
  /** 項目名稱（空列表與刪除確認的文字） */
  noun?: string;
  /** 每個項目收到的回應（詢問單）數量，key 是項目編號；有給才顯示「回應數量」欄 */
  responseCounts?: Record<string, number>;
  /** 匯出某個項目的回應；有給才在「⋯」選單出現「匯出回應」 */
  onExportResponses?: (id: number) => void;
  /** 在列表上直接改「熱門課程排序」（人才培育課程）；有給才顯示該欄與鉛筆圖示。`order` 空字串＝移出熱門課程 */
  onUpdatePopularOrder?: (item: News, order: string) => Promise<void>;
}

/**
 * 「熱門課程排序」欄：顯示目前的數字（沒填＝不列入前台熱門課程），點鉛筆就地改，Enter 或打勾儲存、Esc 或打叉取消。
 * 數字越小越前面；清空後儲存＝移出熱門課程。
 */
const PopularOrderCell = ({ item, onSave }: { item: News; onSave: (item: News, order: string) => Promise<void> }) => {
  const current = item.meta?.popularOrder ?? '';
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setValue(current);
    setEditing(true);
  };
  const save = async () => {
    const next = value.trim();
    if (next === current) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await onSave(item, next);
      setEditing(false);
    } catch {
      // 失敗原因已由呼叫端顯示，留在編輯狀態讓使用者修正
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-center justify-center gap-2">
        {current ? <span className="badge badge-sm badge-warning font-medium">熱門 {current}</span> : <span className="text-base-content/50">-</span>}
        <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={start} aria-label={`編輯「${item.title}」的熱門課程排序`} title="編輯熱門課程排序">
          <span className="iconify lucide--pencil size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        min={0}
        max={9999}
        step={1}
        autoFocus
        className="input input-bordered input-sm w-20"
        placeholder="空白＝不列入"
        aria-label="熱門課程排序"
        value={value}
        disabled={saving}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
      <button type="button" className="btn btn-success btn-xs btn-square" onClick={() => void save()} disabled={saving} aria-label="儲存" title="儲存">
        {saving ? <span className="loading loading-spinner loading-xs" /> : <span className="iconify lucide--check size-4" />}
      </button>
      <button type="button" className="btn btn-ghost btn-xs btn-square" onClick={() => setEditing(false)} disabled={saving} aria-label="取消" title="取消">
        <span className="iconify lucide--x size-4" />
      </button>
    </div>
  );
};

export const NewsTable = ({ news, isLoading, onTogglePublish, onDelete, basePath = '/announcements', noun = '公告', responseCounts, onExportResponses, onUpdatePopularOrder }: NewsTableProps) => {
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
    ...(responseCounts
      ? [
          {
            key: 'responseCount',
            title: '回應數量',
            className: 'text-center',
            render: (item: News) => (
              <div className="flex items-center justify-center gap-1">
                <span className="iconify lucide--inbox size-4 text-base-content/50" />
                <span className="font-medium">{(responseCounts[String(item.id)] ?? 0).toLocaleString()}</span>
              </div>
            ),
          } as Column<News>,
        ]
      : []),
    ...(onUpdatePopularOrder
      ? [
          {
            key: 'popularOrder',
            title: '熱門課程排序',
            className: 'text-center',
            render: (item: News) => <PopularOrderCell item={item} onSave={onUpdatePopularOrder} />,
          } as Column<News>,
        ]
      : []),
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
        emptyMessage={`沒有找到${noun}資料`}
        confirmDialog={confirmDialog}
        primaryActions={[
          {
            label: '查看',
            icon: 'lucide--eye',
            to: (item) => `${basePath}/${item.id}`,
          },
        ]}
        dropdownActions={[
          {
            label: '編輯',
            icon: 'lucide--edit',
            to: (item) => `${basePath}/${item.id}/edit`,
          },
          ...(onExportResponses
            ? [
                {
                  label: '匯出回應（Excel）',
                  icon: 'lucide--download',
                  onClick: (item: News) => onExportResponses(item.id),
                },
              ]
            : []),
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
