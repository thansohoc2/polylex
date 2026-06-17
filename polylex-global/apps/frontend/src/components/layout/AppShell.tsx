import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import QuickNoteFab from '../quick-note/QuickNoteFab';

interface AppShellProps {
  title: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

export default function AppShell({ title, rightAction, children, theme = 'dark' }: AppShellProps) {
  const location = useLocation();

  return (
    <div
      className="min-h-screen max-w-md mx-auto relative"
      style={{ background: theme === 'light' ? 'var(--color-canvas)' : '#0F0F1A' }}
    >
      <TopBar title={title} rightAction={rightAction} theme={theme} />

      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="pt-14 pb-24 min-h-screen overflow-y-auto"
        >
          {children}
        </motion.main>
      </AnimatePresence>

      <BottomNav theme={theme} />
      <QuickNoteFab />

    </div>
  );
}
