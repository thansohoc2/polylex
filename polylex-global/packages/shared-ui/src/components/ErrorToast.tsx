import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import styles from './ErrorToast.module.css';

export type ToastVariant = 'error' | 'success' | 'info';

export interface ErrorToastProps {
  message: string;
  variant?: ToastVariant;
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
  closeLabel?: string;
  className?: string;
}

/** Inline semantic toast. The default remains `error` for backwards compatibility. */
export function ErrorToast({
  message,
  variant = 'error',
  autoClose = true,
  duration = 3000,
  onClose,
  closeLabel = 'Close notification',
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
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      aria-live={variant === 'error' ? 'assertive' : 'polite'}
      className={[styles.toast, styles[variant], className].filter(Boolean).join(' ')}
    >
      <span className={styles.icon} aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          {variant === 'success' ? (
            <polyline points="8 12 11 15 16 9" />
          ) : (
            <>
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </>
          )}
        </svg>
      </span>
      <span className={styles.message}>{message}</span>
      <button
        type="button"
        className={styles.closeBtn}
        aria-label={closeLabel}
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
  variant: ToastVariant;
}

export interface ToastController {
  /** Backwards-compatible error toast method. */
  show: (message: string) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ErrorToastContext = createContext<ToastController | null>(null);

let _nextId = 0;

export function ErrorToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'error') => {
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const show = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showError = useCallback((message: string) => showToast(message, 'error'), [showToast]);
  const showSuccess = useCallback((message: string) => showToast(message, 'success'), [showToast]);
  const showInfo = useCallback((message: string) => showToast(message, 'info'), [showToast]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ErrorToastContext.Provider value={{ show, showError, showSuccess, showInfo, showToast }}>
      {children}
      <div className={styles.container} aria-label="Notifications">
        {toasts.map((t) => (
          <ErrorToast key={t.id} message={t.message} variant={t.variant} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ErrorToastContext.Provider>
  );
}

/** Call `useErrorToast().show('message')` from any component under `<ErrorToastProvider>`. */
export function useErrorToast(): ToastController {
  const ctx = useContext(ErrorToastContext);
  if (!ctx) throw new Error('useErrorToast must be used inside <ErrorToastProvider>');
  return ctx;
}

/** Variant-oriented alias for new consumers. */
export const useToast = useErrorToast;
export const Toast = ErrorToast;
export type ToastProps = ErrorToastProps;
