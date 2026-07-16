import { forwardRef, type InputHTMLAttributes } from 'react';
import type { FormFieldContract } from '../types/form.types';
import styles from './FormControls.module.css';
import { joinIds, useFormFieldIds } from './useFormFieldIds';

export type TextFieldProps = FormFieldContract &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'disabled' | 'id' | 'required'>;

/** A labelled native input that preserves all standard input behavior and props. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
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
    <div className={styles.field}>
      <label className={styles.label} htmlFor={ids.controlId}>
        {label}
        {required && (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        {...inputProps}
        ref={ref}
        id={ids.controlId}
        required={required}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
        className={[styles.control, error && styles.invalid, className].filter(Boolean).join(' ')}
      />
      {helperText && (
        <p id={ids.helperTextId} className={styles.helper}>
          {helperText}
        </p>
      )}
      {error && (
        <p id={ids.errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
