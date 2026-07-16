import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RatingButtonsProps {
  onRate: (quality: number) => void;
  disabled?: boolean;
  /** @deprecated Playful Light is now the only Web theme. */
  light?: boolean;
}

export default function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  const { t } = useTranslation();
  const ratings = [
    { label: t('review.again'), value: 0, bg: 'var(--color-bad-soft)', color: 'var(--color-bad)' },
    { label: t('review.hard'), value: 2, bg: 'var(--color-warn-soft)', color: 'var(--color-warn)' },
    { label: t('review.good'), value: 3, bg: 'var(--color-info-soft)', color: 'var(--color-info)' },
    { label: t('review.easy'), value: 5, bg: 'var(--color-ok-soft)', color: 'var(--color-ok)' },
  ];
  return (
    <motion.div
      className="grid grid-cols-4 gap-2 px-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {ratings.map(({ label, value, bg, color }) => (
        <button
          key={value}
          onClick={() => onRate(value)}
          disabled={disabled}
          className="py-4 rounded-2xl font-semibold text-xs transition-opacity disabled:opacity-50 min-h-[56px] border border-[var(--color-line)]"
          style={{
            background: bg,
            color,
          }}
        >
          {label}
        </button>
      ))}
    </motion.div>
  );
}
