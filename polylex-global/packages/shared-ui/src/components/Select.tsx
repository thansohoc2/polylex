import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import type { FormFieldContract } from '../types/form.types';
import styles from './FormControls.module.css';
import { joinIds, useFormFieldIds } from './useFormFieldIds';

export interface SelectOption {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
}

export type SelectProps = FormFieldContract &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'disabled' | 'id' | 'required'> & {
    options?: readonly SelectOption[];
  };

/** A labelled native select. Supply `options` or regular `<option>` children. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    helperText,
    error,
    required,
    disabled,
    id,
    helperTextId,
    errorId,
    options,
    children,
    className,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    ...selectProps
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
      <select
        {...selectProps}
        ref={ref}
        id={ids.controlId}
        required={required}
        disabled={disabled}
        aria-required={required || undefined}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={describedBy}
        className={[styles.control, error && styles.invalid, className].filter(Boolean).join(' ')}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
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
