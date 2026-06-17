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

export default function BottomNav({ theme = 'dark' }: { theme?: 'dark' | 'light' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const light = theme === 'light';
  const activeColor = light ? 'var(--color-coral)' : '#6366F1';
  const idleColor = light ? 'var(--color-ink-3)' : '#475569';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto flex items-stretch justify-around"
      style={{
        background: light ? 'rgba(251, 246, 242, 0.92)' : 'rgba(15, 15, 26, 0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: light ? '1px solid var(--color-line)' : '1px solid rgba(255,255,255,0.05)',
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
