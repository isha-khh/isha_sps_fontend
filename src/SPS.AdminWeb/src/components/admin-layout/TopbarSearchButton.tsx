import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ISidebarMenuItem } from './SidebarMenuItem';

/** 可搜尋的一個頁面：側邊選單的最底層項目，附上它的上層名稱（例如「內容管理 › 頁面設定」） */
interface SearchEntry {
    id: string;
    label: string;
    parents: string[];
    url: string;
    icon?: string;
}

function flatten(items: ISidebarMenuItem[], parents: string[] = [], inheritedIcon?: string): SearchEntry[] {
    return items.flatMap((item) => {
        if (item.isTitle) return [];
        if (item.children && item.children.length > 0) {
            return flatten(item.children, [...parents, item.label], item.icon ?? inheritedIcon);
        }
        return item.url ? [{ id: item.id, label: item.label, parents, url: item.url, icon: item.icon ?? inheritedIcon }] : [];
    });
}

/**
 * 頂端的「搜尋」：搜尋後台選單裡的頁面（只含目前帳號有權限看到的），輸入「頁面設定」「彈窗」「檔案」之類的關鍵字，
 * 用 ↑↓ 選擇、Enter 開啟；也可以直接按 Ctrl／⌘ + K 開啟。比對選單名稱、上層名稱與網址。
 */
export const TopbarSearchButton = ({ menuItems }: { menuItems: ISidebarMenuItem[] }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);

    const entries = useMemo(() => flatten(menuItems), [menuItems]);
    const results = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return entries;
        const terms = keyword.split(/\s+/);
        return entries.filter((entry) => {
            const haystack = [entry.label, ...entry.parents, entry.url].join(' ').toLowerCase();
            return terms.every((term) => haystack.includes(term));
        });
    }, [entries, query]);

    const open = () => {
        const dialog = dialogRef.current;
        if (dialog && !dialog.open) dialog.showModal();
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    const close = () => dialogRef.current?.close();

    const go = (entry: SearchEntry) => {
        close();
        navigate(entry.url);
    };

    // Ctrl／⌘ + K 開啟搜尋
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                open();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, []);

    // 目前選到的項目要捲進可視範圍
    useEffect(() => {
        document.getElementById(`topbar-search-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }, [activeIndex]);

    const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => Math.min(index + 1, results.length - 1));
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const entry = results[activeIndex];
            if (entry) go(entry);
        }
    };

    return (
        <>
            <button
                className="btn btn-outline btn-sm btn-ghost border-base-300 text-base-content/70 hidden h-9 w-48 justify-start gap-2 !text-sm md:flex"
                onClick={open}>
                <span className="iconify lucide--search size-4" />
                <span>搜尋功能頁面</span>
                <kbd className="kbd kbd-xs ms-auto">Ctrl K</kbd>
            </button>
            <button
                className="btn btn-outline btn-sm btn-square btn-ghost border-base-300 text-base-content/70 flex size-9 md:hidden"
                aria-label="搜尋功能頁面"
                onClick={open}>
                <span className="iconify lucide--search size-4" />
            </button>
            <dialog
                ref={dialogRef}
                className="modal p-0"
                onClose={() => {
                    setQuery('');
                    setActiveIndex(0);
                }}>
                <div className="modal-box bg-transparent p-0 shadow-none">
                    <div className="bg-base-100 rounded-box">
                        <div className="input w-full border-0 !outline-none">
                            <span className="iconify lucide--search text-base-content/60 size-4.5" />
                            <input
                                ref={inputRef}
                                type="search"
                                className="grow"
                                placeholder="搜尋功能頁面，例如：頁面設定、彈窗、檔案"
                                aria-label="搜尋功能頁面"
                                role="combobox"
                                aria-expanded="true"
                                aria-controls="topbar-search-results"
                                value={query}
                                onChange={(event) => {
                                    setQuery(event.target.value);
                                    setActiveIndex(0);
                                }}
                                onKeyDown={onInputKeyDown}
                            />
                            <button type="button" className="btn btn-xs btn-circle btn-ghost" aria-label="關閉" onClick={close}>
                                <span className="iconify lucide--x text-base-content/80 size-4" />
                            </button>
                        </div>

                        <div className="border-base-300 max-h-[60vh] overflow-y-auto border-t">
                            {results.length === 0 ? (
                                <p className="text-base-content/60 px-5 py-6 text-center text-sm">找不到符合「{query.trim()}」的功能頁面</p>
                            ) : (
                                <ul id="topbar-search-results" role="listbox" className="menu w-full">
                                    {results.map((entry, index) => (
                                        <li key={entry.id} role="presentation">
                                            <button
                                                type="button"
                                                id={`topbar-search-option-${index}`}
                                                role="option"
                                                aria-selected={index === activeIndex}
                                                className={index === activeIndex ? 'menu-active' : ''}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                onClick={() => go(entry)}>
                                                {entry.icon && <span className={`iconify ${entry.icon} size-4`} />}
                                                <span className="grow text-start text-sm">{entry.label}</span>
                                                {entry.parents.length > 0 && (
                                                    <span className="text-base-content/50 text-xs">{entry.parents.join(' › ')}</span>
                                                )}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="border-base-300 flex items-center gap-3 border-t px-2 py-2 text-sm">
                            <div className="flex items-center gap-1">
                                <kbd className="kbd kbd-xs">↑</kbd>
                                <kbd className="kbd kbd-xs">↓</kbd>
                                <span className="text-base-content/80 ms-1">選擇</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <kbd className="kbd kbd-xs">Enter</kbd>
                                <span className="text-base-content/80 ms-1">開啟</span>
                            </div>
                            <div className="ms-auto flex items-center gap-1">
                                <kbd className="kbd kbd-xs">Esc</kbd>
                                <span className="text-base-content/80 ms-1">關閉</span>
                            </div>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>
        </>
    );
};
