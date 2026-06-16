import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  light?: boolean;
}

export default function SearchBar({ value, onChange, placeholder = 'Search…', className = '', light = false }: SearchBarProps) {
  const bgStyle = light
    ? { background: 'var(--color-card)', border: '1px solid var(--color-line)' }
    : { background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)' };

  const textColor = light ? 'var(--color-ink)' : '#F1F5F9';
  const iconColor = light ? 'var(--color-ink-soft)' : '#475569';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${className}`}
      style={bgStyle}
    >
      <Search size={18} style={{ color: iconColor }} className="flex-shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none text-sm"
        style={{ color: textColor }}
      />
      {value && (
        <button onClick={() => onChange('')} className="flex-shrink-0 min-w-[24px] min-h-[24px] flex items-center justify-center">
          <X size={16} style={{ color: iconColor }} />
        </button>
      )}
    </div>
  );
}
