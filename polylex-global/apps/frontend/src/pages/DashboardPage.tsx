import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/auth.store';
import { userApi, gamificationApi, reviewApi, quickNoteApi, pathApi, ReviewQueueResponse } from '@/api/client';
import { GamificationStats } from '@polylex/shared-types';
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

  return (
    <AppShell title={t('dashboard.title')} theme="light">
      <div className="px-4 space-y-5 pb-6">

        {/* Greeting */}
        {loading ? (
          <SkeletonCard light />
        ) : (
          <GreetingCard displayName={user?.displayName ?? ''} stats={stats} />
        )}

        {/* Hero CTA — primary "keep learning" action (visual hierarchy) */}
        {!loading && (
          <button
            onClick={() => navigate(quickNoteCount > 0 ? '/review/quicknotes' : '/review')}
            className="press w-full rounded-[var(--radius-card)] p-4 text-left text-white shadow-coral"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #14b86a 100%)' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚀</span>
              <div className="flex-1 min-w-0">
                <p className="font-display font-extrabold text-lg leading-tight">
                  {t('dashboard.review')}
                </p>
                <p className="text-white/85 text-sm mt-0.5">
                  {dueItems.length > 0 || quickNoteCount > 0
                    ? t('dashboard.dueCount', { count: Math.max(dueItems.length, quickNoteCount) })
                    : t('dashboard.caughtUp')}
                </p>
              </div>
              <span className="text-2xl">›</span>
            </div>
          </button>
        )}

        {/* Daily goal ring */}
        {!loading && stats && (
          <DailyGoalRing
            dailyXp={stats.dailyXp}
            dailyGoal={stats.dailyGoal}
            dailyProgressPercent={stats.dailyProgressPercent}
            isReached={stats.isDailyGoalReached}
            onSelectGoal={handleSelectGoal}
            loading={savingGoal}
          />
        )}

        {!loading && stats && (
          <LevelMasteryCard
            level={stats.level}
            xpInLevel={stats.xpInLevel}
            xpForNextLevel={stats.xpForNextLevel}
            masteredWordCount={stats.masteredWordCount}
          />
        )}

        {/* Leaderboard entry point */}
        <button
          onClick={() => navigate('/leaderboard')}
          className="press w-full rounded-[var(--radius-card)] p-3 text-left bg-[var(--color-card)] shadow-soft"
        >
          <p className="text-sm font-display font-bold text-[var(--color-ink)]">{t('dashboard.leaderboardTitle')}</p>
          <p className="text-xs text-[var(--color-ink-3)] mt-1">{t('dashboard.leaderboardSubtitle')}</p>
        </button>

        {/* Quick start buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('/review')}
            className="press rounded-[var(--radius-card)] p-3 text-left text-white shadow-grape"
            style={{ background: 'linear-gradient(135deg, var(--color-grape), #9D7BFF)' }}
          >
            <p className="text-lg mb-1">🔁</p>
            <p className="font-display font-bold text-xs">{t('dashboard.review')}</p>
            <p className="text-white/75 text-[10px] mt-0.5">
              {dueItems.length > 0 ? t('dashboard.dueCount', { count: dueItems.length }) : t('dashboard.caughtUp')}
            </p>
          </button>
          <button
            onClick={() => navigate('/review/quicknotes')}
            className="press rounded-[var(--radius-card)] p-3 text-left text-white relative shadow-soft"
            style={{ background: 'linear-gradient(135deg, var(--color-gold), #FFD166)' }}
          >
            {quickNoteCount > 0 && (
              <span className="absolute top-2 right-2 bg-white/35 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {quickNoteCount}
              </span>
            )}
            <p className="text-lg mb-1">⚡</p>
            <p className="font-display font-bold text-xs">{t('dashboard.quickNotes')}</p>
            <p className="text-white/80 text-[10px] mt-0.5">
              {quickNoteCount > 0 ? t('dashboard.toLearnCount', { count: quickNoteCount }) : t('dashboard.allDone')}
            </p>
          </button>
          <button
            onClick={() => navigate('/vocabulary')}
            className="press bg-[var(--color-card)] rounded-[var(--radius-card)] p-3 text-left shadow-soft"
          >
            <p className="text-lg mb-1">📚</p>
            <p className="font-display font-bold text-[var(--color-ink)] text-xs">{t('dashboard.vocabulary')}</p>
            <p className="text-[var(--color-ink-3)] text-[10px] mt-0.5">{t('dashboard.browseWords')}</p>
          </button>
        </div>

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
                <div
                  key={note.id}
                  className="flex-shrink-0 w-36 bg-[var(--color-card)] rounded-[var(--radius-card)] p-3 shadow-soft"
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
                </div>
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
