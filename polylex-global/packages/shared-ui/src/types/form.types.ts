import type { ReactNode } from 'react';

/** IDs used to associate a native form control with its supporting text. */
export interface FormFieldIds {
  controlId: string;
  helperTextId?: string;
  errorId?: string;
}

/** Common, native-first presentation contract for labelled form controls. */
export interface FormFieldContract {
  label: ReactNode;
  helperText?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  helperTextId?: string;
  errorId?: string;
}
