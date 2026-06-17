import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuickNote } from '@/contexts/QuickNoteContext';

/**
 * Global floating action button for capturing a quick note from anywhere in the
 * app. Rendered once at the protected-shell level so it persists across route
 * changes. Opening it shows a bottom sheet (no navigation), so the user never
 * loses their place. It can be dragged vertically if it covers content.
 */
export default function QuickNoteFab() {
  const { t } = useTranslation();
  const { openSheet, sheetOpen, pendingCount } = useQuickNote();
  const location = useLocation();

  // Hide while an active review exercise is running so it never overlaps the
  // answer / continue controls, and while the sheet itself is open.
  const inReviewSession = location.pathname.startsWith('/review');
  const hidden = sheetOpen || inReviewSession;

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.button
          key="quick-note-fab"
          drag="y"
          dragConstraints={{ top: -360, bottom: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          onClick={openSheet}
          aria-label={t('quicknote.newNote')}
          className="absolute right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full"
          style={{
            // Sit just above the 64px bottom nav + iOS safe area.
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
            background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))',
            boxShadow: '0 8px 24px rgba(255, 107, 74, 0.45)',
            touchAction: 'none',
          }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />

          {pendingCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold"
              style={{
                background: '#fff',
                color: 'var(--color-coral)',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              {pendingCount}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
