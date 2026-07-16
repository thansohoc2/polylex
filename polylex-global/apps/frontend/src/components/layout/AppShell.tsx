import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import QuickNoteFab from '../quick-note/QuickNoteFab';
import { useTranslation } from 'react-i18next';

interface AppShellProps {
  title: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  /** @deprecated Playful Light is now the only Web theme. */
  theme?: 'dark' | 'light';
}

export default function AppShell({ title, rightAction, children }: AppShellProps) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen w-full max-w-screen-xl mx-auto relative bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <a
        href="#main-content"
        className="visually-hidden focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:h-auto focus:w-auto focus:overflow-visible focus:rounded-xl focus:bg-[var(--color-card)] focus:px-4 focus:py-3 focus:text-[var(--color-ink)] focus:shadow-soft"
      >
        {t('a11y.skipToContent')}
      </a>
      <TopBar title={title} rightAction={rightAction} />

      <AnimatePresence mode="wait">
        <motion.main
          id="main-content"
          tabIndex={-1}
          key={location.pathname}
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pt-14 pb-24 min-h-screen overflow-y-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <BottomNav />
      <QuickNoteFab />
    </div>
  );
}
