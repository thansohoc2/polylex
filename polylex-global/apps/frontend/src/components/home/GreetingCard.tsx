import { useTranslation } from 'react-i18next';
import { GamificationStats } from '@polylex/shared-types';

interface GreetingCardProps {
  displayName: string | undefined;
  stats: GamificationStats | null;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'greeting.morning';
  if (hour >= 12 && hour < 18) return 'greeting.afternoon';
  return 'greeting.evening';
}

function getInitials(name: string | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function GreetingCard({ displayName, stats }: GreetingCardProps) {
  const { t } = useTranslation();
  const greeting = t(getGreetingKey());
  const streak = stats?.currentStreak ?? 0;
  const freezes = stats?.streakFreezes ?? 0;
  const xp = stats?.totalXp ?? 0;
  const words = stats?.totalWordCount ?? 0;

  const statItems = [
    { icon: '🔥', value: streak, label: t('greeting.dayStreak'), animate: streak > 0 },
    { icon: '🧊', value: freezes, label: t('greeting.freezes') },
    { icon: '⭐', value: xp.toLocaleString(), label: t('greeting.totalXp') },
    { icon: '📚', value: words, label: t('greeting.words') },
  ];

  return (
    <div
      className=" rounded-[var(--radius-card)] p-5 text-white shadow-coral animate-pop"
      style={{ background: 'linear-gradient(135deg, #14b86a 0%, #a78bfa 100%)' }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-white/85 text-sm font-medium">{greeting} 👋</p>
          <h2 className="text-white text-2xl font-display font-extrabold mt-0.5">
            {displayName ?? '…'}
          </h2>
        </div>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.22)' }}
        >
          {getInitials(displayName)}
        </div>
      </div>

      {/* Stats — evenly distributed across the full width */}
      <div className="grid grid-cols-4 divide-x divide-white/15 rounded-2xl bg-white/10">
        {statItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center justify-center px-1 py-2.5 text-center">
            <div className="flex items-center gap-1">
              <span
                className="text-base"
                style={{ animation: item.animate ? 'float 3s ease-in-out infinite' : undefined }}
              >
                {item.icon}
              </span>
              <span className="font-bold text-sm leading-none">{item.value}</span>
            </div>
            <span className="mt-1 text-[11px] leading-tight text-white/75">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
