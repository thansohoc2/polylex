import { AnimatePresence, motion } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  theme?: 'dark' | 'light';
}

export default function BottomSheet({ isOpen, onClose, title, children, theme = 'dark' }: BottomSheetProps) {
  const isLight = theme === 'light';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 rounded-t-3xl"
            style={{
              background: isLight ? 'var(--color-card)' : '#1A1A2E',
              maxHeight: '85vh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: isLight ? 'var(--color-line)' : 'rgba(255,255,255,0.2)' }}
              />
            </div>

            {title && (
              <div
                className="px-5 pb-3 border-b"
                style={{ borderColor: isLight ? 'var(--color-line)' : 'rgba(255,255,255,0.05)' }}
              >
                <h3
                  className="font-semibold text-base"
                  style={{ color: isLight ? 'var(--color-ink)' : '#F1F5F9' }}
                >
                  {title}
                </h3>
              </div>
            )}

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 60px)' }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
