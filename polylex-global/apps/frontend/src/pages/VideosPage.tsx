import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pathApi, VideoDto } from '@/api/client';
import AppShell from '@/components/layout/AppShell';

export default function VideosPage() {
  const { pathStageId } = useParams<{ pathStageId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [stageTitle, setStageTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedVideoId, setExpandedVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!pathStageId) return;
    pathApi
      .getStageVideos(pathStageId)
      .then((response) => {
        setVideos(response.data || []);
        setStageTitle(response.stageTitle || '');
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [pathStageId]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title={t('review.viewVideos')}>
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]" />
          <span className="ml-3 text-sm text-[#94A3B8]">{t('dialogue.loading')}</span>
        </div>
      </AppShell>
    );
  }

  // ── Error / empty ────────────────────────────────────────────────────────────
  if (error || videos.length === 0) {
    return (
      <AppShell title={t('review.viewVideos')}>
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-4xl mb-4">📹</p>
          <p className="text-[#94A3B8]">
            {error ? t('dialogue.loadError') : t('dialogue.noDialogue')}
          </p>
          <button onClick={() => navigate(-1)} className="mt-6 text-sm text-[#6366F1]">
            {t('dialogue.backBtn')}
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <AppShell title={stageTitle || t('review.viewVideos')}>
      {/* Sticky toolbar */}
      <div
        className="px-4 pt-2 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
        >
          {t('dialogue.backBtn')}
        </button>
        <span className="flex-1" />
        <span className="text-xs text-[#64748B]">
          {videos.length} {videos.length === 1 ? t('dialogue.titleDefault') : t('dialogue.titleDefault')}
        </span>
      </div>

      {/* Video list */}
      <div className="px-4 py-4 flex flex-col gap-6 pb-16">
        {videos.map((video) => {
          const isExpanded = expandedVideoId === video.id;
          const videoEmbedUrl = `https://www.youtube.com/embed/${video.youtubeVideoId}?modestbranding=1&controls=1&rel=0`;

          return (
            <div
              key={video.id}
              className="rounded-2xl overflow-hidden border transition-all"
              style={{
                background: 'rgba(30,41,59,0.6)',
                borderColor: isExpanded ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.15)',
              }}
            >
              {/* Video preview / embed */}
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
                  <div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      background: 'rgba(0,0,0,0.4)',
                    }}
                  >
                    <div className="w-12 h-12 rounded-full flex items-center justify-center" 
                      style={{
                        background: 'rgba(239,68,68,0.9)',
                      }}>
                      <span className="text-2xl">▶️</span>
                    </div>
                  </div>
                </button>
              )}

              {/* Video info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#F1F5F9] line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs text-[#64748B] mt-1">
                      {video.channelTitle}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-[#94A3B8]">
                    {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                {/* AI reason chip */}
                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.08)]">
                  <p className="text-xs text-[#94A3B8] mb-2">💡 {t('dialogue.titleDefault')}</p>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    {video.aiReason}
                  </p>
                </div>

                {/* Collapse button when expanded */}
                {isExpanded && (
                  <button
                    onClick={() => setExpandedVideoId(null)}
                    className="mt-3 w-full text-xs text-center text-[#94A3B8] hover:text-[#F1F5F9] py-2 transition-colors"
                  >
                    ▲ {t('dialogue.backBtn')}
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
