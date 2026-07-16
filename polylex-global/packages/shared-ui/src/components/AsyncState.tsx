import type { ReactNode } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import styles from './AsyncState.module.css';

export type AsyncStateStatus = 'loading' | 'empty' | 'error' | 'success';

export interface AsyncStateProps {
  status: AsyncStateStatus;
  children?: ReactNode;
  loadingLabel?: string;
  emptyTitle?: ReactNode;
  emptyMessage?: ReactNode;
  errorTitle?: ReactNode;
  errorMessage?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  retryDisabled?: boolean;
  className?: string;
}

/** Renders one explicit async branch so loading, empty, error, and content cannot overlap. */
export function AsyncState({
  status,
  children,
  loadingLabel = 'Loading',
  emptyTitle = 'Nothing here yet',
  emptyMessage,
  errorTitle = 'Something went wrong',
  errorMessage,
  retryLabel = 'Try again',
  onRetry,
  retryDisabled,
  className,
}: AsyncStateProps) {
  if (status === 'success') return <>{children}</>;

  if (status === 'loading') {
    return (
      <div role="status" aria-label={loadingLabel} className={[styles.state, className].filter(Boolean).join(' ')}>
        <span aria-hidden="true">
          <LoadingSpinner />
        </span>
        <span>{loadingLabel}</span>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div role="status" className={[styles.state, className].filter(Boolean).join(' ')}>
        <p className={styles.title}>{emptyTitle}</p>
        {emptyMessage && <p className={styles.message}>{emptyMessage}</p>}
      </div>
    );
  }

  return (
    <div role="alert" className={[styles.state, className].filter(Boolean).join(' ')}>
      <p className={styles.title}>{errorTitle}</p>
      {errorMessage && <p className={styles.message}>{errorMessage}</p>}
      {onRetry && (
        <button type="button" className={styles.retry} disabled={retryDisabled} onClick={onRetry}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
