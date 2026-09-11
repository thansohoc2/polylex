import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { AsyncState } from '@polylex/shared-ui';
import { pathApi } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
import PathCard, { PathDto } from '@/components/roadmap/PathCard';
import PathGeneratorSheet from '@/components/roadmap/PathGeneratorSheet';
import SkeletonCard from '@/components/ui/SkeletonCard';
import Button from '@/components/ui/Button';

export default function RoadmapPage() {
  const { t } = useTranslation();
  const [paths, setPaths] = useState<PathDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);

  const loadPaths = useCallback(async () => {
    setIsLoading(true);
    setLoadFailed(false);
    try {
      const data = await pathApi.getMyPaths();
      setPaths(data as PathDto[]);
    } catch {
      setPaths([]);
      setLoadFailed(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPaths();
  }, [loadPaths]);

  const handleStageComplete = async (userPathStageId: string) => {
    try {
      const result = await pathApi.completeStage(userPathStageId);
      toast.success(
        result?.nextStageUnlocked
          ? t('roadmap.stageCompletedWithUnlock')
          : t('roadmap.stageCompleted'),
      );
      await loadPaths();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? t('roadmap.failedToComplete'));
    }
  };

  const handleCreated = (newPath: PathDto) => {
    setPaths((prev) => [newPath, ...prev]);
  };

  return (
    <AppShell title={t('roadmap.title')}>
      <div className="px-4 pb-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : loadFailed ? (
          <AsyncState
            status="error"
            errorMessage={t('generator.failed')}
            retryLabel={t('review.tryAgain')}
            onRetry={() => void loadPaths()}
          />
        ) : paths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-6xl animate-bounce-soft">🗺️</span>
            <h3 className="mb-2 text-h2 text-[var(--color-ink)]">
              {t('roadmap.emptyTitle')}
            </h3>
            <p className="mb-6 text-sm text-[var(--color-ink-3)]">
              {t('roadmap.emptySubtitle')}
            </p>
            <Button onClick={() => setShowGenerator(true)}>
              {t('roadmap.createFirst')}
            </Button>
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2">
            {paths.map((path) => (
              <PathCard
                key={path.id}
                path={path}
                onStageComplete={handleStageComplete}
              />
            ))}
          </div>
        )}
      </div>

      <PathGeneratorSheet
        isOpen={showGenerator}
        onClose={() => setShowGenerator(false)}
        onCreated={handleCreated}
      />

      {!showGenerator && (
        <button
          type="button"
          onClick={() => setShowGenerator(true)}
          aria-label={t('roadmap.createNew')}
          title={t('roadmap.createNew')}
          className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 50px) + 140px)',
            background: 'linear-gradient(135deg, var(--color-grape), var(--color-grape-dark))',
            boxShadow: '0 8px 24px rgba(101, 69, 214, 0.45)',
          }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </button>
      )}
    </AppShell>
  );
}
