import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { reviewApi, ReviewQueueResponse } from '@/api/client';
import { playAudio, preloadAudio } from '@/utils/audio';
import { useAudioSettingsStore } from '@/store/audio-settings.store';
import { ReviewMode } from '@polylex/shared-types';
import AppShell from '@/components/layout/AppShell';
import ProgressBar from '@/components/ui/ProgressBar';
import FlashCard from '@/components/review/FlashCard';
import TypeAnswer from '@/components/review/TypeAnswer';
import ContextExercise from '@/components/review/ContextExercise';
import ListeningExercise from '@/components/review/ListeningExercise';
import ReverseExercise from '@/components/review/ReverseExercise';
import MultipleChoiceExercise from '@/components/review/MultipleChoiceExercise';
import SessionCelebration from '@/components/review/SessionCelebration';
import RatingButtons from '@/components/review/RatingButtons';
import SkeletonCard from '@/components/ui/SkeletonCard';

interface QueueItem {
  id: string;
  memoryStrength: number;
  reviewCount: number;
  isLeech: boolean;
  isLearned: boolean;
  sourceType?: string | null;
  vocabularyBase: {
    id: string;
    term: string;
    phonetic?: string;
    exampleSentence?: string;
    audioUrl?: string | null;
    cefrLevel?: string | null;
    language: { code: string; name: string };
    translations: { translation: string; targetLanguage: { code: string; name: string } }[];
  };
}

type Phase = 'loading' | 'redirecting' | 'idle' | 'card' | 'rating' | 'done';
type UiReviewMode = ReviewMode | 'multiple_choice';

const CEFR_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'];

function getQueryParams(filter?: string, userPathId?: string): { sourceType?: string; cefrLevel?: string; limit: number; userPathId?: string } {
  if (userPathId) return { userPathId, limit: 20 };
  if (!filter || filter === 'all') return { limit: 20 };
  if (filter === 'quicknotes') return { sourceType: 'quicknote', limit: 20 };
  if (filter === 'path') return { sourceType: 'path', limit: 20 };
  if (CEFR_LEVELS.includes(filter)) return { cefrLevel: filter.toUpperCase(), limit: 20 };
  return { limit: 20 };
}

function getTitle(filter: string | undefined, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (!filter || filter === 'all') return t('review.titleDefault');
  if (filter === 'quicknotes') return t('review.titleQuickNotes');
  if (filter === 'path') return t('review.titlePath');
  if (CEFR_LEVELS.includes(filter)) return t('review.titleLevel', { level: filter.toUpperCase() });
  return t('review.titleDefault');
}

/**
 * Whether a word can be drilled with the context (fill-in-the-blank) exercise:
 * it needs an example sentence that actually contains the term so it can be blanked.
 */
function hasUsableContext(item: QueueItem): boolean {
  const sentence = item.vocabularyBase.exampleSentence;
  const term = item.vocabularyBase.term;
  if (!sentence || !term) return false;
  return sentence.toLowerCase().includes(term.toLowerCase());
}

function hasUsableListening(item: QueueItem): boolean {
  const audioUrl = item.vocabularyBase.audioUrl;
  if (!audioUrl || audioUrl.trim().length === 0) return false;
  return true;
}

function hasUsableReverse(item: QueueItem): boolean {
  const translation = item.vocabularyBase.translations[0]?.translation;
  return !!translation && translation.trim().length > 0;
}

/**
 * Choose the exercise mode for a word, mirroring ACRE's recommendMode escalation:
 * new / weak words use flashcard (recognition) to build familiarity, words already in
 * review switch to type_answer (active recall), and well-retained words with a usable
 * example sentence or audio get richer drills for deeper application.
 */
function pickMode(item: QueueItem, index: number): UiReviewMode {
  if (item.reviewCount === 0) {
    if (hasUsableReverse(item) && index % 2 === 0) return 'multiple_choice';
    return 'flashcard';
  }
  if (item.memoryStrength < 0.35 && hasUsableReverse(item)) {
    return index % 2 === 0 ? 'multiple_choice' : 'reverse';
  }
  if (item.memoryStrength < 0.55 && hasUsableReverse(item)) return 'reverse';
  if (item.memoryStrength >= 0.75 && hasUsableListening(item)) return 'listening';
  if (item.memoryStrength >= 0.6 && hasUsableContext(item)) return 'context';
  return 'type_answer';
}

