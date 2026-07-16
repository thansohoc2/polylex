import { forwardRef, type InputHTMLAttributes } from 'react';
import type { FormFieldContract } from '../types/form.types';
import styles from './FormControls.module.css';
import { joinIds, useFormFieldIds } from './useFormFieldIds';

export type CheckboxProps = FormFieldContract &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'disabled' | 'id' | 'required' | 'type'>;

/** A native checkbox with a full-label 44px click target. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  {
    label,
    helperText,
    error,
    required,
    disabled,
    id,
    helperTextId,
    errorId,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...inputProps
  },
  ref,
) {
  const ids = useFormFieldIds({ id, helperText, error, helperTextId, errorId });
  const describedBy = joinIds(ariaDescribedBy, ids.helperTextId, ids.errorId);

  return (
    <div className={styles.checkField}>
      <label className={[styles.checkLabel, disabled && styles.checkLabelDisabled].filter(Boolean).join(' ')}>
        <input
          {...inputProps}
          ref={ref}
          id={ids.controlId}
          type="checkbox"
          required={required}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          className={[styles.checkbox, className].filter(Boolean).join(' ')}
        />
        <span>
          {label}
          {required && (
            <span className={styles.required} aria-hidden="true">
              *
            </span>
          )}
        </span>
      </label>
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
