import { Search, X } from 'lucide-react';

export function CategorySearchBar({
  value,
  onChange,
  placeholder = 'Search tools...',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative max-w-md">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400 dark:text-ink-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search tools"
        className="w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 pl-10 pr-9 py-2.5 text-sm outline-none focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 dark:hover:text-ink-300"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
