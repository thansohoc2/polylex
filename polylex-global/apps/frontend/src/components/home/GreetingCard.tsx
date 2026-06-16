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

  return (
    <div
      className=" rounded-[var(--radius-card)] p-5 mb-4 text-white shadow-coral animate-pop"
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

      {/* Stats row */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5">
          <span className="text-lg" style={{ animation: streak > 0 ? 'float 3s ease-in-out infinite' : undefined }}>
            🔥
          </span>
          <div>
            <p className="text-white font-bold text-sm">{streak}</p>
            <p className="text-white/75 text-xs">{t('greeting.dayStreak')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">🧊</span>
          <div>
            <p className="text-white font-bold text-sm">{freezes}</p>
            <p className="text-white/75 text-xs">{t('greeting.freezes')}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">⭐</span>
          <div>
            <p className="text-white font-bold text-sm">{xp.toLocaleString()}</p>
            <p className="text-white/75 text-xs">{t('greeting.totalXp')}</p>
          </div>
        </div>
        {stats && (
          <div className="flex items-center gap-1.5">
            <span className="text-lg">📚</span>
            <div>
              <p className="text-white font-bold text-sm">{stats.totalWordCount}</p>
              <p className="text-white/75 text-xs">{t('greeting.words')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
