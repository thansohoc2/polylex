import { useTranslation } from 'react-i18next';
import StageRow, { PathStageDto } from './StageRow';

export interface PathDto {
  id: string;
  pathTemplateId: string;
  title: string;
  description?: string | null;
  emoji: string;
  totalWords: number;
  currentStageOrder: number;
  completedAt?: string | null;
  stages: PathStageDto[];
}

interface Props {
  path: PathDto;
  onStageComplete: (userPathStageId: string) => void;
}

export default function PathCard({ path, onStageComplete }: Props) {
  const { t } = useTranslation();
  const completedCount = path.stages.filter((s) => s.isCompleted).length;
  const total = path.stages.length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="rounded-[var(--radius-card)] p-5 bg-[var(--color-card)] shadow-soft">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none">{path.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-display font-bold text-[var(--color-ink)] leading-tight">{path.title}</h3>
            {path.description && (
              <p className="mt-0.5 text-xs text-[var(--color-ink-3)]">{path.description}</p>
            )}
          </div>
          {path.completedAt && (
            <span
              className="flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold"
              style={{ background: 'color-mix(in srgb, var(--color-ok) 14%, white)', color: 'var(--color-ok)' }}
            >
              {t('roadmap.done')}
            </span>
          )}
        </div>

        {/* Overall progress */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-[var(--color-ink-3)] mb-1">
            <span>{t('roadmap.stages', { completed: completedCount, total })}</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden bg-[var(--color-line)]">
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${progressPct}%`,
                background: path.completedAt
                  ? 'linear-gradient(90deg, var(--color-ok), #34D399)'
                  : 'linear-gradient(90deg, var(--color-coral), var(--color-coral-2))',
              }}
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mb-4 h-px bg-[var(--color-line)]" />

      {/* Stages */}
      <div>
        {path.stages.map((stage, i) => (
          <StageRow
            key={stage.id}
            stage={stage}
            isLast={i === path.stages.length - 1}
            onComplete={() => onStageComplete(stage.id)}
            userPathId={path.id}
          />
        ))}
      </div>
    </div>
  );
}
