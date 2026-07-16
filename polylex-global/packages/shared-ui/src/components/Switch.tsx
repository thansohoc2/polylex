import { forwardRef, type ButtonHTMLAttributes } from 'react';
import type { FormFieldContract } from '../types/form.types';
import styles from './FormControls.module.css';
import { joinIds, useFormFieldIds } from './useFormFieldIds';

export type SwitchProps = FormFieldContract &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'disabled' | 'id' | 'role'> & {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
  };

/** A controlled switch built on a native button, preserving Enter and Space activation. */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  {
    label,
    helperText,
    error,
    required,
    disabled,
    id,
    helperTextId,
    errorId,
    checked,
    onCheckedChange,
    onClick,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...buttonProps
  },
  ref,
) {
  const ids = useFormFieldIds({ id, helperText, error, helperTextId, errorId });
  const describedBy = joinIds(ariaDescribedBy, ids.helperTextId, ids.errorId);

  return (
    <div className={styles.checkField}>
      <button
        {...buttonProps}
        ref={ref}
        id={ids.controlId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-required={required || undefined}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
        disabled={disabled}
        className={[styles.switchButton, className].filter(Boolean).join(' ')}
        onClick={(event) => {
          onClick?.(event);
          if (!event.defaultPrevented) onCheckedChange?.(!checked);
        }}
      >
        <span
          className={[styles.switchTrack, checked && styles.switchChecked].filter(Boolean).join(' ')}
          aria-hidden="true"
        >
          <span className={styles.switchThumb} />
        </span>
        <span>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </span>
      </button>
      {helperText && (
        <p id={ids.helperTextId} className={[styles.helper, styles.indentedText].join(' ')}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={ids.errorId} className={[styles.error, styles.indentedText].join(' ')} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
