import { useTranslation } from 'react-i18next';

interface LevelMasteryCardProps {
  level: number;
  xpInLevel: number;
  xpForNextLevel: number;
  masteredWordCount: number;
}

export default function LevelMasteryCard({
  level,
  xpInLevel,
  xpForNextLevel,
  masteredWordCount,
}: LevelMasteryCardProps) {
  const { t } = useTranslation();
  const progress = Math.min(100, Math.round((xpInLevel / Math.max(1, xpForNextLevel)) * 100));

  return (
    <div className="rounded-[var(--radius-card)] p-4 bg-[var(--color-card)] shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-display font-bold text-[var(--color-ink)]">
          {t('dashboard.levelTitle', { level })}
        </p>
        <p className="text-xs text-[var(--color-ink-3)]">{t('dashboard.masteredWords', { count: masteredWordCount })}</p>
      </div>

      <div className="mt-3">
        <div className="h-2.5 rounded-full bg-[var(--color-line)] overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--color-grape), #9D7BFF)' }}
          />
        </div>
        <p className="text-xs text-[var(--color-ink-3)] mt-2">
          {t('dashboard.levelProgress', { xp: xpInLevel, next: xpForNextLevel })}
        </p>
      </div>
    </div>
  );
}
