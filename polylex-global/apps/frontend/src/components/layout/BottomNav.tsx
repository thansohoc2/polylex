import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, RotateCcw, User, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const tabs = [
  { path: '/dashboard', icon: Home, labelKey: 'nav.home', isFAB: false },
  { path: '/roadmap', icon: BookOpen, labelKey: 'nav.roadmap', isFAB: false },
  { path: '/quick-notes', icon: null, labelKey: 'nav.notes', isFAB: true },
  { path: '/review', icon: RotateCcw, labelKey: 'nav.review', isFAB: false },
  { path: '/profile', icon: User, labelKey: 'nav.profile', isFAB: false },
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
      className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto flex items-end justify-around"
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

        if (tab.isFAB) {
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center -mt-5"
              aria-label={t('nav.notes')}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg press"
                style={{
                  background: light
                    ? 'linear-gradient(135deg, var(--color-coral) 0%, var(--color-coral-2) 100%)'
                    : 'linear-gradient(135deg, #6366F1 0%, #A78BFA 100%)',
                  boxShadow: light ? 'var(--shadow-coral)' : '0 0 20px rgba(99,102,241,0.4)',
                }}
              >
                <Plus size={24} className="text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[10px] mt-1" style={{ color: idleColor }}>{t(tab.labelKey)}</span>
            </button>
          );
        }

        const Icon = tab.icon!;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[44px] min-h-[44px]"
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
