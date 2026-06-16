import { useTranslation } from 'react-i18next';

type GoalPreset = 10 | 20 | 40;

interface DailyGoalRingProps {
  dailyXp: number;
  dailyGoal: number;
  dailyProgressPercent: number;
  isReached: boolean;
  onSelectGoal: (goal: GoalPreset) => void;
  loading?: boolean;
}

const GOAL_PRESETS: GoalPreset[] = [10, 20, 40];

export default function DailyGoalRing({
  dailyXp,
  dailyGoal,
  dailyProgressPercent,
  isReached,
  onSelectGoal,
  loading = false,
}: DailyGoalRingProps) {
  const { t } = useTranslation();

  const normalizedGoal = Math.max(1, dailyGoal);
  const progress = Math.min(100, Math.max(0, dailyProgressPercent));

  const size = 108;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <section
      className="rounded-[var(--radius-card)] p-4 bg-[var(--color-card)] shadow-soft"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-[var(--color-ink)]">{t('dashboard.dailyGoalTitle')}</h3>
        {isReached ? (
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: 'color-mix(in srgb, var(--color-ok) 14%, white)', color: 'var(--color-ok)' }}
          >
            {t('dashboard.goalReached')}
          </span>
        ) : (
          <span className="text-xs text-[var(--color-ink-3)]">{t('dashboard.goalInProgress')}</span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-[108px] h-[108px] shrink-0">
          <svg width={size} height={size} className="-rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--color-line)"
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isReached ? 'var(--color-ok)' : 'var(--color-coral)'}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 350ms var(--ease-spring)' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-2xl font-display font-extrabold text-[var(--color-ink)]">{dailyXp}</p>
            <p className="text-[11px] text-[var(--color-ink-3)]">/ {normalizedGoal} XP</p>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm text-[var(--color-ink-2)]">
            {t('dashboard.dailyGoalSummary', {
              xp: dailyXp,
              goal: normalizedGoal,
              percent: progress,
            })}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {GOAL_PRESETS.map((preset) => {
              const selected = normalizedGoal === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSelectGoal(preset)}
                  disabled={loading}
                  className="press rounded-xl py-2 text-xs font-semibold border disabled:opacity-50"
                  style={{
                    background: selected ? 'color-mix(in srgb, var(--color-coral) 12%, white)' : 'var(--color-card-2)',
                    borderColor: selected ? 'var(--color-coral)' : 'var(--color-line)',
                    color: selected ? 'var(--color-coral)' : 'var(--color-ink-3)',
                  }}
                >
                  {t(`dashboard.goalPreset${preset}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