function toSubmitMode(mode: UiReviewMode): ReviewMode {
  if (mode === 'multiple_choice') return 'reverse';
  return mode;
}

export default function ReviewPage() {
  const { filter, userPathId } = useParams<{ filter?: string; userPathId?: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const rate = useAudioSettingsStore((s) => s.rate);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [phase, setPhase] = useState<Phase>('loading');
  const [showAnswer, setShowAnswer] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [sessionXpEarned, setSessionXpEarned] = useState(0);
  const [sessionCurrentStreak, setSessionCurrentStreak] = useState(0);
  const [sessionNewBadges, setSessionNewBadges] = useState<string[]>([]);
  const [pathTitle, setPathTitle] = useState<string | undefined>();
  const [currentPathStageId, setCurrentPathStageId] = useState<string | undefined>();
  // Tracks how many times each word has been re-queued for in-session relearning.
  const relearnRef = useRef<Record<string, number>>({});

  // Auto-detect best filter and redirect when no filter is given
  useEffect(() => {
    if (filter !== undefined || userPathId !== undefined) return; // has a filter or path, skip redirect

    setPhase('redirecting');
    reviewApi
      .getQueue({ limit: 100 })
      .then((response: ReviewQueueResponse) => {
        const q = response.items as QueueItem[];
        const quicknoteCount = q.filter((i) => i.sourceType === 'quicknote').length;
        const pathCount = q.filter((i) => i.sourceType === 'path').length;

        if (quicknoteCount > 0) {
          navigate('/review/quicknotes', { replace: true });
        } else if (pathCount > 0) {
          navigate('/review/path', { replace: true });
        } else {
          navigate('/review/all', { replace: true });
        }
      })
      .catch(() => navigate('/review/all', { replace: true }));
  }, [filter, userPathId, navigate]);

  const loadQueue = useCallback(async () => {
    if (filter === undefined && userPathId === undefined) return; // waiting for redirect
    setPhase('loading');
    relearnRef.current = {};
    setSessionXpEarned(0);
    setSessionCurrentStreak(0);
    setSessionNewBadges([]);
    try {
      const params = getQueryParams(filter, userPathId);
      const response = await reviewApi.getQueue(params);
      const q = response.items as QueueItem[];
      setQueue(q);
      setPathTitle(response.pathTitle);
      setCurrentPathStageId(response.currentPathStageId);
      setPhase(q.length > 0 ? 'card' : 'idle');
      setCurrent(0);
      // Pre-warm audio for the first 3 items to reduce click-to-play latency on iOS
      q.slice(0, 3).forEach((item) => {
        if (item.vocabularyBase.audioUrl) {
          preloadAudio(item.vocabularyBase.audioUrl);
        }
      });
      setShowAnswer(false);
      setStartTime(Date.now());
    } catch {
      setPhase('idle');
    }
  }, [filter, userPathId]);

  useEffect(() => { loadQueue(); }, [loadQueue]);

  const handleReveal = () => {
    setShowAnswer(true);
    setPhase('rating');

    const item = queue[current];
    if (item) {
      playAudio(
        item.vocabularyBase.term,
        item.vocabularyBase.language.code,
        item.vocabularyBase.audioUrl,
        rate,
      );
    }
  };

  const handleRate = async (recallQuality: number, confidenceOverride?: number) => {
    if (submitting || current >= queue.length) return;
    setSubmitting(true);

    const item = queue[current];
    const responseTimeMs = Date.now() - startTime;

    try {
      const uiMode = pickMode(item, current);
      const result = (await reviewApi.submit({
        userVocabularyId: item.id,
        reviewMode: toSubmitMode(uiMode),
        recallQuality,
        responseTimeMs,
        confidenceLevel:
          confidenceOverride ??
          (recallQuality === 0 ? 1 : recallQuality < 3 ? 2 : recallQuality < 5 ? 4 : 5),
      })) as {
        xpGained?: number;
        currentStreak?: number;
        streakIncreased?: boolean;
        freezeUsed?: boolean;
        streakFreezes?: number;
        newBadges?: string[];
      } | undefined;

      // Surface gamification feedback immediately so progress feels rewarding
      if (result?.streakIncreased && result.currentStreak && result.currentStreak > 1) {
        toast.success(t('review.streakToast', { count: result.currentStreak }));
      }
      if (result?.freezeUsed) {
        toast.success(t('review.freezeSavedToast', { count: result.streakFreezes ?? 0 }));
      }

      setSessionXpEarned((xp) => xp + (result?.xpGained ?? 0));
      if (typeof result?.currentStreak === 'number') {
        setSessionCurrentStreak(result.currentStreak);
      }

      result?.newBadges?.forEach((badge) => {
        const name = t(`review.badges.${badge}`, { defaultValue: badge });
        toast.success(t('review.badgeToast', { name }));
      });
      if (result?.newBadges?.length) {
        setSessionNewBadges((prev) => {
          const merged = new Set([...prev, ...result.newBadges!]);
          return Array.from(merged);
        });
      }

      setSessionStats((s) => ({
        reviewed: s.reviewed + 1,
        correct: s.correct + (recallQuality >= 3 ? 1 : 0),
      }));

      // Successive relearning: re-queue a failed word so it reappears this session
      // (max 2 extra attempts per word) instead of disappearing until next due.
      let workingQueue = queue;
      const MAX_RELEARN = 2;
      const relearns = relearnRef.current[item.id] ?? 0;
      if (recallQuality <= 2 && relearns < MAX_RELEARN) {
        relearnRef.current[item.id] = relearns + 1;
        workingQueue = [...queue];
        const insertAt = Math.min(workingQueue.length, current + 4);
        workingQueue.splice(insertAt, 0, item);
        setQueue(workingQueue);
      }

      const next = current + 1;
      if (next >= workingQueue.length) {
        setPhase('done');
      } else {
        setCurrent(next);
        // Pre-warm the item after next so audio is ready 2 flips ahead
        const upcoming = workingQueue[next + 1];
        if (upcoming?.vocabularyBase.audioUrl) {
          preloadAudio(upcoming.vocabularyBase.audioUrl);
        }
        setShowAnswer(false);
        setPhase('card');
        setStartTime(Date.now());
      }
    } catch {
      // ignore error, let user retry
    } finally {
      setSubmitting(false);
    }
  };

  const title = pathTitle ? `🗺️ ${pathTitle}` : getTitle(filter, t);

  if (phase === 'loading' || phase === 'redirecting') {
    return (
      <AppShell title={title} theme="light">
        <div className="px-4 space-y-4">
          {[1, 2].map((i) => <SkeletonCard key={i} light />)}
        </div>
      </AppShell>
    );
  }

  if (phase === 'idle') {
    if (userPathId) {
      return (
        <AppShell title={title} theme="light">
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <p className="text-6xl mb-4 animate-bounce-soft">🎉</p>
            <h2 className="text-h1 text-[var(--color-ink)]">{t('review.pathDoneTitle')}</h2>
            <p className="text-[var(--color-ink-3)] mt-2">
              {t('review.pathDoneSubtitle')}
            </p>
            <button
              onClick={() => navigate('/roadmap')}
              className="press mt-6 rounded-2xl px-5 py-2.5 text-sm font-display font-bold text-white shadow-coral"
              style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
            >
              {t('review.backToRoadmap')}
            </button>
          </div>
        </AppShell>
      );
    }
    return (
      <AppShell title={title} theme="light">
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <p className="text-6xl mb-4 animate-bounce-soft">🎉</p>
          <h2 className="text-h1 text-[var(--color-ink)]">{t('review.allCaughtUp')}</h2>
          <p className="text-[var(--color-ink-3)] mt-2">{t('review.noDueCards')}</p>
          {filter && filter !== 'all' && (
            <button
              onClick={() => navigate('/review/all')}
              className="mt-6 text-sm font-semibold underline"
              style={{ color: 'var(--color-coral)' }}
            >
              {t('review.reviewAllInstead')}
            </button>
          )}
        </div>
      </AppShell>
    );
  }

  if (phase === 'done') {
    const accuracy = sessionStats.reviewed > 0
      ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100)
      : 0;

    const primaryAction = currentPathStageId ? (
      <button
        onClick={() => navigate(`/dialogue/${currentPathStageId}`)}
        className="press w-full text-white px-8 py-3 rounded-2xl font-display font-bold shadow-coral"
        style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
      >
        {t('review.viewDialogue')}
      </button>
    ) : (
      <button
        onClick={loadQueue}
        className="press w-full text-white px-8 py-3 rounded-2xl font-display font-bold shadow-coral"
        style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
      >
        {t('review.reviewAgain')}
      </button>
    );

    const secondaryAction = currentPathStageId ? (
      <button
        onClick={loadQueue}
        className="press w-full rounded-2xl px-4 py-3 text-sm font-semibold bg-[var(--color-card-2)] text-[var(--color-ink-2)] border border-[var(--color-line)]"
      >
        {t('review.studyAgain')}
      </button>
    ) : userPathId ? (
      <button
        onClick={() => navigate('/roadmap')}
        className="press w-full rounded-2xl px-4 py-3 text-sm font-semibold bg-[var(--color-card-2)] text-[var(--color-ink-2)] border border-[var(--color-line)]"
      >
        {t('review.backToRoadmap')}
      </button>
    ) : undefined;

    return (
      <AppShell title={title} theme="light">
        <SessionCelebration
          reviewed={sessionStats.reviewed}
          accuracy={accuracy}
          xpEarned={sessionXpEarned}
          currentStreak={sessionCurrentStreak}
          newBadges={sessionNewBadges}
          stageMode={!!currentPathStageId}
          light={true}
          primaryAction={primaryAction}
          secondaryAction={secondaryAction}
        />
      </AppShell>
    );
  }

  const item = queue[current];
  const itemMode = pickMode(item, current);

  return (
    <AppShell title={title} theme="light">
      <div className="px-4 pb-6 flex flex-col gap-4">

        {/* Progress */}
        <div className="flex items-center gap-3">
          <ProgressBar value={((current + 1) / queue.length) * 100} className="flex-1" tone="coral" />
          <span className="text-xs text-[var(--color-ink-3)] shrink-0">
            {current + 1} / {queue.length}
          </span>
        </div>

        {itemMode === 'type_answer' ? (
          /* Active recall — type the translation */
          <TypeAnswer
            key={item.id}
            item={item}
            disabled={submitting}
            light={true}
            onComplete={(quality, confidence) => handleRate(quality, confidence)}
          />
        ) : itemMode === 'reverse' ? (
          /* Reverse recall — show meaning, learner types the source term */
          <ReverseExercise
            key={item.id}
            item={item}
            disabled={submitting}
            light={true}
            onComplete={(quality, confidence) => handleRate(quality, confidence)}
          />
        ) : itemMode === 'multiple_choice' ? (
          /* Low-friction recognition drill with four options */
          <MultipleChoiceExercise
            key={item.id}
            item={item}
            allItems={queue}
            disabled={submitting}
            light={true}
            onComplete={(quality, confidence) => handleRate(quality, confidence)}
          />
        ) : itemMode === 'listening' ? (
          /* Listening recall — hear audio then type what you heard */
          <ListeningExercise
            key={item.id}
            item={item}
            disabled={submitting}
            light={true}
            onComplete={(quality, confidence) => handleRate(quality, confidence)}
          />
        ) : itemMode === 'context' ? (
          /* Application — fill the missing word into its example sentence */
          <ContextExercise
            key={item.id}
            item={item}
            disabled={submitting}
            light={true}
            onComplete={(quality, confidence) => handleRate(quality, confidence)}
          />
        ) : (
          <>
            {/* Flash card — recognition for new/weak words */}
            <FlashCard item={item} isFlipped={showAnswer} light={true} onFlip={handleReveal} />
            {showAnswer && <RatingButtons onRate={handleRate} disabled={submitting} light={true} />}
          </>
        )}

      </div>
    </AppShell>
  );
}
