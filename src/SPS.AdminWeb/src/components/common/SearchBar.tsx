interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch: (value: string) => void;
  buttonText?: string;
  className?: string;
}

export const SearchBar = ({
  placeholder = '搜尋...',
  value,
  onChange,
  onSearch,
  buttonText = '搜尋',
  className = '',
}: SearchBarProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex gap-2 flex-1 max-w-md ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        className="input input-bordered flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button type="submit" className="btn btn-neutral">
        <span className="iconify lucide--search size-5" />
        {buttonText}
      </button>
    </form>
  );
};
