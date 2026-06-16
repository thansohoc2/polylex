import { useTranslation } from 'react-i18next';

interface StrengthBarProps {
  /** Memory strength in [0, 1]. */
  value: number;
  className?: string;
}

/**
 * Compact memory-strength indicator shown on review cards so the learner gets
 * immediate feedback on how well a word is retained. Colour mirrors the
 * dashboard convention: green (strong) → amber (medium) → red (weak).
 */
export default function StrengthBar({ value, className = '' }: StrengthBarProps) {
  const { t } = useTranslation();
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const color = value > 0.7 ? '#10B981' : value > 0.4 ? '#F59E0B' : '#EF4444';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-[10px] uppercase tracking-wide text-[#475569]">
        {t('review.strength')}
      </span>
      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-medium" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}
