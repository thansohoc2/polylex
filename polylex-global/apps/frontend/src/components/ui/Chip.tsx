interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  light?: boolean;
}

export default function Chip({ label, selected = false, onClick, className = '', light = false }: ChipProps) {
  if (light) {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap min-h-[36px] ${
          selected
            ? 'text-white'
            : 'border'
        } ${className}`}
        style={{
          background: selected ? 'var(--color-coral)' : 'var(--color-card-2)',
          color: selected ? 'white' : 'var(--color-ink-soft)',
          borderColor: selected ? 'transparent' : 'var(--color-line)',
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap min-h-[36px] ${
        selected
          ? 'bg-[#6366F1] text-white'
          : 'bg-white/5 text-[#94A3B8] border border-white/10 hover:bg-white/10'
      } ${className}`}
    >
      {label}
    </button>
  );
}
