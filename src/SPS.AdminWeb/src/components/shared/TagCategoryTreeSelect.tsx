import { useMemo, useState } from 'react';

/** 標籤節點（對應後端 CategoryType.CompanyTag 分類，含階層 parentId） */
export interface TagTreeOption {
  id: number;
  name: string;
  /** 上層節點 ID；root 節點為 undefined */
  parentId?: number;
  ordinal?: number;
  /** 根節點的分類標記：「應用情境」「應用範疇」，其他視為智慧技術 */
  remark?: string;
}

interface TagCategoryTreeSelectProps {
  options: TagTreeOption[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  searchPlaceholder?: string;
  emptyText?: string;
}

const sortNodes = (list: TagTreeOption[]) =>
  list.slice().sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0) || a.id - b.id);

/**
 * 標籤多選元件，版面與前台（會員中心／刊登需求）一致，分三組：
 * - 應用情境、應用範疇：最上層（根節點）的 remark 標記屬於哪一種，直接以核取方塊排列。
 * - 智慧技術：其餘根節點，左邊選大類，右邊顯示「子分類 → 項目」。
 */
export const TagCategoryTreeSelect = ({
  options,
  selectedIds,
  onToggle,
  searchPlaceholder = '搜尋標籤...',
  emptyText = '尚無可用的標籤',
}: TagCategoryTreeSelectProps) => {
  const [search, setSearch] = useState('');
  const [activeTechId, setActiveTechId] = useState<number | null>(null);

  const childrenMap = useMemo(() => {
    const map = new Map<number | undefined, TagTreeOption[]>();
    for (const opt of options) {
      const key = opt.parentId ?? undefined;
      const list = map.get(key) ?? [];
      list.push(opt);
      map.set(key, list);
    }
    return map;
  }, [options]);

  const children = (id: number | undefined) => sortNodes(childrenMap.get(id) ?? []);

  const { scenarios, scopes, techRoots } = useMemo(() => {
    const result = { scenarios: [] as TagTreeOption[], scopes: [] as TagTreeOption[], techRoots: [] as TagTreeOption[] };
    for (const root of sortNodes(childrenMap.get(undefined) ?? [])) {
      const remark = (root.remark ?? '').trim();
      if (remark === '應用情境') result.scenarios.push(root);
      else if (remark === '應用範疇') result.scopes.push(root);
      else result.techRoots.push(root);
    }
    return result;
  }, [childrenMap]);

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

  const isVisible = (opt: TagTreeOption) => visibleIds === null || visibleIds.has(opt.id);
  const isSelected = (id: number) => selectedIds.includes(id);

  /** 某節點底下（含自己）已勾選的數量，用在智慧技術大類旁的徽章 */
  const countSelected = (opt: TagTreeOption): number =>
    (isSelected(opt.id) ? 1 : 0) + children(opt.id).reduce((sum, child) => sum + countSelected(child), 0);

  const checkbox = (opt: TagTreeOption) => (
    <label key={opt.id} className="flex items-center gap-2 py-1 cursor-pointer min-w-0">
      <input
        type="checkbox"
        className="checkbox checkbox-sm checkbox-primary shrink-0"
        checked={isSelected(opt.id)}
        onChange={() => onToggle(opt.id)}
      />
      <span className="text-sm break-words">{opt.name}</span>
    </label>
  );

  const flatGroup = (title: string, nodes: TagTreeOption[], gridClass: string) => {
    const shown = nodes.filter(isVisible);
    if (nodes.length === 0 || shown.length === 0) return null;
    return (
      <div>
        <div className="text-sm font-medium mb-1">{title}（可多選）</div>
        <div className={gridClass}>{shown.map(checkbox)}</div>
      </div>
    );
  };

  const visibleTechRoots = techRoots.filter(isVisible);
  const activeTech = visibleTechRoots.find((r) => r.id === activeTechId) ?? visibleTechRoots[0];

  // 子分類 → 項目；沒有項目的子分類，把它自己當成一個項目（與前台一致）
  const renderTechPanel = (root: TagTreeOption) => {
    const sections = children(root.id).filter(isVisible);
    if (sections.length === 0) return <div className="grid gap-x-4 sm:grid-cols-2">{checkbox(root)}</div>;
    const leaves = sections.filter((s) => children(s.id).length === 0);
    const groups = sections.filter((s) => children(s.id).length > 0);
    return (
      <div className="space-y-3">
        {leaves.length > 0 && <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">{leaves.map(checkbox)}</div>}
        {groups.map((section) => (
          <div key={section.id}>
            <div className="text-sm font-medium text-primary border-b border-base-300 pb-1 mb-1">{section.name}</div>
            <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
              {children(section.id).filter(isVisible).map(checkbox)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const nothingFound =
    visibleIds !== null && scenarios.every((o) => !isVisible(o)) && scopes.every((o) => !isVisible(o)) && visibleTechRoots.length === 0;

  return (
    <div className="space-y-4">
      <input
        type="text"
        className="input input-bordered input-sm w-full sm:max-w-xs"
        placeholder={searchPlaceholder}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {nothingFound ? (
        <p className="text-sm text-base-content/60 py-2">找不到符合的標籤</p>
      ) : (
        <>
          {flatGroup('應用情境', scenarios, 'grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3')}
          {flatGroup('應用範疇', scopes, 'grid gap-x-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6')}

          {visibleTechRoots.length > 0 && activeTech && (
            <div>
              <div className="text-sm font-medium mb-1">智慧技術（可多選）</div>
              <div className="flex flex-col sm:flex-row rounded-box border border-base-300 overflow-hidden">
                <ul className="sm:w-48 shrink-0 bg-base-200/60 sm:border-r border-base-300 max-h-80 overflow-y-auto">
                  {visibleTechRoots.map((root) => {
                    const count = countSelected(root);
                    const active = root.id === activeTech.id;
                    return (
                      <li key={root.id}>
                        <button
                          type="button"
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left text-sm ${
                            active ? 'bg-base-100 font-medium text-primary' : 'hover:bg-base-200'
                          }`}
                          onClick={() => setActiveTechId(root.id)}
                        >
                          <span>{root.name}</span>
                          {count > 0 && <span className="badge badge-primary badge-sm">{count}</span>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="flex-1 min-w-0 p-3 max-h-80 overflow-y-auto">{renderTechPanel(activeTech)}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
