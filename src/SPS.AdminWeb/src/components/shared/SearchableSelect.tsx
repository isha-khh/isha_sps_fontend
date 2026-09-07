import { useState, useRef, useEffect } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  className?: string;
}

export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder = '搜尋...',
  emptyLabel = '不指定',
  className = '',
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? '';

  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className="select select-bordered w-full flex items-center cursor-pointer"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 0);
          }
        }}
      >
        <span className={value ? '' : 'text-base-content/50'}>
          {selectedLabel || emptyLabel}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-base-100 border border-base-300 rounded-box shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder={placeholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <ul className="menu menu-sm max-h-60 overflow-y-auto flex-nowrap p-1">
            <li>
              <a
                className={!value ? 'active' : ''}
                onClick={() => handleSelect('')}
              >
                {emptyLabel}
              </a>
            </li>
            {filtered.map((opt) => (
              <li key={opt.value}>
                <a
                  className={opt.value === value ? 'active' : ''}
                  onClick={() => handleSelect(opt.value)}
                >
                  {opt.label}
                </a>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-2 text-base-content/50 text-sm">無符合結果</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
