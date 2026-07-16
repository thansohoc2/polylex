import {
  useEffect,
  useId,
  useRef,
  type DialogHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import styles from './Dialog.module.css';

export interface DialogProps
  extends Omit<
    DialogHTMLAttributes<HTMLDialogElement>,
    'children' | 'onCancel' | 'onClose' | 'open' | 'title'
  > {
  open: boolean;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
}

/** Controlled native dialog with browser-managed focus containment. */
export function Dialog({
  open,
  title,
  description,
  children,
  footer,
  closeLabel = 'Close dialog',
  initialFocusRef,
  onClose,
  className,
  ...dialogProps
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedId = useId().replace(/:/g, '');
  const titleId = `dialog-${generatedId}-title`;
  const descriptionId = description ? `dialog-${generatedId}-description` : undefined;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      initialFocusRef?.current?.focus();
      return;
    }

    if (!open && dialog.open) dialog.close();
    if (!open && previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [initialFocusRef, open]);

  useEffect(
    () => () => {
      previousFocusRef.current?.focus();
    },
    [],
  );

  return (
    <dialog
      {...dialogProps}
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal="true"
      className={[styles.dialog, className].filter(Boolean).join(' ')}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.header}>
        <div>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className={styles.description}>
              {description}
            </p>
          )}
        </div>
        <button type="button" className={styles.close} aria-label={closeLabel} onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className={styles.content}>{children}</div>
      {footer && <div className={styles.footer}>{footer}</div>}
    </dialog>
  );
}
