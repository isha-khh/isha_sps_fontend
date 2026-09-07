import { useMemo, useState } from 'react';

/** 樹狀標籤節點（對應後端 CategoryType.CompanyTag 分類，含階層 parentId） */
export interface TagTreeOption {
  id: number;
  name: string;
  /** 上層節點 ID；root 節點為 undefined */
  parentId?: number;
  ordinal?: number;
}

interface TagCategoryTreeSelectProps {
  options: TagTreeOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}

/**
 * 階層式標籤多選元件。
 * 將扁平的標籤分類依 parentId 組成樹狀，每個節點皆可獨立勾選（任一層皆可選）。
 */
export const TagCategoryTreeSelect = ({
  options,
  selectedIds,
  onToggle,
  searchPlaceholder = '搜尋標籤...',
  emptyText = '尚無可用的標籤',
}: TagCategoryTreeSelectProps) => {
  const [search, setSearch] = useState('');

  // parentId -> 子節點清單（依 ordinal 排序）
  const childrenMap = useMemo(() => {
    const map = new Map<number | undefined, TagTreeOption[]>();
    for (const opt of options) {
      const key = opt.parentId ?? undefined;
      const list = map.get(key) ?? [];
      list.push(opt);
      map.set(key, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0) || a.name.localeCompare(b.name));
    }
    return map;
  }, [options]);

  // 搜尋時要顯示的節點：命中的節點 + 其所有祖先（保留階層脈絡）。null 代表全部顯示
  const visibleIds = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (keyword === '') return null;

    const parentOf = new Map<number, number | undefined>();
    for (const opt of options) parentOf.set(opt.id, opt.parentId ?? undefined);

    const visible = new Set<number>();
    for (const opt of options) {
      if (!opt.name.toLowerCase().includes(keyword)) continue;
      let current: number | undefined = opt.id;
      while (current !== undefined && !visible.has(current)) {
        visible.add(current);
        current = parentOf.get(current);
      }
    }
    return visible;
  }, [options, search]);

  if (options.length === 0) {
    return <p className="text-sm text-base-content/60">{emptyText}</p>;
  }

  const renderNodes = (parentId: number | undefined, depth: number): React.ReactNode => {
    const nodes = childrenMap.get(parentId) ?? [];
    return nodes
      .filter((opt) => visibleIds === null || visibleIds.has(opt.id))
      .map((opt) => {
        const checked = selectedIds.includes(opt.id);
        const hasChildren = (childrenMap.get(opt.id) ?? []).length > 0;
        return (
          <div key={opt.id}>
            <label
              className="flex items-center gap-2 py-1.5 cursor-pointer rounded hover:bg-base-200/60"
              style={{ paddingLeft: `${depth * 1.25}rem` }}
            >
              <input
                type="checkbox"
                className="checkbox checkbox-sm checkbox-primary"
                checked={checked}
                onChange={() => onToggle(opt.id)}
              />
              <span className={`text-sm ${hasChildren ? 'font-medium' : ''}`}>{opt.name}</span>
            </label>
            {hasChildren && renderNodes(opt.id, depth + 1)}
          </div>
        );
      });
  };

  return (
    <>
      <input
        type="text"
        className="input input-bordered input-sm mb-3"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="max-h-72 overflow-y-auto pr-1">
        {visibleIds !== null && visibleIds.size === 0 ? (
          <p className="text-sm text-base-content/60 py-2">找不到符合的標籤</p>
        ) : (
          renderNodes(undefined, 0)
        )}
      </div>
    </>
  );
};
