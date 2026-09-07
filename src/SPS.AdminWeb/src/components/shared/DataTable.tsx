import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

// 欄位定義
export type Column<T> = {
  key: string;
  title: ReactNode;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
};

// 操作按鈕定義
export type ActionButton<T> = {
  label: string | ((item: T) => string);
  icon?: string | ((item: T) => string);
  onClick?: (item: T) => void;
  to?: string | ((item: T) => string);
  className?: string | ((item: T) => string);
  show?: (item: T) => boolean;
  divider?: boolean; // 在此項目前加分隔線
  confirm?: string | ((item: T) => string); // 確認訊息
};

// 主要操作（直接顯示的按鈕）
export type PrimaryAction<T> = {
  label: string | ((item: T) => string);
  icon?: string | ((item: T) => string);
  onClick?: (item: T) => void;
  to?: string | ((item: T) => string);
  className?: string | ((item: T) => string);
  show?: (item: T) => boolean;
};

// 確認對話框選項
export type ConfirmOptions = {
  cardTitle?: string;
  message?: string;
  buttonConfirm?: string;
  confirmStyle?: string;
  buttonCancel?: string;
  cancelStyle?: string;
};

// 確認對話框函數類型
export type ConfirmDialogFn = (opts?: ConfirmOptions) => Promise<boolean>;

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T;
  isLoading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
  // 操作欄
  primaryActions?: PrimaryAction<T>[];  // 直接顯示的按鈕
  dropdownActions?: ActionButton<T>[];  // dropdown 選單內的按鈕
  actionsTitle?: string;
  // 樣式
  striped?: boolean;
  compact?: boolean;
  className?: string;
  // 確認對話框（可選，若不提供則使用原生 confirm）
  confirmDialog?: ConfirmDialogFn;
}

export function DataTable<T>({
  data,
  columns,
  keyField,
  isLoading = false,
  emptyIcon = 'lucide--inbox',
  emptyMessage = '沒有找到資料',
  primaryActions,
  dropdownActions,
  actionsTitle = '操作',
  striped = true,
  compact = false,
  className = '',
  confirmDialog,
}: DataTableProps<T>) {
  // Loading 狀態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  // 空資料狀態
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-base-content/60">
        <span className={`iconify ${emptyIcon} size-16 mb-4`} />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  const hasActions = (primaryActions && primaryActions.length > 0) || (dropdownActions && dropdownActions.length > 0);

  return (
    <div className={className}>
      <table className={`table ${striped ? 'table-zebra' : ''} ${compact ? 'table-sm' : ''}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className={col.className}>
                {col.title}
              </th>
            ))}
            {hasActions && <th>{actionsTitle}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={String(item[keyField])}>
              {columns.map((col) => (
                <td key={col.key} className={col.className}>
                  {col.render ? col.render(item, index) : String((item as Record<string, unknown>)[col.key] ?? '-')}
                </td>
              ))}
              {hasActions && (
                <td>
                  <ActionCell
                    item={item}
                    primaryActions={primaryActions}
                    dropdownActions={dropdownActions}
                    confirmDialog={confirmDialog}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 解析動態值
function resolve<T, V>(value: V | ((item: T) => V) | undefined, item: T): V | undefined {
  if (typeof value === 'function') {
    return (value as (item: T) => V)(item);
  }
  return value;
}

// 操作欄組件
function ActionCell<T>({
  item,
  primaryActions,
  dropdownActions,
  confirmDialog,
}: {
  item: T;
  primaryActions?: PrimaryAction<T>[];
  dropdownActions?: ActionButton<T>[];
  confirmDialog?: ConfirmDialogFn;
}) {
  const visiblePrimaryActions = primaryActions?.filter((action) => !action.show || action.show(item)) ?? [];
  const visibleDropdownActions = dropdownActions?.filter((action) => !action.show || action.show(item)) ?? [];

  return (
    <div className="flex gap-2">
      {/* 主要操作按鈕 */}
      {visiblePrimaryActions.map((action, idx) => {
        const label = resolve(action.label, item);
        const icon = resolve(action.icon, item);
        const className = resolve(action.className, item) ?? '';

        const content = (
          <>
            {icon && <span className={`iconify ${icon} size-4`} />}
            {label}
          </>
        );

        if (action.to) {
          const href = resolve(action.to, item) ?? '';
          return (
            <Link
              key={idx}
              to={href}
              className={`btn btn-ghost btn-sm ${className}`}
            >
              {content}
            </Link>
          );
        }

        return (
          <button
            key={idx}
            className={`btn btn-ghost btn-sm ${className}`}
            onClick={() => action.onClick?.(item)}
          >
            {content}
          </button>
        );
      })}

      {/* Dropdown 選單 */}
      {visibleDropdownActions.length > 0 && (
        <div className="dropdown dropdown-bottom dropdown-end">
          <label tabIndex={0} className="btn btn-ghost btn-sm">
            <span className="iconify lucide--more-vertical size-4" />
          </label>
          <ul
            tabIndex={0}
            className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-48"
          >
            {visibleDropdownActions.map((action, idx) => (
              <li key={idx} className={action.divider ? 'border-t border-base-300 mt-1 pt-1' : ''}>
                <ActionItem item={item} action={action} confirmDialog={confirmDialog} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Dropdown 選單項目
function ActionItem<T>({
  item,
  action,
  confirmDialog,
}: {
  item: T;
  action: ActionButton<T>;
  confirmDialog?: ConfirmDialogFn;
}) {
  const label = resolve(action.label, item);
  const icon = resolve(action.icon, item);
  const className = resolve(action.className, item);
  const confirmMsg = resolve(action.confirm, item);

  const content = (
    <>
      {icon && <span className={`iconify ${icon} size-4`} />}
      {label}
    </>
  );

  const handleClick = async () => {
    if (confirmMsg) {
      // 使用自定義確認對話框或原生 confirm
      const confirmed = confirmDialog
        ? await confirmDialog({
            cardTitle: '確認操作',
            message: confirmMsg,
            buttonConfirm: '確認',
            buttonCancel: '取消',
            confirmStyle: 'bg-error',
          })
        : confirm(confirmMsg);

      if (confirmed) {
        action.onClick?.(item);
      }
    } else {
      action.onClick?.(item);
    }
  };

  if (action.to) {
    const href = resolve(action.to, item) ?? '';
    return (
      <Link to={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className={className}>
      {content}
    </button>
  );
}

// 匯出常用的輔助函式
export const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('zh-TW', options);
};

export const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount?: number, currency = 'TWD') => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
