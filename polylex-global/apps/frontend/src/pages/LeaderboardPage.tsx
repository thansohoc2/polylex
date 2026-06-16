import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { gamificationApi } from '@/api/client';
import type { WeeklyLeaderboardResponse } from '@polylex/shared-types';
import AppShell from '@/components/layout/AppShell';
import SkeletonCard from '@/components/ui/SkeletonCard';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WeeklyLeaderboardResponse | null>(null);

  useEffect(() => {
    let mounted = true;
    gamificationApi
      .getLeaderboard(20)
      .then((res) => {
        if (!mounted) return;
        setData(res);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const resetAtText = useMemo(() => {
    if (!data?.resetAt) return '—';
    const parsed = new Date(data.resetAt);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString();
  }, [data?.resetAt]);

  return (
    <AppShell title={t('leaderboard.title')} theme="light">
      <div className="px-4 pb-6 space-y-4">
        <div className="rounded-2xl p-4 border border-line bg-card">
          <h2 className="text-ink font-semibold">{t('leaderboard.weeklyTitle')}</h2>
          <p className="text-[var(--color-ink-3)] text-sm mt-1">{t('leaderboard.resetAt', { datetime: resetAtText })}</p>
        </div>

        {loading ? (
          <div className="space-y-2">
            <SkeletonCard light />
            <SkeletonCard light />
          </div>
        ) : (
          <section className="space-y-2">
            {data?.items.length ? (
              data.items.map((entry, index) => (
                <div
                  key={`${entry.rank}-${entry.displayName}`}
                  className={`rounded-2xl px-4 py-3 border flex items-center gap-3 ${
                    entry.isMe ? 'bg-grape-light border-grape-bright' : 'bg-card border-line'
                  }`}
                >
                  <div className={`w-8 text-center text-lg ${entry.isMe ? 'text-grape-dark' : 'text-ink'}`}>
                    {MEDALS[index] ?? `#${entry.rank}`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${
                        entry.isMe ? 'text-grape-dark' : 'text-ink'
                      }`}
                    >
                      {entry.displayName}
                    </p>
                    <p className={`text-xs ${entry.isMe ? 'text-grape-dark/80' : 'text-[var(--color-ink-3)]'}`}>
                      {t('leaderboard.weeklyXp', { xp: entry.weeklyXp })}
                    </p>
                  </div>
                  {entry.isMe && (
                    <span className="text-xs px-2 py-1 rounded-full bg-grape text-white">
                      {t('leaderboard.you')}
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="rounded-2xl p-6 border border-line bg-card text-center">
                <p className="text-[var(--color-ink-3)] text-sm">{t('leaderboard.empty')}</p>
              </div>
            )}
          </section>
        )}

        {!loading && data?.me && !data.items.some((x) => x.isMe) && (
          <section>
            <h3 className="text-sm font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
              {t('leaderboard.yourRank')}
            </h3>
            <div className="rounded-2xl px-4 py-3 border flex items-center gap-3 bg-grape-light border-grape-bright">
              <div className="w-8 text-center text-sm font-semibold text-grape-dark">#{data.me.rank}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-grape-dark">{data.me.displayName}</p>
                <p className="text-xs text-grape-dark/80">
                  {t('leaderboard.weeklyXp', { xp: data.me.weeklyXp })}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-grape text-white">{t('leaderboard.you')}</span>
            </div>
          </section>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full rounded-2xl py-3 font-medium text-ink bg-card border border-line"
        >
          {t('leaderboard.backHome')}
        </button>
      </div>
    </AppShell>
  );
}
