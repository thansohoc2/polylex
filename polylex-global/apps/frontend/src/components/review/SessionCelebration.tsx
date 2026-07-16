import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SessionCelebrationProps {
  reviewed: number;
  accuracy: number;
  xpEarned: number;
  currentStreak: number;
  newBadges: string[];
  stageMode?: boolean;
  primaryAction: React.ReactNode;
  secondaryAction?: React.ReactNode;
  /** @deprecated Playful Light is now the only Web theme. */
  light?: boolean;
}

const CONFETTI = ['🎉', '✨', '🎊', '🏅', '🔥'];

export default function SessionCelebration({
  reviewed,
  accuracy,
  xpEarned,
  currentStreak,
  newBadges,
  stageMode = false,
  primaryAction,
  secondaryAction,
}: SessionCelebrationProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex flex-col items-center justify-center py-10 text-center px-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {CONFETTI.map((emoji, i) => (
          <motion.div
            key={`${emoji}-${i}`}
            initial={{ y: -40, opacity: 0, x: i * 35 - 70 }}
            animate={reduceMotion ? { opacity: 0 } : { y: [0, 120, 220], opacity: [0, 1, 0] }}
            transition={reduceMotion ? { duration: 0 } : { duration: 2.2, delay: i * 0.12, repeat: Infinity, repeatDelay: 1.4 }}
            className="absolute left-1/2 top-0 text-xl"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <p className="text-6xl mb-3">{stageMode ? '🏁' : '🎉'}</p>
      <h2 className="text-xl font-bold text-[var(--color-ink)]">{t('review.sessionCompleteTitle')}</h2>
      <p className="mt-2 text-[var(--color-ink-3)]">
        {t('review.sessionCompleteStats', { reviewed, accuracy })}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs">
        <div className="rounded-xl p-2 bg-[var(--color-card-2)] border border-[var(--color-line)]">
          <p className="text-[11px] text-[var(--color-ink-3)]">{t('review.celebrationXp')}</p>
          <p className="text-sm font-semibold text-[var(--color-gold)]">+{xpEarned} XP</p>
        </div>
        <div className="rounded-xl p-2 bg-[var(--color-card-2)] border border-[var(--color-line)]">
          <p className="text-[11px] text-[var(--color-ink-3)]">{t('review.celebrationStreak')}</p>
          <p className="text-sm font-semibold text-[var(--color-coral)]">🔥 {currentStreak}</p>
        </div>
      </div>

      {newBadges.length > 0 && (
        <div className="mt-4 w-full max-w-sm">
          <p className="text-xs mb-2 text-[var(--color-coral)]">{t('review.celebrationBadges')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {newBadges.map((badge) => (
              <span
                key={badge}
                className="text-xs px-2.5 py-1 rounded-full bg-[var(--color-coral-soft)] text-[var(--color-coral)] border border-[var(--color-line)]"
              >
                {t(`review.badges.${badge}`, { defaultValue: badge })}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 w-full max-w-sm">{primaryAction}</div>
      {secondaryAction ? <div className="mt-3 w-full max-w-sm">{secondaryAction}</div> : null}
    </div>
  );
}
