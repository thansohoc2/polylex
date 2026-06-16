import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface PathStageVocabDto {
  id: string;
  term: string;
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  cefrLevel?: string | null;
  partOfSpeech?: string | null;
  translation?: string | null;
  exampleSentence?: string | null;
}

export interface PathStageDto {
  id: string;
  order: number;
  title: string;
  description?: string | null;
  wordCount: number;
  xpReward: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  wordsLearned: number;
  pathStageId: string;
  hasDialogue: boolean;
  hasVideos: boolean;
  vocab?: PathStageVocabDto[];
}

interface Props {
  stage: PathStageDto;
  isLast: boolean;
  onComplete: () => void;
  userPathId?: string;
}

export default function StageRow({ stage, isLast, onComplete, userPathId }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const canComplete =
    stage.isUnlocked && !stage.isCompleted && stage.wordsLearned >= stage.wordCount * 0.8;

  const icon = stage.isCompleted
    ? '✅'
    : stage.isUnlocked
    ? '🔥'
    : '🔒';

  const progressPct = stage.wordCount > 0
    ? Math.round((stage.wordsLearned / stage.wordCount) * 100)
    : 0;

  return (
    <div className="relative flex gap-4 pb-6">
      {/* Vertical connector */}
      {!isLast && (
        <div className="absolute left-5 top-10 w-0.5 h-full bg-[var(--color-line)]" />
      )}

      {/* Icon circle */}
      <div
        className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg"
        style={{
          background: stage.isCompleted
            ? 'color-mix(in srgb, var(--color-ok) 14%, white)'
            : stage.isUnlocked
            ? 'color-mix(in srgb, var(--color-coral) 12%, white)'
            : 'var(--color-card-2)',
          border: stage.isCompleted
            ? '1.5px solid var(--color-ok)'
            : stage.isUnlocked
            ? '1.5px solid var(--color-coral)'
            : '1px solid var(--color-line)',
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className="text-sm font-display font-semibold"
              style={{
                color: stage.isCompleted
                  ? 'var(--color-ok)'
                  : stage.isUnlocked
                  ? 'var(--color-ink)'
                  : 'var(--color-ink-3)',
              }}
            >
              {stage.title}
            </p>
            {stage.description && (
              <p className="mt-0.5 text-xs text-[var(--color-ink-3)]">{stage.description}</p>
            )}
          </div>

          {stage.isCompleted && (
            <span
              className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'color-mix(in srgb, var(--color-ok) 14%, white)', color: 'var(--color-ok)' }}
            >
              {t('roadmap.stageCompletedBadge')}
            </span>
          )}
        </div>

        {/* Progress bar for in-progress stages */}
        {stage.isUnlocked && !stage.isCompleted && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-[var(--color-ink-3)] mb-1">
              <span>{t('roadmap.stageProgress', { learned: stage.wordsLearned, total: stage.wordCount })}</span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-[var(--color-line)]">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--color-coral), var(--color-coral-2))' }}
              />
            </div>
            <div className="mt-2 flex gap-2 flex-wrap">
              <button
                onClick={() => navigate(userPathId ? `/review/path/${userPathId}` : '/review/path')}
                className="press rounded-xl px-3 py-1.5 text-xs font-display font-bold text-white shadow-coral"
                style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
              >
                {t('roadmap.continueStudying')}
              </button>
              {canComplete && (
                <button
                  onClick={onComplete}
                  className="press rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--color-ok) 14%, white)', color: 'var(--color-ok)' }}
                >
                  {t('roadmap.completeStage')}
                </button>
              )}
              {stage.hasDialogue && (
                <button
                  onClick={() => navigate(`/dialogue/${stage.pathStageId}`)}
                  className="press rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--color-grape) 12%, white)', color: 'var(--color-grape)' }}
                >
                  💬 {t('review.viewDialogue')}
                </button>
              )}
              {stage.hasVideos && (
                <button
                  onClick={() => navigate(`/videos/${stage.pathStageId}`)}
                  className="press rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--color-bad) 10%, white)', color: 'var(--color-bad)' }}
                >
                  ▶️ {t('review.viewVideos')}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Locked state */}
        {!stage.isUnlocked && (
          <p className="mt-1 text-xs text-[var(--color-ink-3)]">{t('roadmap.stageLocked', { count: stage.wordCount })}</p>
        )}

        {/* Completed state */}
        {stage.isCompleted && (
          <>
            <p className="mt-1 text-xs text-[var(--color-ink-3)]">
              {t('roadmap.stageDone', { count: stage.wordCount, xp: stage.xpReward })}
            </p>
            <div className="mt-2 flex gap-2 flex-wrap">
              {stage.hasDialogue && (
                <button
                  onClick={() => navigate(`/dialogue/${stage.pathStageId}`)}
                  className="press rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--color-grape) 12%, white)', color: 'var(--color-grape)' }}
                >
                  💬 {t('review.viewDialogue')}
                </button>
              )}
              {stage.hasVideos && (
                <button
                  onClick={() => navigate(`/videos/${stage.pathStageId}`)}
                  className="press rounded-xl px-3 py-1.5 text-xs font-semibold"
                  style={{ background: 'color-mix(in srgb, var(--color-bad) 10%, white)', color: 'var(--color-bad)' }}
                >
                  ▶️ {t('review.viewVideos')}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
