import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { pathApi, VideoDto } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
// 1. Sử dụng thư viện chuẩn của Capgo
import { YoutubePlayer } from '@capgo/capacitor-youtube-player';

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

    // 2. Cập nhật hàm xử lý khởi tạo chuẩn cú pháp phẳng của Capgo
   // 2. Hàm xử lý khởi tạo chuẩn với tham số khắc phục lỗi 152
  const handlePlayVideo = async (videoId: string, youtubeVideoId: string) => {
    if (expandedVideoId && expandedVideoId !== videoId) {
      try {
        await YoutubePlayer.destroy({ playerId: `player-${expandedVideoId}` });
      } catch (e) {
        console.warn(e);
      }
    }

    setExpandedVideoId(videoId);
    
    // Đợi React cập nhật xong DOM
    setTimeout(async () => {
      try {
        await YoutubePlayer.initialize({
          playerId: `player-${videoId}`,
          videoId: youtubeVideoId,
          playerSize: {
            width: window.innerWidth - 32,
            height: Math.floor((window.innerWidth - 32) * 9 / 16),
          },
          // BẮT BUỘC: Kích hoạt chế độ không Cookie (youtube-nocookie.com) 
          // Đây là chìa khóa để vượt qua bộ lọc chặn Origin (Lỗi 152) của YouTube trên WebView
          privacyEnhanced: true, 
        });
      } catch (err) {
        console.error("Lỗi khởi tạo Youtube Player Native: ", err);
      }
    }, 150);
  };

  // 3. Giữ nguyên hàm tắt trình phát theo chuẩn Object ID
  const handleStopVideo = async () => {
    if (expandedVideoId) {
      try {
        await YoutubePlayer.destroy({ playerId: `player-${expandedVideoId}` });
      } catch (err) {
        console.error("Lỗi destroy player: ", err);
      }
    }
    setExpandedVideoId(null);
  };


  // Tự động giải phóng trình phát khi thoát component
  useEffect(() => {
    return () => {
      if (expandedVideoId) {
        YoutubePlayer.destroy({ playerId: `player-${expandedVideoId}` }).catch(() => {});
      }
    };
  }, [expandedVideoId]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppShell title={t('review.viewVideos')} theme="light">
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-coral)]" />
          <span className="ml-3 text-sm text-[var(--color-ink-3)]">{t('dialogue.loading')}</span>
        </div>
      </AppShell>
    );
  }

  // ── Error / empty ────────────────────────────────────────────────────────────
  if (error || videos.length === 0) {
    return (
      <AppShell title={t('review.viewVideos')} theme="light">
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <p className="text-4xl mb-4">📹</p>
          <p className="text-[var(--color-ink-3)]">
            {error ? t('dialogue.loadError') : t('dialogue.noDialogue')}
          </p>
          <button onClick={() => navigate(-1)} className="mt-6 text-sm text-[var(--color-coral)]">
            {t('dialogue.backBtn')}
          </button>
        </div>
      </AppShell>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────────
  return (
    <AppShell title={stageTitle || t('review.viewVideos')} theme="light">
      {/* Sticky toolbar */}
      <div
        className="px-4 pt-2 pb-3 flex items-center gap-3 sticky top-0 z-10"
        style={{
          background: 'rgba(251,246,242,0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--color-line)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-[var(--color-ink-3)] hover:text-[var(--color-ink)] transition-colors"
        >
          {t('dialogue.backBtn')}
        </button>
        <span className="flex-1" />
        <span className="text-xs text-[var(--color-ink-3)]">
          {videos.length} {videos.length > 1 ? 'videos' : 'video'}
        </span>
      </div>

      {/* Video list */}
      <div className="px-4 py-4 flex flex-col gap-6 pb-16">
        {videos.map((video) => {
          const isExpanded = expandedVideoId === video.id;

          return (
            <div
              key={video.id}
              className="rounded-2xl overflow-hidden border transition-all"
              style={{
                background: 'var(--color-card)',
                borderColor: isExpanded ? 'var(--color-coral)' : 'var(--color-line)',
              }}
            >
              {/* Khu vực chứa video phát */}
              {isExpanded ? (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  {/* Div đích để trình phát native đè lên */}
                  <div 
                    id={`player-${video.id}`} 
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <button
                  onClick={() => handlePlayVideo(video.id, video.youtubeVideoId)}
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
                        background: 'var(--color-coral)',
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
                    <p className="text-sm font-semibold text-[var(--color-ink)] line-clamp-2">
                      {video.title}
                    </p>
                    <p className="text-xs text-[var(--color-ink-3)] mt-1">
                      {video.channelTitle}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-[var(--color-ink-3)]">
                    {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, '0')}
                  </span>
                </div>

                {/* AI reason chip */}
                <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
                  <p className="text-xs text-[var(--color-ink-2)] leading-relaxed">
                    {video.aiReason}
                  </p>
                </div>

                {/* Thu gọn video button */}
                {isExpanded && (
                  <button
                    onClick={handleStopVideo}
                    className="mt-3 w-full text-xs text-center text-[var(--color-ink-3)] hover:text-[var(--color-ink)] py-2 transition-colors"
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
