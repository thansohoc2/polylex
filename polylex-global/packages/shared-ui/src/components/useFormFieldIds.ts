import { useId } from 'react';
import type { FormFieldContract, FormFieldIds } from '../types/form.types';

export function useFormFieldIds({
  id,
  helperText,
  error,
  helperTextId,
  errorId,
}: Pick<FormFieldContract, 'id' | 'helperText' | 'error' | 'helperTextId' | 'errorId'>): FormFieldIds {
  const generatedId = useId().replace(/:/g, '');
  const controlId = id ?? `field-${generatedId}`;

  return {
    controlId,
    helperTextId: helperText ? (helperTextId ?? `${controlId}-helper`) : undefined,
    errorId: error ? (errorId ?? `${controlId}-error`) : undefined,
  };
}

export function joinIds(...ids: Array<string | undefined>): string | undefined {
  const value = ids.filter(Boolean).join(' ');
  return value || undefined;
}
