import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { userApi, gamificationApi, reviewApi, quickNoteApi, pathApi, ReviewQueueResponse } from '@/api/client';
import { GamificationStats } from '@polylex/shared-types';
import { AsyncState } from '@polylex/shared-ui';
import AppShell from '@/components/layout/AppShell';
import GreetingCard from '@/components/home/GreetingCard';
import DailyGoalRing from '@/components/home/DailyGoalRing';
import LevelMasteryCard from '@/components/home/LevelMasteryCard';
import DueVocabItem from '@/components/home/DueVocabItem';
import SkeletonCard from '@/components/ui/SkeletonCard';
import { QuickNote } from '@/components/quick-note/QuickNoteCard';

interface QueueItem {
  id: string;
  memoryStrength: number;
  vocabularyBase: { term: string; language: { code: string; name: string } };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [dueItems, setDueItems] = useState<QueueItem[]>([]);
  const [quickNoteCount, setQuickNoteCount] = useState(0);
  const [recentNotes, setRecentNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      userApi.getMe(),
      gamificationApi.getStats(),
      reviewApi.getQueue({ limit: 5 }),
      quickNoteApi.list(),
      reviewApi.getQueue({ sourceType: 'quicknote', limit: 20 }),
      pathApi.getMyPaths(),
    ]).then(([u, s, q, n, qn, p]) => {
      if (u.status === 'fulfilled') setUser(u.value);
      if (s.status === 'fulfilled') setStats(s.value as GamificationStats);
      if (q.status === 'fulfilled') setDueItems((q.value as ReviewQueueResponse).items as QueueItem[]);
      if (n.status === 'fulfilled') setRecentNotes((n.value as QuickNote[]).slice(0, 5));
      if (qn.status === 'fulfilled') setQuickNoteCount(((qn.value as ReviewQueueResponse).items as QueueItem[]).length);
      setLoadFailed([s, q, n, qn].every((result) => result.status === 'rejected'));
      setLoading(false);
      if (p.status === 'fulfilled' && (p.value as unknown[]).length === 0) {
        navigate('/roadmap', { replace: true });
      }
    });
  }, [setUser, navigate]);

  const handleSelectGoal = async (goal: 10 | 20 | 40) => {
    if (savingGoal) return;
    setSavingGoal(true);
    try {
      const updated = await userApi.updateMe({ dailyGoal: goal });
      setUser(updated);
      setStats((prev) => {
        if (!prev) return prev;
        const percent = Math.min(100, Math.round((prev.dailyXp / Math.max(1, goal)) * 100));
        return {
          ...prev,
          dailyGoal: goal,
          dailyProgressPercent: percent,
          isDailyGoalReached: prev.dailyXp >= goal,
        };
      });
    } finally {
      setSavingGoal(false);
    }
  };

  const hasWork = dueItems.length > 0 || quickNoteCount > 0;
  const pendingTotal = Math.max(dueItems.length, quickNoteCount);

  const quickActions: {
    key: string;
    icon: string;
    chip: string;
    label: string;
    sub: string;
    badge?: number;
    onClick: () => void;
  }[] = [
    {
      key: 'quicknotes',
      icon: '⚡',
      chip: 'var(--color-warn-soft)',
      label: t('dashboard.quickNotes'),
      sub: quickNoteCount > 0 ? t('dashboard.toLearnCount', { count: quickNoteCount }) : t('dashboard.allDone'),
      badge: quickNoteCount > 0 ? quickNoteCount : undefined,
      onClick: () => navigate('/review/quicknotes'),
    },
    {
      key: 'vocabulary',
      icon: '📚',
      chip: 'var(--color-info-soft)',
      label: t('dashboard.vocabulary'),
      sub: t('dashboard.browseWords'),
      onClick: () => navigate('/vocabulary'),
    },
    {
      key: 'leaderboard',
      icon: '🏆',
      chip: 'var(--color-grape-light)',
      label: t('profile.leaderboardMenu'),
      sub: t('dashboard.leaderboardShort'),
      onClick: () => navigate('/leaderboard'),
    },
    {
      key: 'analytics',
      icon: '📊',
      chip: 'var(--color-ok-soft)',
      label: t('profile.analyticsMenu'),
      sub: t('dashboard.analyticsShort'),
      onClick: () => navigate('/analytics'),
    },
  ];

  return (
    <AppShell title={t('dashboard.title')}>
      <div className="space-y-4 px-4 pb-6 sm:px-6 lg:px-8">

        {loadFailed && (
          <AsyncState status="error" errorMessage={t('addWord.failedToCreate')} />
        )}

        {/* Greeting */}
        {loading ? (
          <SkeletonCard />
        ) : (
          <GreetingCard displayName={user?.displayName ?? ''} stats={stats} />
        )}

        {/* Primary CTA — the single, adaptive "do this next" action. */}
        {!loading && (
          <button
            onClick={() => navigate(quickNoteCount > 0 ? '/review/quicknotes' : '/review')}
            className="press group relative w-full overflow-hidden rounded-[var(--radius-card)] p-5 text-left text-[var(--color-on-brand)] shadow-grape"
            style={{ background: 'linear-gradient(135deg, var(--color-grape) 0%, var(--color-ok) 100%)' }}
          >
            {/* decorative glow */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
            />
            <div className="relative flex items-center gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl"
                style={{ background: 'var(--color-on-brand-tint-md)' }}
              >
                {hasWork ? '🚀' : '✅'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg font-extrabold leading-tight">
                  {hasWork ? t('dashboard.keepLearning') : t('dashboard.caughtUp')}
                </p>
                <p className="mt-0.5 text-sm text-white/85">
                  {hasWork ? t('dashboard.dueCount', { count: pendingTotal }) : t('dashboard.caughtUpSub')}
                </p>
              </div>
              <span className="text-2xl transition-transform group-hover:translate-x-0.5">›</span>
            </div>
          </button>
        )}

        {/* Progress bento — goal ring + level sit side by side on wide screens. */}
        {!loading && stats && (
          <div className="grid gap-4 lg:grid-cols-2">
            <DailyGoalRing
              dailyXp={stats.dailyXp}
              dailyGoal={stats.dailyGoal}
              dailyProgressPercent={stats.dailyProgressPercent}
              isReached={stats.isDailyGoalReached}
              onSelectGoal={handleSelectGoal}
              loading={savingGoal}
            />
            <LevelMasteryCard
              level={stats.level}
              xpInLevel={stats.xpInLevel}
              xpForNextLevel={stats.xpForNextLevel}
              masteredWordCount={stats.masteredWordCount}
            />
          </div>
        )}

        {/* Quick access — surfaces destinations that aren't in the bottom nav. */}
        <section>
          <h3 className="mb-2 px-1 font-display font-bold text-[var(--color-ink)]">
            {t('dashboard.quickActions')}
          </h3>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {quickActions.map((action) => (
              <button
                key={action.key}
                onClick={action.onClick}
                className="press relative flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--color-card)] p-3.5 text-left shadow-soft"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl"
                  style={{ background: action.chip }}
                >
                  {action.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold text-[var(--color-ink)]">{action.label}</p>
                  <p className="truncate text-xs text-[var(--color-ink-3)]">{action.sub}</p>
                </div>
                {action.badge != null && (
                  <span className="absolute right-2 top-2 rounded-full bg-[var(--color-coral)] px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {action.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Recent quick notes */}
        {recentNotes.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-[var(--color-ink)]">{t('dashboard.recentNotes')}</h3>
              <button
                onClick={() => navigate('/quick-notes')}
                className="text-[var(--color-coral)] text-sm font-semibold"
              >
                {t('dashboard.seeAll')}
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
              {recentNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => navigate('/quick-notes')}
                  className="press flex-shrink-0 w-36 bg-[var(--color-card)] rounded-[var(--radius-card)] p-3 text-left shadow-soft"
                >
                  <p className="text-sm font-semibold text-[var(--color-ink)] truncate">{note.term}</p>
                  {note.vocabularyBase?.translations?.[0]?.translation && (
                    <p className="text-xs text-[var(--color-ink-3)] mt-1 truncate">
                      {note.vocabularyBase.translations[0].translation}
                    </p>
                  )}
                  <span className="mt-2 inline-block text-xs bg-[var(--color-card-2)] text-[var(--color-ink-2)] px-2 py-0.5 rounded-full">
                    {note.sourceLanguageCode}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Due for review */}
        {dueItems.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-display font-bold text-[var(--color-ink)]">{t('dashboard.dueForReview')}</h3>
              <button onClick={() => navigate('/review/all')} className="text-[var(--color-coral)] text-sm font-semibold">
                {t('dashboard.reviewAll')}
              </button>
            </div>
            <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 shadow-soft">
              {dueItems.map((item) => (
                <DueVocabItem
                  key={item.id}
                  term={item.vocabularyBase.term}
                  languageName={item.vocabularyBase.language.name}
                  languageCode={item.vocabularyBase.language.code}
                  memoryStrength={item.memoryStrength}
                />
              ))}
            </div>
          </section>
        )}

      </div>
    </AppShell>
  );
}
