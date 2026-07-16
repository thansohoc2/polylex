interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  /** @deprecated PolyLex Web uses Playful Light exclusively. */
  light?: boolean;
}

export default function Chip({ label, selected = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-[var(--radius-pill)] border px-3 py-1.5 text-sm font-medium transition-colors ${
        selected
          ? 'border-[var(--color-coral)] bg-[var(--color-coral)] text-[var(--color-on-brand)]'
          : 'border-[var(--color-line)] bg-[var(--color-card-2)] text-[var(--color-ink-3)] hover:bg-[var(--color-card)]'
      } ${className}`}
    >
      {label}
    </button>
  );
}
