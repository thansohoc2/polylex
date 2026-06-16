import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface RatingButtonsProps {
  onRate: (quality: number) => void;
  disabled?: boolean;
  light?: boolean;
}

export default function RatingButtons({ onRate, disabled = false, light = false }: RatingButtonsProps) {
  const { t } = useTranslation();
  const ratings = light
    ? [
        { label: t('review.again'), value: 0, bg: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: 'var(--color-line)' },
        { label: t('review.hard'), value: 2, bg: 'rgba(217, 119, 6, 0.1)', color: '#B45309', border: 'var(--color-line)' },
        { label: t('review.good'), value: 3, bg: 'rgba(59, 130, 246, 0.1)', color: '#1D4ED8', border: 'var(--color-line)' },
        { label: t('review.easy'), value: 5, bg: 'rgba(34, 197, 94, 0.1)', color: '#15803D', border: 'var(--color-line)' },
      ]
    : [
        { label: t('review.again'), value: 0, bg: 'rgba(239,68,68,0.12)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' },
        { label: t('review.hard'), value: 2, bg: 'rgba(245,158,11,0.12)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' },
        { label: t('review.good'), value: 3, bg: 'rgba(99,102,241,0.12)', color: '#818CF8', border: 'rgba(99,102,241,0.3)' },
        { label: t('review.easy'), value: 5, bg: 'rgba(16,185,129,0.12)', color: '#10B981', border: 'rgba(16,185,129,0.3)' },
      ];
  return (
    <motion.div
      className="grid grid-cols-4 gap-2 px-4"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {ratings.map(({ label, value, bg, color, border }) => (
        <button
          key={value}
          onClick={() => onRate(value)}
          disabled={disabled}
          className="py-4 rounded-2xl font-semibold text-xs transition-opacity disabled:opacity-50 min-h-[56px]"
          style={{
            background: bg,
            color,
            border: `1px solid ${border}`,
          }}
        >
          {label}
        </button>
      ))}
    </motion.div>
  );
}
