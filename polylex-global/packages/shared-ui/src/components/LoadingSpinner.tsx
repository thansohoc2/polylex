import styles from './LoadingSpinner.module.css';
import type { LoadingSpinnerSize, LoadingSpinnerVariant } from '../types';

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  variant?: LoadingSpinnerVariant;
  /** 'primary' = #0084FF (Zalo blue), 'white' = suited for dark buttons, 'inherit' = from parent */
  color?: 'primary' | 'white' | 'inherit';
  className?: string;
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function LoadingSpinner({
  size = 'md',
  variant = 'ring',
  color = 'primary',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        styles.spinner,
        styles[`size-${size}`],
        styles[`variant-${variant}`],
        styles[`color-${color}`],
        className,
      )}
    >
      {variant === 'ring' && <div className={styles['spinner-inner']} />}

      {variant === 'dots' && (
        <div className={styles['spinner-inner']}>
          <div className={styles.dot} />
          <div className={styles.dot} />
          <div className={styles.dot} />
        </div>
      )}

      {variant === 'bars' && (
        <div className={styles['spinner-inner']}>
          <div className={styles.bar} style={{ height: '60%' }} />
          <div className={styles.bar} style={{ height: '80%' }} />
          <div className={styles.bar} style={{ height: '100%' }} />
          <div className={styles.bar} style={{ height: '70%' }} />
        </div>
      )}
    </div>
  );
}
