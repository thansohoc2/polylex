import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** @deprecated Playful Light is now the only Web theme. */
  theme?: 'dark' | 'light';
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const reduceMotion = useReducedMotion();

  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    sheetRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            aria-label={title ? undefined : 'Dialog'}
            tabIndex={-1}
            initial={reduceMotion ? { y: 0 } : { y: '100%' }}
            animate={{ y: 0 }}
            exit={reduceMotion ? { y: 0 } : { y: '100%' }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-50 rounded-t-3xl outline-none"
            style={{
              background: 'var(--color-card)',
              maxHeight: '85vh',
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div
                className="w-10 h-1 rounded-full"
                style={{ background: 'var(--color-line)' }}
              />
            </div>

            {title && (
              <div className="px-5 pb-3 border-b border-[var(--color-line)]">
                <h3 id={titleId} className="font-semibold text-base text-[var(--color-ink)]">
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
    </AnimatePresence>,
    document.body,
  );
}
