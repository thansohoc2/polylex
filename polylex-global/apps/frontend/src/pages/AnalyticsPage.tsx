import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '@/api/client';
import { HeatmapEntry, VelocityEntry, RetentionRateDto } from '@polylex/shared-types';
import AppShell from '@/components/layout/AppShell';

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
  const [velocity, setVelocity] = useState<VelocityEntry[]>([]);
  const [retention, setRetention] = useState<RetentionRateDto | null>(null);

  useEffect(() => {
    analyticsApi.getHeatmap(90).then(setHeatmap).catch(() => {});
    analyticsApi.getVelocity(8).then(setVelocity).catch(() => {});
    analyticsApi.getRetention().then(setRetention).catch(() => {});
  }, []);

  const maxHeatCount = Math.max(1, ...heatmap.map((h) => h.count));

  return (
    <AppShell title={t('analytics.title')} theme="light">
      <div className="px-4 pb-6 space-y-6">
        {/* Retention rate */}
        {retention && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t('analytics.reviews30d'), value: retention.total },
              { label: t('analytics.passed'), value: retention.passed },
              { label: t('analytics.retentionRate'), value: `${retention.retentionPercent}%`, highlight: true },
            ].map(({ label, value, highlight }) => (
              <div
                key={label}
                className={`rounded-2xl p-4 text-center shadow-soft ${
                  highlight ? 'bg-grape text-white' : 'bg-card'
                }`}
              >
                <p className={`text-sm ${highlight ? 'text-white/80' : 'text-ink-2'}`}>{label}</p>
                <p
                  className={`text-3xl font-bold mt-1 font-display ${
                    highlight ? 'text-white' : 'text-ink'
                  }`}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Activity heatmap */}
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <h3 className="font-semibold text-ink mb-4">{t('analytics.heatmapTitle')}</h3>
          {heatmap.length === 0 ? (
            <p className="text-ink-3 text-sm">{t('analytics.noActivity')}</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {heatmap.map(({ date, count }) => {
                const intensity = Math.min(1, count / maxHeatCount);
                const opacity = 0.2 + intensity * 0.8;
                return (
                  <div
                    key={date}
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: `rgba(255, 107, 74, ${opacity})` }}
                    title={t('analytics.heatmapTooltip', { date, count })}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly velocity */}
        <div className="bg-card rounded-2xl p-5 shadow-soft">
          <h3 className="font-semibold text-ink mb-4">{t('analytics.velocityTitle')}</h3>
          {velocity.length === 0 ? (
            <p className="text-ink-3 text-sm">{t('analytics.noVelocity')}</p>
          ) : (
            <div className="space-y-2.5">
              {velocity.map(({ week, wordsLearned }) => (
                <div key={week} className="flex items-center gap-3">
                  <span className="text-xs text-ink-3 w-14 shrink-0">W{week.split('-')[1]}</span>
                  <div className="flex-1 bg-line rounded-full h-5 overflow-hidden">
                    <div
                      className="h-5 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          (wordsLearned / Math.max(1, ...velocity.map((v) => v.wordsLearned))) * 100
                        )}%`,
                        background: 'linear-gradient(90deg, var(--color-coral), var(--color-coral-2))',
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-ink w-12 text-right">{wordsLearned}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
