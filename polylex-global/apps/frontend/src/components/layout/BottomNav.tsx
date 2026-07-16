import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, RotateCcw, User, Video } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const tabs = [
  { path: '/dashboard', icon: Home, labelKey: 'nav.home' },
  { path: '/roadmap', icon: BookOpen, labelKey: 'nav.roadmap' },
  { path: '/videos', icon: Video, labelKey: 'nav.videos' },
  { path: '/review', icon: RotateCcw, labelKey: 'nav.review' },
  { path: '/profile', icon: User, labelKey: 'nav.profile' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeColor = 'var(--color-coral)';
  const idleColor = 'var(--color-ink-3)';

  return (
    <nav
      aria-label={t('nav.primary', { defaultValue: 'Primary navigation' })}
      className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-screen-xl mx-auto flex items-stretch justify-around bg-[rgba(251,246,242,0.98)] border-t border-[var(--color-line)] supports-[backdrop-filter]:bg-[rgba(251,246,242,0.92)]"
      style={{
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(64px + env(safe-area-inset-bottom))',
      }}
    >
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/');
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-w-[44px]"
            aria-label={t(tab.labelKey)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon
              size={22}
              style={{ color: isActive ? activeColor : idleColor }}
              strokeWidth={isActive ? 2.5 : 2}
            />
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? activeColor : idleColor }}
            >
              {t(tab.labelKey)}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
