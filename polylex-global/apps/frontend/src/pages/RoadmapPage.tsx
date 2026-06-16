import { useState, useEffect, useCallback } from 'react';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { pathApi } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
import PathCard, { PathDto } from '@/components/roadmap/PathCard';
import PathGeneratorSheet from '@/components/roadmap/PathGeneratorSheet';
import SkeletonCard from '@/components/ui/SkeletonCard';

export default function RoadmapPage() {
  const { t } = useTranslation();
  const [paths, setPaths] = useState<PathDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);

  const loadPaths = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await pathApi.getMyPaths();
      setPaths(data as PathDto[]);
    } catch {
      setPaths([]);
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

  const topBarAction = (
    <button
      onClick={() => setShowGenerator(true)}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-all press"
      style={{ background: 'color-mix(in srgb, var(--color-coral) 12%, white)' }}
      title={t('roadmap.createNew')}
    >
      <Plus size={20} style={{ color: 'var(--color-coral)' }} />
    </button>
  );

  return (
    <AppShell title={t('roadmap.title')} rightAction={topBarAction} theme="light">
      <div className="px-4 pb-6">
        {isLoading ? (
          <div className="space-y-4">
            <SkeletonCard light />
            <SkeletonCard light />
          </div>
        ) : paths.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 text-6xl animate-bounce-soft">🗺️</span>
            <h3 className="mb-2 text-h2 text-[var(--color-ink)]">
              {t('roadmap.emptyTitle')}
            </h3>
            <p className="mb-6 text-sm text-[var(--color-ink-3)]">
              {t('roadmap.emptySubtitle')}
            </p>
            <button
              onClick={() => setShowGenerator(true)}
              className="press rounded-2xl px-6 py-3 text-sm font-display font-bold text-white shadow-coral"
              style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
            >
              {t('roadmap.createFirst')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
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
    </AppShell>
  );
}
