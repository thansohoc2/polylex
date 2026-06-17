import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pathApi, type VideoDto, type PathDto } from '@/api/client';
import AppShell from '@/components/layout/AppShell';

interface HubVideo extends VideoDto {
  pathStageId: string;
  stageTitle: string;
  pathEmoji: string;
}

export default function VideosHubPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<HubVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const paths = (await pathApi.getMyPaths()) as PathDto[];

      // Collect every stage that has videos across all enrolled paths
      const stagesWithVideos = paths.flatMap((p) =>
        p.stages
          .filter((s) => s.hasVideos)
          .map((s) => ({ pathStageId: s.pathStageId, stageTitle: s.title, pathEmoji: p.emoji })),
      );

      // Fetch each stage's videos in parallel (fail-safe per stage)
      const results = await Promise.all(
        stagesWithVideos.map(async (stage) => {
          try {
            const res = await pathApi.getStageVideos(stage.pathStageId);
            return res.data.map((v) => ({
              ...v,
              pathStageId: stage.pathStageId,
              stageTitle: stage.stageTitle,
              pathEmoji: stage.pathEmoji,
            }));
          } catch {
            return [] as HubVideo[];
          }
        }),
      );

      setVideos(results.flat());
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title={t('videosHub.title')} theme="light">
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-coral)]" />
          <span className="ml-3 text-sm text-[var(--color-ink-3)]">{t('videosHub.loading')}</span>
        </div>
      </AppShell>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────────
  if (videos.length === 0) {
    return (
      <AppShell title={t('videosHub.title')} theme="light">
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-5xl mb-4">📹</p>
          <h3 className="font-semibold text-base" style={{ color: 'var(--color-ink)' }}>
            {t('videosHub.empty')}
          </h3>
          <p className="text-sm mt-1 mb-6" style={{ color: 'var(--color-ink-3)' }}>
            {t('videosHub.emptyHint')}
          </p>
          <button
            onClick={() => navigate('/roadmap')}
            className="px-5 py-2.5 rounded-xl font-semibold text-white text-sm"
            style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
          >
            {t('videosHub.goToRoadmap')}
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <AppShell title={t('videosHub.title')} theme="light">
      <div className="px-4 pt-3 pb-2">
        <p className="text-sm text-[var(--color-ink-3)]">{t('videosHub.subtitle')}</p>
        <p className="text-xs text-[var(--color-ink-3)] mt-0.5">
          {t('videosHub.videosCount', { count: videos.length })}
        </p>
      </div>

      <div className="px-4 py-2 flex flex-col gap-6 pb-16">
        {videos.map((video) => {
          const isExpanded = expandedVideoId === video.id;
          const videoEmbedUrl = `https://www.youtube.com/embed/${video.youtubeVideoId}?modestbranding=1&controls=1&rel=0`;

          return (
            <div
              key={video.id}
              className="rounded-2xl overflow-hidden border transition-all"
              style={{
                background: 'var(--color-card)',
                borderColor: isExpanded ? 'var(--color-coral)' : 'var(--color-line)',
              }}
            >
              {isExpanded ? (
                <div className="w-full aspect-video">
                  <iframe
                    width="100%"
                    height="100%"
                    src={videoEmbedUrl}
                    title={video.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button
                  onClick={() => setExpandedVideoId(video.id)}
                  className="w-full aspect-video relative group overflow-hidden"
                >
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'var(--color-coral)' }}>
                      <span className="text-2xl">▶️</span>
                    </div>
                  </div>
                </button>
              )}

              <div className="p-4">
                {/* Stage context chip */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm">{video.pathEmoji}</span>
                  <span className="text-xs font-medium text-[var(--color-coral)] line-clamp-1">
                    {video.stageTitle}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-ink)] line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs text-[var(--color-ink-3)] mt-1">{video.channelTitle}</p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-[var(--color-ink-3)]">
                    {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
                  <p className="text-xs text-[var(--color-ink-2)] leading-relaxed">{video.aiReason}</p>
                </div>

                {isExpanded && (
                  <button
                    onClick={() => setExpandedVideoId(null)}
                    className="mt-3 text-xs text-[var(--color-ink-3)]"
                  >
                    ✕ {t('dialogue.backBtn')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
}
