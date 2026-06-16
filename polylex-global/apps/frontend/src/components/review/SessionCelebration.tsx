import { motion } from 'framer-motion';
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
  light = false,
}: SessionCelebrationProps) {
  const { t } = useTranslation();

  const textPrimary = light ? 'var(--color-ink)' : '#F1F5F9';
  const textMuted = light ? 'var(--color-ink-softer)' : '#94A3B8';
  const statBg = light ? 'var(--color-card-2)' : 'rgba(255,255,255,0.05)';
  const statBorder = light ? 'var(--color-line)' : 'rgba(255,255,255,0.1)';
  const badgeBg = light ? 'rgba(255,100,70,0.1)' : 'rgba(99,102,241,0.2)';
  const badgeColor = light ? 'var(--color-coral)' : '#E9D5FF';
  const badgeBorder = light ? 'var(--color-line)' : 'rgba(167,139,250,0.4)';
  const badgeLabel = light ? 'var(--color-coral)' : '#C4B5FD';

  return (
    <div className="relative flex flex-col items-center justify-center py-10 text-center px-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {CONFETTI.map((emoji, i) => (
          <motion.div
            key={`${emoji}-${i}`}
            initial={{ y: -40, opacity: 0, x: i * 35 - 70 }}
            animate={{ y: [0, 120, 220], opacity: [0, 1, 0] }}
            transition={{ duration: 2.2, delay: i * 0.12, repeat: Infinity, repeatDelay: 1.4 }}
            className="absolute left-1/2 top-0 text-xl"
          >
            {emoji}
          </motion.div>
        ))}
      </div>

      <p className="text-6xl mb-3">{stageMode ? '🏁' : '🎉'}</p>
      <h2 className="text-xl font-bold" style={{ color: textPrimary }}>{t('review.sessionCompleteTitle')}</h2>
      <p className="mt-2" style={{ color: textMuted }}>
        {t('review.sessionCompleteStats', { reviewed, accuracy })}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 w-full max-w-xs">
        <div className="rounded-xl p-2" style={{ background: statBg, border: `1px solid ${statBorder}` }}>
          <p className="text-[11px]" style={{ color: textMuted }}>{t('review.celebrationXp')}</p>
          <p className="text-sm font-semibold text-[#FDE68A]">+{xpEarned} XP</p>
        </div>
        <div className="rounded-xl p-2" style={{ background: statBg, border: `1px solid ${statBorder}` }}>
          <p className="text-[11px]" style={{ color: textMuted }}>{t('review.celebrationStreak')}</p>
          <p className="text-sm font-semibold text-[#FCA5A5]">🔥 {currentStreak}</p>
        </div>
      </div>

      {newBadges.length > 0 && (
        <div className="mt-4 w-full max-w-sm">
          <p className="text-xs mb-2" style={{ color: badgeLabel }}>{t('review.celebrationBadges')}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {newBadges.map((badge) => (
              <span
                key={badge}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` }}
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
