import { type ReactNode } from 'react';

interface ListToolbarProps {
  // 搜尋相關
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;

  // 統計資訊
  totalCount?: number;
  isLoading?: boolean;

  // 操作按鈕區域
  actions?: ReactNode;

  // 篩選器區域
  filters?: ReactNode;

  // 是否顯示清除篩選按鈕
  showClearFilter?: boolean;
  onClearFilter?: () => void;
}

export const ListToolbar = ({
  searchPlaceholder = '搜尋...',
  searchValue,
  onSearchChange,
  onSearch,
  totalCount,
  isLoading = false,
  actions,
  filters,
  showClearFilter = false,
  onClearFilter,
}: ListToolbarProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* 搜尋和操作區 */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* 搜尋框 */}
        <div className="flex gap-2 flex-1 min-w-[300px]">
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="input input-bordered flex-1"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button onClick={onSearch} className="btn btn-primary">
            <span className="iconify lucide--search size-5" />
            搜尋
          </button>
        </div>

        {/* 操作按鈕 */}
        {actions}

        {/* 統計數字 */}
        {totalCount !== undefined && (
          <div className="badge badge-lg badge-primary">
            {isLoading ? '載入中...' : `共 ${totalCount} 筆`}
          </div>
        )}
      </div>

      {/* 篩選條件 */}
      {(filters || showClearFilter) && (
        <div className="flex flex-wrap gap-3 items-center">
          {filters}

          {showClearFilter && onClearFilter && (
            <button onClick={onClearFilter} className="btn btn-ghost btn-sm">
              <span className="iconify lucide--x size-4" />
              清除篩選
            </button>
          )}
        </div>
      )}
    </div>
  );
};
