import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import styles from './ErrorToast.module.css';

export interface ErrorToastProps {
  message: string;
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
  className?: string;
}

/** Inline error-toast. Renders directly in the component tree. */
export function ErrorToast({
  message,
  autoClose = true,
  duration = 3000,
  onClose,
  className,
}: ErrorToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!autoClose) return;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [autoClose, duration]);

  useEffect(() => {
    if (!visible) onClose?.();
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div role="alert" className={[styles.toast, className].filter(Boolean).join(' ')}>
      <span className={styles.icon} aria-hidden="true">
        {/* alert-circle icon (inline SVG, no external deps) */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </span>
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.closeBtn}
        aria-label="Đóng thông báo"
        onClick={() => setVisible(false)}
      >
        ✕
      </button>
    </div>
  );
}

/* ============================================================
   Context-based global toast provider
   ============================================================ */

interface ToastEntry {
  id: number;
  message: string;
}

interface ErrorToastContextType {
  show: (message: string) => void;
}

const ErrorToastContext = createContext<ErrorToastContextType | null>(null);

let _nextId = 0;

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const show = useCallback((message: string) => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message }]);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ErrorToastContext.Provider value={{ show }}>
      {children}
      <div className={styles.container}>
        {toasts.map((t) => (
          <ErrorToast key={t.id} message={t.message} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ErrorToastContext.Provider>
  );
}

/** Call `useErrorToast().show('message')` from any component under `<ErrorToastProvider>`. */
export function useErrorToast(): ErrorToastContextType {
  const ctx = useContext(ErrorToastContext);
  if (!ctx) throw new Error('useErrorToast must be used inside <ErrorToastProvider>');
  return ctx;
}
