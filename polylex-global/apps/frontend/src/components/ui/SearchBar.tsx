import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  /** @deprecated PolyLex Web uses Playful Light exclusively. */
  light?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = 'Search…', className = '' }: SearchBarProps) {
  return (
    <div className={`flex min-h-11 items-center gap-3 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-card)] px-4 py-3 ${className}`}>
      <Search size={18} className="flex-shrink-0 text-[var(--color-ink-3)]" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-3)]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={`${placeholder}: clear`}
          className="flex min-h-11 min-w-11 flex-shrink-0 items-center justify-center rounded-full text-[var(--color-ink-3)] hover:bg-[var(--color-card-2)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
